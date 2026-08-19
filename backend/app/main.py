from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from sqlalchemy.exc import IntegrityError
from decimal import Decimal
from io import BytesIO
from datetime import date, datetime, timedelta
from typing import Optional, List
import os
import logging
import traceback

from app.database import get_db, init_db
from app.models import (
    Categoria, Fornecedor, Produto, Funcionario, FolhaPagamento,
    FluxoCaixa, Safra, AlertaEstoque, Usuario, Compra, ItemCompra, AplicacaoInsumo,
    OrdemAplicacao, ItemOrdemAplicacao
)
from app.auth import (
    hash_senha, verificar_senha, create_access_token,
    get_current_user, require_admin, COOKIE_NAME, COOKIE_SECURE, COOKIE_SAMESITE
)
from app.audit import registrar_log
from app import schemas
from app.utils.calculadora_tanques import calcular_tanques

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CATEGORIAS_AGRICOLAS_PADRAO = (
    "Adubos",
    "Defensivos",
    "Sementes",
    "Peças",
    "Combustíveis",
)

app = FastAPI(
    title="Agro-BI API",
    description="API para Sistema de Gestão Agrícola e Business Intelligence",
    version="1.0.0"
)
@app.get("/")
def root():
    return {"message": "API está funcionando!"}

# =
# ---------------------------------------------------------------------
# Rate Limiting (proteção contra brute force / DoS)
# ---------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Muitas requisições. Tente novamente mais tarde."},
    )


# ---------------------------------------------------------------------
# CORS restrito (sem wildcard com credentials)
# ---------------------------------------------------------------------
origins_padrao = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://agro-bi-system-production.up.railway.app",
    "https://agro-bi-system.vercel.app",
    "https://agro-bi-system-r30kftf2v-nlp-gdevs.vercel.app",
    "https://agro-bi-system-jy9cjtz6v-nlp-gdevs.vercel.app"
]
origins = [origem.strip() for origem in os.getenv("CORS_ORIGINS", ",".join(origins_padrao)).split(",") if origem.strip()]
if "*" in origins:
    raise RuntimeError("CORS_ORIGINS não pode conter wildcard (*)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# ---------------------------------------------------------------------
# Security Headers (CSP, HSTS, X-Content-Type-Options, etc.)
# ---------------------------------------------------------------------
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if os.getenv("ENABLE_HSTS", "false").lower() == "true" or os.getenv("ENVIRONMENT", "development").lower() == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Initialize database on startup
@app.on_event("startup")
async def startup():
    init_db()
    criar_categorias_iniciais()
    criar_usuarios_iniciais()
    criar_dados_demonstracao()
    logger.info("Database initialized")


def criar_categorias_iniciais():
    """Garante as categorias agrícolas sugeridas, sem alterar categorias existentes."""
    db = next(get_db())
    try:
        for nome in CATEGORIAS_AGRICOLAS_PADRAO:
            existente = db.query(Categoria).filter(Categoria.nome == nome).first()
            if not existente:
                db.add(Categoria(nome=nome))
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar categorias iniciais: {e}")
    finally:
        db.close()


def criar_usuarios_iniciais():
    """Cria os usuários iniciais de teste (admin e gerente) se não existirem."""
    if os.getenv("ENVIRONMENT", "development").lower() == "production":
        logger.info("Seed de usuários padrão ignorado em produção")
        return

    db = next(get_db())
    try:
        usuarios_seed = [
            {
                "nome": "Administrador (Dono)",
                "email": "admin@agro.com",
                "senha": "admin123",
                "role": "ADMIN",
            },
            {
                "nome": "Gerente de Campo",
                "email": "gerente@agro.com",
                "senha": "gerente123",
                "role": "GERENTE",
            },
        ]

        for dados in usuarios_seed:
            existente = db.query(Usuario).filter(Usuario.email == dados["email"]).first()
            if not existente:
                db.add(Usuario(
                    nome=dados["nome"],
                    email=dados["email"],
                    senha_hash=hash_senha(dados["senha"]),
                    role=dados["role"],
                ))
                logger.info(f"Usuário inicial criado: {dados['email']} ({dados['role']})")

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar usuários iniciais: {e}")
    finally:
        db.close()


def criar_dados_demonstracao():
    """Garante dados mínimos de demonstração sem duplicar dados existentes."""
    db = next(get_db())
    try:
        categoria = db.query(Categoria).filter(Categoria.nome.in_(["Defensivos", "Defensivos Agrícolas"])).first()
        if not categoria:
            categoria = Categoria(nome="Defensivos")
            db.add(categoria)
            db.flush()

        fornecedor = db.query(Fornecedor).filter(Fornecedor.nome == "Fornecedor Demo Agro-BI").first()
        if not fornecedor:
            fornecedor = Fornecedor(nome="Fornecedor Demo Agro-BI")
            db.add(fornecedor)
            db.flush()

        produtos = []
        produtos_demo = [
            ("Herbicida Demo", 1000, 100, 80, 110),
            ("Fungicida Demo", 800, 80, 95, 130),
            ("Inseticida Demo", 600, 60, 70, 98),
            ("Adjuvante Demo", 400, 40, 25, 38),
        ]
        for nome, estoque, minimo, custo, venda in produtos_demo:
            produto = db.query(Produto).filter(Produto.nome == nome).first()
            if not produto:
                produto = Produto(nome=nome, categoria_id=categoria.id, fornecedor_id=fornecedor.id, estoque_atual=estoque, estoque_minimo=minimo, preco_custo=custo, preco_venda=venda, unidade_medida="Litro")
                db.add(produto)
                db.flush()
            produtos.append(produto)

        safras_demo = [
            ("Safra Demo 2026 - Soja", "Soja", date(2026, 1, 10), 250, 45000),
            ("Safra Demo 2026 - Milho", "Milho", date(2026, 2, 15), 180, 32000),
        ]
        for nome, cultura, inicio, hectares, custo in safras_demo:
            if not db.query(Safra).filter(Safra.nome_safra == nome).first():
                db.add(Safra(nome_safra=nome, cultura=cultura, data_inicio=inicio, data_fim=None, hectares_plantados=hectares, sacas_produzidas=None, custo_total_acumulado=custo))

        fluxos_demo = [
            ("Receita", 85000, "Venda de grãos", "Venda demonstrativa de soja", date(2026, 7, 10)),
            ("Despesa", 18000, "Insumos", "Compra demonstrativa de defensivos", date(2026, 7, 12)),
            ("Despesa", 9500, "Manutenção", "Manutenção demonstrativa de máquinas", date(2026, 7, 20)),
        ]
        for tipo, valor, categoria_financeira, descricao, data_lancamento in fluxos_demo:
            if not db.query(FluxoCaixa).filter(FluxoCaixa.descricao == descricao).first():
                db.add(FluxoCaixa(tipo=tipo, valor=valor, categoria_financeira=categoria_financeira, descricao=descricao, data=data_lancamento))
        db.flush()

        ordem = db.query(OrdemAplicacao).filter(OrdemAplicacao.fazenda == "Fazenda Demo Norte").first()
        if ordem:
            db.commit()
            logger.info("Dados demonstrativos já existentes; itens ausentes foram completados")
            return

        ordem = OrdemAplicacao(
            fazenda="Fazenda Demo Norte",
            cultura="Soja",
            variedade="BMX Demo",
            data_recomendacao=date(2026, 8, 1),
            data_maxima_aplicacao=date(2026, 8, 25),
            tipo_maquina="Pulverizador",
            operador="Operador Demo",
            modelo_maquina="Pulverizador 2000 L",
            capacidade_tanque_l=2000,
            vazao_l_ha=100,
            pressao_bar=3,
            velocidade_kmh=12,
            bico="11002",
            area_total_ha=100,
        )
        db.add(ordem)
        db.flush()
        item = ItemOrdemAplicacao(ordem_id=ordem.id, produto_id=produtos[0].id, dose_ha=2, quantidade_total=200)
        produtos[0].estoque_atual -= item.quantidade_total
        db.add(item)
        db.commit()
        logger.info("Dados demonstrativos criados")
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar dados demonstrativos: {e}")
    finally:
        db.close()


# Health check (protegido por rate limit)
@app.get("/health")
@limiter.limit("20/minute")
async def health_check(request: Request):
    return {"status": "ok", "timestamp": datetime.utcnow()}


# ============= AUTENTICAÇÃO (JWT) =============

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Autentica o usuário por e-mail e senha.
    Aceita 'application/x-www-form-urlencoded' (padrão OAuth2).
    Retorna o token JWT e define um cookie HttpOnly + SameSite=Strict.
    """
    email = form_data.username.strip().lower()
    user = db.query(Usuario).filter(Usuario.email == email).with_for_update().first()
    agora = datetime.utcnow()
    if user and user.bloqueado_ate and user.bloqueado_ate > agora:
        raise HTTPException(status_code=429, detail="Conta temporariamente bloqueada. Tente novamente em 15 minutos.")

    senha_valida = user is not None and user.ativo and verificar_senha(form_data.password, user.senha_hash)
    if not senha_valida:
        if user and user.ativo:
            user.falhas_login += 1
            if user.falhas_login >= 5:
                user.bloqueado_ate = agora + timedelta(minutes=15)
                db.commit()
                raise HTTPException(status_code=429, detail="Conta temporariamente bloqueada após tentativas inválidas.")
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user.falhas_login = 0
    user.bloqueado_ate = None
    db.commit()
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "nome": user.nome}
    )

    # Define o cookie HttpOnly (o token não fica acessível via JS)
    response.set_cookie(
        key=COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=60 * 60 * 8,  # 8 horas
        path="/",
    )
    logger.info(f"Login realizado com sucesso por: {user.email}")
    return {
        "role": user.role,
        "nome": user.nome,
        "email": user.email,
    }


@app.post("/api/auth/logout")
def logout(response: Response):
    """Limpa o cookie de autenticação (logout)."""
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"detail": "Logout realizado com sucesso."}


@app.get("/api/auth/me", response_model=schemas.UsuarioResponse)
def obter_usuario_atual(current_user: Usuario = Depends(get_current_user)):
    """Retorna os dados do usuário autenticado (útil para validar o token)."""
    return current_user


# ============= USUÁRIOS (somente ADMIN) =============
@app.get("/api/usuarios", response_model=List[schemas.UsuarioResponse])
async def listar_usuarios(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    return db.query(Usuario).order_by(Usuario.nome.asc()).all()


@app.post("/api/usuarios", response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def criar_usuario(
    usuario: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    try:
        email = usuario.email.strip().lower()
        if db.query(Usuario).filter(Usuario.email == email).first():
            raise HTTPException(status_code=409, detail="Já existe um usuário com este e-mail")

        novo_usuario = Usuario(
            nome=usuario.nome.strip(),
            email=email,
            senha_hash=hash_senha(usuario.senha),
            role=usuario.role,
            ativo=True,
        )
        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        registrar_log(current_user.id, "CRIAR_USUARIO", f"Usuário #{novo_usuario.id} criado com papel {novo_usuario.role}")
        return novo_usuario
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe um usuário com este e-mail")
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar usuário: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar usuário")


@app.patch("/api/usuarios/{usuario_id}", response_model=schemas.UsuarioResponse)
async def atualizar_usuario(
    usuario_id: int,
    dados: schemas.UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if usuario.id == current_user.id and dados.ativo is False:
        raise HTTPException(status_code=422, detail="O administrador não pode bloquear a própria conta")
    if dados.email:
        email = dados.email.strip().lower()
        existente = db.query(Usuario).filter(Usuario.email == email, Usuario.id != usuario_id).first()
        if existente:
            raise HTTPException(status_code=409, detail="Já existe um usuário com este e-mail")
        usuario.email = email
    if dados.nome is not None:
        usuario.nome = dados.nome.strip()
    if dados.senha:
        usuario.senha_hash = hash_senha(dados.senha)
    if dados.role is not None:
        usuario.role = dados.role
    if dados.ativo is not None:
        usuario.ativo = dados.ativo

    try:
        db.commit()
        db.refresh(usuario)
        registrar_log(current_user.id, "ATUALIZAR_USUARIO", f"Usuário #{usuario.id} atualizado")
        return usuario
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Não foi possível atualizar o usuário")
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar usuário: {e}")
        raise HTTPException(status_code=500, detail="Erro ao atualizar usuário")


# ============= CATEGORIAS =============
@app.get("/api/categorias", response_model=List[schemas.CategoriaResponse])
async def listar_categorias(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """List all product categories. (Acesso ADMIN e GERENTE)"""
    try:
        categorias = db.query(Categoria).all()
        return categorias
    except Exception as e:
        logger.error(f"Erro ao listar categorias: {e}")
        return []

@app.post("/api/categorias", response_model=schemas.CategoriaResponse)
async def criar_categoria(
    categoria: schemas.CategoriaBase,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Create a new category. (Acesso ADMIN e GERENTE)"""
    try:
        db_categoria = Categoria(nome=categoria.nome)
        db.add(db_categoria)
        db.commit()
        db.refresh(db_categoria)
        return db_categoria
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe uma categoria com este nome")
    except Exception as e:
        logger.error(f"Erro ao criar categoria: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar categoria")

# ============= FORNECEDORES =============
@app.get("/api/fornecedores", response_model=List[schemas.FornecedorResponse])
async def listar_fornecedores(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """List all suppliers. (Acesso ADMIN e GERENTE)"""
    try:
        fornecedores = db.query(Fornecedor).all()
        return fornecedores
    except Exception as e:
        logger.error(f"Erro ao listar fornecedores: {e}")
        return []

@app.post("/api/fornecedores", response_model=schemas.FornecedorResponse)
async def criar_fornecedor(
    fornecedor: schemas.FornecedorBase,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Create a new supplier. (Acesso ADMIN e GERENTE)"""
    try:
        db_fornecedor = Fornecedor(**fornecedor.dict())
        db.add(db_fornecedor)
        db.commit()
        db.refresh(db_fornecedor)
        return db_fornecedor
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe um fornecedor com este nome ou CNPJ")
    except Exception as e:
        logger.error(f"Erro ao criar fornecedor: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar fornecedor")

# ============= PRODUTOS =============
@app.get("/api/produtos", response_model=List[schemas.ProdutoResponse])
async def listar_produtos(
    categoria_id: Optional[int] = Query(None),
    fornecedor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """List all products with optional filters. (Acesso ADMIN e GERENTE)"""
    try:
        query = db.query(Produto)
        
        if categoria_id:
            query = query.filter(Produto.categoria_id == categoria_id)
        if fornecedor_id:
            query = query.filter(Produto.fornecedor_id == fornecedor_id)
        
        produtos = query.all()
        return produtos
    except Exception as e:
        logger.error(f"Erro ao listar produtos: {e}")
        return []

@app.get("/api/produtos/{produto_id}", response_model=schemas.ProdutoResponse)
async def obter_produto(
    produto_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Get a specific product by ID. (Acesso ADMIN e GERENTE)"""
    try:
        produto = db.query(Produto).filter(Produto.id == produto_id).first()
        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        return produto
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter produto: {e}")
        raise HTTPException(status_code=500, detail="Erro ao obter produto")

@app.post("/api/produtos", response_model=schemas.ProdutoResponse)
async def criar_produto(
    produto: schemas.ProdutoBase,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Create a new product. (Acesso ADMIN e GERENTE)"""
    try:
        db_produto = Produto(**produto.dict())
        db.add(db_produto)
        db.commit()
        db.refresh(db_produto)
        registrar_log(current_user.id, "CRIAR_PRODUTO", f"Produto #{db_produto.id}: {db_produto.nome}")
        return db_produto
    except Exception as e:
        logger.error(f"Erro ao criar produto: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar produto")


@app.patch("/api/produtos/{produto_id}", response_model=schemas.ProdutoResponse)
async def atualizar_produto(
    produto_id: int,
    produto_update: schemas.ProdutoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Atualiza parcialmente os dados de um produto. (Acesso ADMIN e GERENTE)"""
    try:
        db_produto = db.query(Produto).filter(Produto.id == produto_id).first()
        if not db_produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        dados_atualizacao = produto_update.model_dump(exclude_unset=True)
        if not dados_atualizacao:
            raise HTTPException(status_code=422, detail="Informe ao menos um campo para atualização")

        if "categoria_id" in dados_atualizacao and not db.query(Categoria).filter(
            Categoria.id == dados_atualizacao["categoria_id"]
        ).first():
            raise HTTPException(status_code=404, detail="Categoria não encontrada")
        if "fornecedor_id" in dados_atualizacao and not db.query(Fornecedor).filter(
            Fornecedor.id == dados_atualizacao["fornecedor_id"]
        ).first():
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        for campo, valor in dados_atualizacao.items():
            setattr(db_produto, campo, valor)

        db.commit()
        db.refresh(db_produto)
        registrar_log(
            current_user.id,
            "ATUALIZAR_PRODUTO",
            f"Produto #{db_produto.id}: campos {', '.join(dados_atualizacao.keys())}",
        )
        return db_produto
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar produto: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao atualizar produto")

# ============= FUNCIONARIOS (RH - somente ADMIN) =============
@app.get("/api/funcionarios", response_model=List[schemas.FuncionarioResponse])
async def listar_funcionarios(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """List all employees. (ADMIN only)"""
    try:
        funcionarios = db.query(Funcionario).filter(Funcionario.ativo == True).all()
        return funcionarios
    except Exception as e:
        logger.error(f"Erro ao listar funcionarios: {e}")
        return []

@app.post("/api/funcionarios", response_model=schemas.FuncionarioResponse)
async def criar_funcionario(
    funcionario: schemas.FuncionarioBase,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Create a new employee."""
    try:
        db_funcionario = Funcionario(**funcionario.dict())
        db.add(db_funcionario)
        db.commit()
        db.refresh(db_funcionario)
        registrar_log(current_user.id, "CRIAR_FUNCIONARIO", f"Funcionário #{db_funcionario.id}: {db_funcionario.nome}")
        return db_funcionario
    except Exception as e:
        logger.error(f"Erro ao criar funcionario: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar funcionario")


@app.put("/api/funcionarios/{funcionario_id}", response_model=schemas.FuncionarioResponse)
async def atualizar_funcionario(
    funcionario_id: int,
    funcionario_update: schemas.FuncionarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Atualiza os dados de um funcionário. (ADMIN only)"""
    try:
        db_funcionario = db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
        if not db_funcionario:
            raise HTTPException(status_code=404, detail="Funcionário não encontrado")

        dados_atualizacao = funcionario_update.model_dump(exclude_unset=True)
        if not dados_atualizacao:
            raise HTTPException(status_code=422, detail="Informe ao menos um campo para atualização")

        for campo, valor in dados_atualizacao.items():
            setattr(db_funcionario, campo, valor)

        db.commit()
        db.refresh(db_funcionario)
        registrar_log(
            current_user.id,
            "ATUALIZAR_FUNCIONARIO",
            f"Funcionário #{db_funcionario.id}: campos {', '.join(dados_atualizacao.keys())}",
        )
        return db_funcionario
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar funcionário: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao atualizar funcionário")

@app.delete("/api/funcionarios/{funcionario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_funcionario(
    funcionario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Delete an employee. (ADMIN only)"""
    try:
        db_funcionario = db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
        if not db_funcionario:
            raise HTTPException(status_code=404, detail="Funcionário não encontrado")
        
        db_funcionario.ativo = False
        db.commit()
        registrar_log(current_user.id, "INATIVAR_FUNCIONARIO", f"Funcionário #{db_funcionario.id}: {db_funcionario.nome}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar funcionário: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao deletar funcionário")
    
# ============= FLUXO DE CAIXA (Financeiro - somente ADMIN) =============
@app.get("/api/fluxo-caixa", response_model=List[schemas.FluxoCaixaResponse])
async def listar_fluxo_caixa(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """List cash flow records with optional date filter. (ADMIN only)"""
    try:
        query = db.query(FluxoCaixa)
        
        if data_inicio:
            query = query.filter(FluxoCaixa.data >= data_inicio)
        if data_fim:
            query = query.filter(FluxoCaixa.data <= data_fim)
        
        fluxo = query.order_by(FluxoCaixa.data.desc()).all()
        return fluxo
    except Exception as e:
        logger.error(f"Erro ao listar fluxo de caixa: {e}")
        return []

@app.post("/api/fluxo-caixa", response_model=schemas.FluxoCaixaResponse)
async def criar_fluxo_caixa(
    fluxo: schemas.FluxoCaixaBase,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Create a new cash flow record. (ADMIN only)"""
    try:
        db_fluxo = FluxoCaixa(**fluxo.dict())
        db.add(db_fluxo)
        db.commit()
        db.refresh(db_fluxo)
        registrar_log(
            current_user.id,
            "CRIAR_FLUXO_CAIXA",
            f"Lançamento #{db_fluxo.id}: {db_fluxo.tipo} - {db_fluxo.categoria_financeira}",
        )
        return db_fluxo
    except Exception as e:
        logger.error(f"Erro ao criar fluxo de caixa: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar fluxo de caixa")


# ============= COMPRAS (Financeiro/Estoque - somente ADMIN) =============
@app.post("/api/compras", response_model=schemas.CompraResponse, status_code=status.HTTP_201_CREATED)
async def criar_compra(
    compra: schemas.CompraCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Registra uma compra e incorpora todos os itens ao estoque de forma atômica."""
    try:
        fornecedor = db.query(Fornecedor).filter(Fornecedor.id == compra.fornecedor_id).first()
        if not fornecedor:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        produto_ids = [item.produto_id for item in compra.itens]
        if len(produto_ids) != len(set(produto_ids)):
            raise HTTPException(status_code=422, detail="Um produto só pode aparecer uma vez na compra")

        produtos = {}
        for produto_id in produto_ids:
            produto = db.query(Produto).filter(Produto.id == produto_id).with_for_update().first()
            if not produto:
                raise HTTPException(status_code=404, detail=f"Produto {produto_id} não encontrado")
            produtos[produto_id] = produto

        valor_total = sum(
            (item.quantidade * item.preco_unitario for item in compra.itens),
            Decimal("0"),
        )
        db_compra = Compra(fornecedor_id=fornecedor.id, valor_total=valor_total)
        db.add(db_compra)
        db.flush()

        for item in compra.itens:
            produto = produtos[item.produto_id]
            produto.estoque_atual += item.quantidade
            db.add(ItemCompra(
                compra_id=db_compra.id,
                produto_id=produto.id,
                quantidade=item.quantidade,
                preco_unitario=item.preco_unitario,
            ))

        db.commit()
        db.refresh(db_compra)
        registrar_log(
            current_user.id,
            "CRIAR_COMPRA",
            f"Compra #{db_compra.id} do fornecedor #{fornecedor.id}: {len(compra.itens)} item(ns)",
        )
        return db_compra
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar compra: {e}")
        raise HTTPException(status_code=500, detail="Erro ao registrar compra")

# ============= SAFRAS =============
@app.get("/api/safras", response_model=List[schemas.SafraResponse])
async def listar_safras(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """List all crops. (Acesso ADMIN e GERENTE)"""
    try:
        safras = db.query(Safra).order_by(Safra.data_inicio.desc()).all()
        return safras
    except Exception as e:
        logger.error(f"Erro ao listar safras: {e}")
        return []

@app.post("/api/safras", response_model=schemas.SafraResponse)
async def criar_safra(
    safra: schemas.SafraBase,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Create a new crop record. (Acesso ADMIN e GERENTE)"""
    try:
        dados_safra = safra.model_dump()
        dados_safra["producao_total"] = (
            dados_safra["producao_total"]
            if dados_safra["producao_total"] is not None
            else dados_safra["sacas_produzidas"]
        )
        dados_safra["custo_total"] = dados_safra["custo_total"] if dados_safra["custo_total"] is not None else dados_safra["custo_total_acumulado"]
        db_safra = Safra(**dados_safra)
        db.add(db_safra)
        db.commit()
        db.refresh(db_safra)
        return db_safra
    except Exception as e:
        logger.error(f"Erro ao criar safra: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar safra")


# ============= APLICAÇÕES DE INSUMOS =============
@app.post("/api/aplicacoes", response_model=schemas.AplicacaoInsumoResponse, status_code=status.HTTP_201_CREATED)
async def criar_aplicacao_insumo(
    aplicacao: schemas.AplicacaoInsumoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Aplica um insumo à safra, baixando estoque e incorporando o custo de forma atômica."""
    try:
        safra = db.query(Safra).filter(Safra.id == aplicacao.safra_id).with_for_update().first()
        if not safra:
            raise HTTPException(status_code=404, detail="Safra não encontrada")

        produto = db.query(Produto).filter(Produto.id == aplicacao.produto_id).with_for_update().first()
        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        if produto.estoque_atual < aplicacao.quantidade_usada:
            raise HTTPException(status_code=422, detail="Estoque insuficiente para esta aplicação")

        custo_aplicacao = produto.preco_custo * aplicacao.quantidade_usada
        produto.estoque_atual -= aplicacao.quantidade_usada
        custo_base = safra.custo_total if safra.custo_total is not None else safra.custo_total_acumulado
        safra.custo_total = (custo_base or Decimal("0")) + custo_aplicacao

        db_aplicacao = AplicacaoInsumo(
            safra_id=safra.id,
            produto_id=produto.id,
            quantidade_usada=aplicacao.quantidade_usada,
            custo_total=custo_aplicacao,
            data_aplicacao=aplicacao.data_aplicacao or date.today(),
        )
        db.add(db_aplicacao)
        db.commit()
        db.refresh(db_aplicacao)
        registrar_log(
            current_user.id,
            "APLICACAO_INSUMO",
            f"Aplicação #{db_aplicacao.id}: safra #{safra.id}, produto #{produto.id}, quantidade {aplicacao.quantidade_usada}",
        )
        return db_aplicacao
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao registrar aplicação de insumo: {e}")
        raise HTTPException(status_code=500, detail="Erro ao registrar aplicação de insumo")

# ============= ORDENS DE APLICAÇÃO =============
@app.get("/api/ordens-aplicacao", response_model=List[schemas.OrdemAplicacaoResponse])
async def listar_ordens_aplicacao(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Lista as ordens mais recentes para acompanhamento operacional."""
    return db.query(OrdemAplicacao).order_by(OrdemAplicacao.created_at.desc()).all()


@app.get("/api/movimentacoes-estoque", response_model=List[schemas.MovimentacaoEstoqueResponse])
async def listar_movimentacoes_estoque(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Consolida compras como entradas e ordens de aplicação como saídas."""
    movimentacoes = []
    compras = (
        db.query(ItemCompra, Compra, Produto)
        .join(Compra, ItemCompra.compra_id == Compra.id)
        .join(Produto, ItemCompra.produto_id == Produto.id)
        .all()
    )
    for item, compra, produto in compras:
        movimentacoes.append({
            "id": item.id,
            "tipo": "ENTRADA",
            "produto_id": produto.id,
            "produto_nome": produto.nome,
            "quantidade": item.quantidade,
            "data": compra.created_at,
            "referencia": f"Compra #{compra.id}",
        })

    itens_ordem = (
        db.query(ItemOrdemAplicacao, OrdemAplicacao, Produto)
        .join(OrdemAplicacao, ItemOrdemAplicacao.ordem_id == OrdemAplicacao.id)
        .join(Produto, ItemOrdemAplicacao.produto_id == Produto.id)
        .all()
    )
    for item, ordem, produto in itens_ordem:
        movimentacoes.append({
            "id": item.id,
            "tipo": "SAIDA",
            "produto_id": produto.id,
            "produto_nome": produto.nome,
            "quantidade": item.quantidade_total,
            "data": ordem.created_at,
            "referencia": f"Ordem de aplicação #{ordem.id}",
        })

    return sorted(movimentacoes, key=lambda item: item["data"] or datetime.min, reverse=True)


@app.post("/api/ordens-aplicacao", response_model=schemas.OrdemAplicacaoResponse, status_code=status.HTTP_201_CREATED)
async def criar_ordem_aplicacao(
    ordem: schemas.OrdemAplicacaoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cria uma ordem, reserva os insumos e baixa o estoque de forma atômica."""
    try:
        produto_ids = [item.produto_id for item in ordem.itens]
        if len(produto_ids) != len(set(produto_ids)):
            raise HTTPException(status_code=422, detail="Um produto só pode aparecer uma vez na ordem")

        produtos = {}
        for produto_id in produto_ids:
            produto = db.query(Produto).filter(Produto.id == produto_id).with_for_update().first()
            if not produto:
                raise HTTPException(status_code=404, detail=f"Produto {produto_id} não encontrado")
            produtos[produto_id] = produto

        quantidades = {
            item.produto_id: item.dose_ha * ordem.area_total_ha
            for item in ordem.itens
        }
        for produto_id, quantidade in quantidades.items():
            if produtos[produto_id].estoque_atual < quantidade:
                raise HTTPException(
                    status_code=422,
                    detail=f"Estoque insuficiente para o produto {produto_id}. Disponível: {produtos[produto_id].estoque_atual}",
                )

        dados_ordem = ordem.model_dump(exclude={"itens"})
        dados_ordem["tipo_maquina"] = ordem.tipo_maquina.value
        db_ordem = OrdemAplicacao(**dados_ordem)
        db.add(db_ordem)
        db.flush()

        for item in ordem.itens:
            quantidade = quantidades[item.produto_id]
            produtos[item.produto_id].estoque_atual -= quantidade
            db.add(ItemOrdemAplicacao(
                ordem_id=db_ordem.id,
                produto_id=item.produto_id,
                dose_ha=item.dose_ha,
                quantidade_total=quantidade,
            ))

        db.commit()
        db.refresh(db_ordem)
        registrar_log(
            current_user.id,
            "CRIAR_ORDEM_APLICACAO",
            f"Ordem #{db_ordem.id}: {ordem.fazenda}, {len(ordem.itens)} produto(s), área {ordem.area_total_ha} ha",
        )
        return db_ordem
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar ordem de aplicação: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar ordem de aplicação")


@app.get("/api/ordens-aplicacao/{ordem_id}/pdf")
async def gerar_pdf_ordem_aplicacao(
    ordem_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Gera a ordem de aplicação em PDF para impressão ou download."""
    ordem = db.query(OrdemAplicacao).filter(OrdemAplicacao.id == ordem_id).first()
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de aplicação não encontrada")

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    calculo = calcular_tanques(
        ordem.area_total_ha,
        ordem.vazao_l_ha,
        ordem.capacidade_tanque_l,
        [{"produto_id": item.produto_id, "dose_ha": item.dose_ha} for item in ordem.itens],
    )
    buffer = BytesIO()
    documento = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5 * cm, leftMargin=1.5 * cm)
    estilos = getSampleStyleSheet()
    elementos = [
        Paragraph("ORDEM DE APLICAÇÃO", estilos["Title"]),
        Paragraph(f"Ordem #{ordem.id} | Emitida em {date.today().strftime('%d/%m/%Y')}", estilos["Normal"]),
        Spacer(1, 0.35 * cm),
    ]
    dados = [
        ["Fazenda", ordem.fazenda, "Cultura", f"{ordem.cultura} - {ordem.variedade}"],
        ["Recomendação", ordem.data_recomendacao.strftime("%d/%m/%Y"), "Aplicar até", ordem.data_maxima_aplicacao.strftime("%d/%m/%Y")],
        ["Máquina", f"{ordem.tipo_maquina} - {ordem.modelo_maquina}", "Operador", ordem.operador],
        ["Área", f"{ordem.area_total_ha} ha", "Bico / pressão", f"{ordem.bico} / {ordem.pressao_bar} bar"],
        ["Vazão / velocidade", f"{ordem.vazao_l_ha} L/ha / {ordem.velocidade_kmh} km/h", "Tanque", f"{ordem.capacidade_tanque_l} L"],
    ]
    tabela = Table(dados, colWidths=[3.2 * cm, 6.2 * cm, 3.2 * cm, 5.0 * cm])
    tabela.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e7f0e8")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elementos.extend([tabela, Spacer(1, 0.35 * cm), Paragraph("DIVISÃO DE TANQUES", estilos["Heading2"])])
    linhas_tanques = [["Tanques cheios", "Área por tanque", "Tanque parcial", "Volume parcial"]]
    linhas_tanques.append([
        str(calculo["total_tanques_cheios"]),
        f"{calculo['ha_por_tanque']:.2f} ha",
        f"{calculo['area_tanque_parcial']:.2f} ha",
        f"{calculo['volume_tanque_parcial']:.2f} L",
    ])
    tabela_tanques = Table(linhas_tanques, colWidths=[4.1 * cm] * 4)
    tabela_tanques.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2f6f44")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elementos.extend([tabela_tanques, Spacer(1, 0.35 * cm), Paragraph("PRODUTOS E DOSES", estilos["Heading2"])])
    linhas_produtos = [["Produto", "Dose/ha", "Quantidade total", "Dose tanque cheio", "Dose parcial"]]
    calculos_produtos = {item["produto_id"]: item for item in calculo["produtos"]}
    for item in ordem.itens:
        produto = db.query(Produto).filter(Produto.id == item.produto_id).first()
        produto_calculo = calculos_produtos[item.produto_id]
        linhas_produtos.append([
            produto.nome if produto else str(item.produto_id),
            f"{item.dose_ha}",
            f"{item.quantidade_total}",
            f"{produto_calculo['dose_por_tanque_cheio']:.2f}",
            f"{produto_calculo['dose_por_tanque_parcial']:.2f}",
        ])
    tabela_produtos = Table(linhas_produtos, colWidths=[5.2 * cm, 2.3 * cm, 3.0 * cm, 3.2 * cm, 3.2 * cm])
    tabela_produtos.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2f6f44")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elementos.extend([
        tabela_produtos,
        Spacer(1, 0.5 * cm),
        Paragraph("ATENÇÃO: utilizar EPI completo conforme rótulo e bula de cada produto.", estilos["Heading3"]),
        Paragraph(f"Rastreabilidade: ordem #{ordem.id} | operador: {ordem.operador} | emissão: {datetime.now().strftime('%d/%m/%Y %H:%M')}", estilos["Normal"]),
    ])
    documento.build(elementos)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="ordem-aplicacao-{ordem.id}.pdf"'},
    )


# ============= ALERTAS DE ESTOQUE =============
@app.get("/api/alertas-estoque", response_model=List[schemas.AlertaEstoqueResponse])
async def listar_alertas_estoque(
    resolvido: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """List stock alerts. (Acesso ADMIN e GERENTE)"""
    try:
        query = db.query(AlertaEstoque)
        
        if resolvido is not None:
            query = query.filter(AlertaEstoque.resolvido == resolvido)
        
        alertas = query.order_by(AlertaEstoque.created_at.desc()).all()
        return alertas
    except Exception as e:
        logger.error(f"Erro ao listar alertas de estoque: {e}")
        return []

@app.post("/api/alertas-estoque", response_model=schemas.AlertaEstoqueResponse)
async def criar_alerta_estoque(
    alerta: schemas.AlertaEstoqueBase,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Create a new stock alert. (Acesso ADMIN e GERENTE)"""
    try:
        db_alerta = AlertaEstoque(**alerta.dict())
        db.add(db_alerta)
        db.commit()
        db.refresh(db_alerta)
        return db_alerta
    except Exception as e:
        logger.error(f"Erro ao criar alerta de estoque: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar alerta de estoque")

@app.patch("/api/alertas-estoque/{alerta_id}", response_model=schemas.AlertaEstoqueResponse)
async def resolver_alerta_estoque(
    alerta_id: int,
    alerta_update: schemas.AlertaEstoqueUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Resolve a stock alert (mark as resolved). (Acesso ADMIN e GERENTE)"""
    try:
        db_alerta = db.query(AlertaEstoque).filter(AlertaEstoque.id == alerta_id).first()
        if not db_alerta:
            raise HTTPException(status_code=404, detail="Alerta não encontrado")
        
        # Atualizar campos fornecidos
        if alerta_update.resolvido is not None:
            db_alerta.resolvido = alerta_update.resolvido
        
        db.commit()
        db.refresh(db_alerta)
        return db_alerta
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao resolver alerta de estoque: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao resolver alerta de estoque")

@app.delete("/api/alertas-estoque/{alerta_id}")
async def deletar_alerta_estoque(
    alerta_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Delete a stock alert. (Acesso ADMIN e GERENTE)"""
    try:
        db_alerta = db.query(AlertaEstoque).filter(AlertaEstoque.id == alerta_id).first()
        if not db_alerta:
            raise HTTPException(status_code=404, detail="Alerta não encontrado")
        
        db.delete(db_alerta)
        db.commit()
        return {"detail": "Alerta deletado com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar alerta de estoque: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao deletar alerta de estoque")

# ============= BUSINESS INTELLIGENCE METRICS =============

@app.get("/api/bi/metricas", response_model=schemas.MetricasBI)
async def obter_metricas_bi(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Get main BI metrics: Estimated Revenue, Profit, Margin, Cost per Hectare. (ADMIN only)"""
    try:
        produtos = db.query(Produto).all()
        faturamento_estimado = Decimal("0")
        for p in produtos:
            faturamento_estimado += (p.estoque_atual * p.preco_venda)
        
        lucro_estimado = Decimal("0")
        for p in produtos:
            lucro_estimado += (p.estoque_atual * (p.preco_venda - p.preco_custo))
        
        if produtos:
            total_margin = Decimal("0")
            for p in produtos:
                if p.preco_venda > 0:
                    margin = ((p.preco_venda - p.preco_custo) / p.preco_venda) * 100
                    total_margin += margin
            margem_lucro_media = float(total_margin / len(produtos))
        else:
            margem_lucro_media = 0.0
        
        safras = db.query(Safra).filter(Safra.hectares_plantados > 0).all()
        if safras:
            total_custo = sum(
                (s.custo_total if s.custo_total is not None else s.custo_total_acumulado for s in safras),
                Decimal("0"),
            )
            total_producao = sum(
                (s.producao_total if s.producao_total is not None else s.sacas_produzidas or Decimal("0") for s in safras),
                Decimal("0"),
            )
            total_hectares = sum((s.hectares_plantados for s in safras), Decimal("0"))
            custo_por_hectare = float(total_custo / total_hectares) if total_hectares > 0 else 0.0
            custo_por_saca = float(total_custo / total_producao) if total_producao > 0 else 0.0
            produtividade_sacas_por_hectare = float(total_producao / total_hectares) if total_hectares > 0 else 0.0
        else:
            custo_por_hectare = 0.0
            custo_por_saca = 0.0
            produtividade_sacas_por_hectare = 0.0
        
        total_estoque_custo = Decimal("0")
        for p in produtos:
            total_estoque_custo += (p.estoque_atual * p.preco_custo)
        
        total_funcionarios = db.query(func.count(Funcionario.id)).filter(Funcionario.ativo == True).scalar()
        
        return schemas.MetricasBI(
            faturamento_estimado=float(faturamento_estimado),
            lucro_estimado=float(lucro_estimado),
            margem_lucro_media=margem_lucro_media,
            custo_por_hectare=custo_por_hectare,
            custo_por_saca=custo_por_saca,
            produtividade_sacas_por_hectare=produtividade_sacas_por_hectare,
            total_estoque_custo=float(total_estoque_custo),
            total_funcionarios=total_funcionarios or 0
        )
    except Exception as e:
        logger.error(f"Erro ao obter métricas de BI: {e}")
        return schemas.MetricasBI(
            faturamento_estimado=0.0,
            lucro_estimado=0.0,
            margem_lucro_media=0.0,
            custo_por_hectare=0.0,
            custo_por_saca=0.0,
            produtividade_sacas_por_hectare=0.0,
            total_estoque_custo=0.0,
            total_funcionarios=0
        )

@app.get("/api/bi/faturamento-por-categoria", response_model=List[schemas.DistribuicaoFaturamento])
async def obter_faturamento_por_categoria(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Get revenue distribution by product category. (ADMIN only)"""
    try:
        produtos = db.query(Produto).all()
        
        categoria_totais = {}
        for p in produtos:
            cat_nome = p.categoria.nome if p.categoria else "Sem Categoria"
            valor = p.estoque_atual * p.preco_venda
            categoria_totais[cat_nome] = categoria_totais.get(cat_nome, Decimal("0")) + valor
        
        total = sum(categoria_totais.values()) or Decimal("1")
        
        result = []
        for categoria, valor in categoria_totais.items():
            percentual = float((valor / total) * 100) if total > 0 else 0.0
            result.append(schemas.DistribuicaoFaturamento(
                categoria=categoria,
                valor=float(valor),
                percentual=percentual
            ))
        
        return sorted(result, key=lambda x: x.valor, reverse=True)
    except Exception as e:
        logger.error(f"Erro ao obter faturamento por categoria: {e}")
        return []

@app.get("/api/bi/investimento-estoque", response_model=List[schemas.InvestimentoEstoque])
async def obter_investimento_estoque(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Get investment distribution in inventory by category. (ADMIN only)"""
    try:
        produtos = db.query(Produto).all()
        
        categoria_investimento = {}
        for p in produtos:
            cat_nome = p.categoria.nome if p.categoria else "Sem Categoria"
            if cat_nome not in categoria_investimento:
                categoria_investimento[cat_nome] = {"quantidade": Decimal("0"), "valor": Decimal("0")}
            
            categoria_investimento[cat_nome]["quantidade"] += p.estoque_atual
            categoria_investimento[cat_nome]["valor"] += (p.estoque_atual * p.preco_custo)
        
        result = []
        for categoria, dados in categoria_investimento.items():
            result.append(schemas.InvestimentoEstoque(
                categoria=categoria,
                quantidade=float(dados["quantidade"]),
                valor_total=float(dados["valor"])
            ))
        
        return sorted(result, key=lambda x: x.valor_total, reverse=True)
    except Exception as e:
        logger.error(f"Erro ao obter investimento em estoque: {e}")
        return []

@app.get("/api/bi/grafico-fluxo-caixa", response_model=schemas.DadosGrafico)
async def obter_grafico_fluxo_caixa(
    meses: int = Query(6),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin)
):
    """Get cash flow data for chart (last N months). (ADMIN only)"""
    try:
        data_fim = datetime.utcnow().date()
        data_inicio = data_fim - timedelta(days=30 * meses)
        
        logger.info(f"Buscando fluxo de caixa de {data_inicio} a {data_fim}")
        
        # Fetch all records in the date range (simple query to avoid SQL aggregation issues)
        registros = db.query(FluxoCaixa).filter(
            and_(FluxoCaixa.data >= data_inicio, FluxoCaixa.data <= data_fim)
        ).all()
        
        logger.info(f"Registros encontrados: {len(registros)}")
        
        # Group by month in Python for reliability
        mensais = {}
        for reg in registros:
            mes_key = reg.data.strftime('%Y-%m')
            if mes_key not in mensais:
                mensais[mes_key] = {'receita': Decimal('0'), 'despesa': Decimal('0')}
            
            if reg.tipo == 'Receita':
                mensais[mes_key]['receita'] += reg.valor
            elif reg.tipo == 'Despesa':
                mensais[mes_key]['despesa'] += reg.valor
        
        # Sort by month and calculate saldo (net)
        labels = sorted(mensais.keys())
        valores = [float(mensais[m]['receita'] - mensais[m]['despesa']) for m in labels]
        
        logger.info(f"Fluxo de caixa retornado: {len(labels)} meses com dados")
        
        return schemas.DadosGrafico(labels=labels, valores=valores)
    except Exception as e:
        logger.error(f"Erro no fluxo de caixa: {str(e)}")
        logger.error(f"Tipo do erro: {type(e).__name__}")
        logger.error(traceback.format_exc())
        # Retorna array vazio para não quebrar o CORS
        return schemas.DadosGrafico(labels=[], valores=[])

@app.get("/api/bi/alertas-resumo")
async def obter_alertas_resumo(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Get summary of stock alerts. (Acesso ADMIN e GERENTE)"""
    try:
        alertas_nao_resolvidos = db.query(func.count(AlertaEstoque.id)).filter(AlertaEstoque.resolvido == False).scalar()
        alertas_total = db.query(func.count(AlertaEstoque.id)).scalar()
        
        produtos_baixo_estoque = db.query(func.count(Produto.id)).filter(
            Produto.estoque_atual <= Produto.estoque_minimo
        ).scalar()
        
        return {
            "alertas_nao_resolvidos": alertas_nao_resolvidos or 0,
            "alertas_total": alertas_total or 0,
            "produtos_baixo_estoque": produtos_baixo_estoque or 0
        }
    except Exception as e:
        logger.error(f"Erro ao obter resumo de alertas: {e}")
        return {
            "alertas_nao_resolvidos": 0,
            "alertas_total": 0,
            "produtos_baixo_estoque": 0
        }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
