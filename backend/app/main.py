from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from decimal import Decimal
from datetime import date, datetime, timedelta
from typing import Optional, List
import os
import logging
import traceback

from app.database import get_db, init_db
from app.models import (
    Categoria, Fornecedor, Produto, Funcionario, FolhaPagamento,
    FluxoCaixa, Safra, AlertaEstoque, Usuario
)
from app.auth import (
    hash_senha, verificar_senha, create_access_token,
    get_current_user, require_admin, COOKIE_NAME, COOKIE_SECURE, COOKIE_SAMESITE
)
from app import schemas

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Agro-BI API",
    description="API para Sistema de Gestão Agrícola e Business Intelligence",
    version="1.0.0"
)

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
# Origens permitidas via variável de ambiente CORS_ORIGINS (separadas por vírgula).
# Em produção, defina CORS_ORIGINS com as origens reais do frontend.
_cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
cors_origins = [o.strip() for o in _cors_origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)


# ---------------------------------------------------------------------
# Security Headers (CSP, HSTS, X-Content-Type-Options, etc.)
# ---------------------------------------------------------------------
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "connect-src 'self'"
    )
    # HSTS apenas em produção (HTTPS)
    if os.getenv("ENABLE_HSTS", "false").lower() == "true":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Initialize database on startup
@app.on_event("startup")
async def startup():
    init_db()
    criar_usuarios_iniciais()
    logger.info("Database initialized")


def criar_usuarios_iniciais():
    """Cria os usuários iniciais de teste (admin e gerente) se não existirem."""
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
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    if not user or not verificar_senha(form_data.password, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
        "access_token": access_token,
        "token_type": "bearer",
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
    _: Usuario = Depends(get_current_user)
):
    """Create a new product. (Acesso ADMIN e GERENTE)"""
    try:
        db_produto = Produto(**produto.dict())
        db.add(db_produto)
        db.commit()
        db.refresh(db_produto)
        return db_produto
    except Exception as e:
        logger.error(f"Erro ao criar produto: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar produto")

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
    _: Usuario = Depends(require_admin)
):
    """Create a new employee."""
    try:
        db_funcionario = Funcionario(**funcionario.dict())
        db.add(db_funcionario)
        db.commit()
        db.refresh(db_funcionario)
        return db_funcionario
    except Exception as e:
        logger.error(f"Erro ao criar funcionario: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar funcionario")

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
    _: Usuario = Depends(require_admin)
):
    """Create a new cash flow record. (ADMIN only)"""
    try:
        db_fluxo = FluxoCaixa(**fluxo.dict())
        db.add(db_fluxo)
        db.commit()
        db.refresh(db_fluxo)
        return db_fluxo
    except Exception as e:
        logger.error(f"Erro ao criar fluxo de caixa: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar fluxo de caixa")

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
        db_safra = Safra(**safra.dict())
        db.add(db_safra)
        db.commit()
        db.refresh(db_safra)
        return db_safra
    except Exception as e:
        logger.error(f"Erro ao criar safra: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar safra")

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
            total_custo = sum(s.custo_total_acumulado for s in safras)
            total_hectares = sum(s.hectares_plantados for s in safras)
            custo_por_hectare = float(total_custo / total_hectares) if total_hectares > 0 else 0.0
        else:
            custo_por_hectare = 0.0
        
        total_estoque_custo = Decimal("0")
        for p in produtos:
            total_estoque_custo += (p.estoque_atual * p.preco_custo)
        
        total_funcionarios = db.query(func.count(Funcionario.id)).filter(Funcionario.ativo == True).scalar()
        
        return schemas.MetricasBI(
            faturamento_estimado=float(faturamento_estimado),
            lucro_estimado=float(lucro_estimado),
            margem_lucro_media=margem_lucro_media,
            custo_por_hectare=custo_por_hectare,
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
