from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Date, Boolean, ForeignKey, CheckConstraint, Text, func
from sqlalchemy.orm import relationship
from datetime import date, datetime
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='GERENTE')
    ativo = Column(Boolean, default=True, nullable=False)
    falhas_login = Column(Integer, default=0, nullable=False)
    bloqueado_ate = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("role IN ('ADMIN', 'GERENTE', 'OPERADOR')", name="ck_usuarios_role"),
    )

    def __repr__(self):
        return f"<Usuario {self.email} ({self.role})>"


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    acao = Column(String(100), nullable=False)
    detalhes = Column(Text, nullable=True)
    data_hora = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    usuario = relationship("Usuario")


class LogAcesso(Base):
    __tablename__ = "logs_acesso"

    id = Column(Integer, primary_key=True, index=True)
    email_usuario = Column(String(150), nullable=False, index=True)
    acao = Column(String(50), nullable=False, index=True)
    ip_origem = Column(String(45), nullable=False, index=True)
    user_agent = Column(String(255), nullable=True)
    detalhes = Column(Text, nullable=True)
    data_hora = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class Categoria(Base):
    __tablename__ = "categorias"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    produtos = relationship("Produto", back_populates="categoria")

class Fornecedor(Base):
    __tablename__ = "fornecedores"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), unique=True, nullable=False)
    cnpj = Column(String(18), unique=True, nullable=True)
    email = Column(String(100), nullable=True)
    telefone = Column(String(15), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    produtos = relationship("Produto", back_populates="fornecedor")
    compras = relationship("Compra", back_populates="fornecedor")

class Produto(Base):
    __tablename__ = "produtos"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"), nullable=False)
    estoque_atual = Column(DECIMAL(10, 2), default=0, nullable=False)
    estoque_minimo = Column(DECIMAL(10, 2), default=0, nullable=False)
    preco_custo = Column(DECIMAL(10, 2), nullable=False)
    preco_venda = Column(DECIMAL(10, 2), nullable=False)
    unidade_medida = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    categoria = relationship("Categoria", back_populates="produtos")
    fornecedor = relationship("Fornecedor", back_populates="produtos")
    alertas = relationship("AlertaEstoque", back_populates="produto")
    itens_compra = relationship("ItemCompra", back_populates="produto")
    aplicacoes = relationship("AplicacaoInsumo", back_populates="produto")

class Funcionario(Base):
    __tablename__ = "funcionarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(14), unique=True, nullable=True)
    cargo = Column(String(100), nullable=False)
    salario_base = Column(DECIMAL(10, 2), nullable=False)
    data_admissao = Column(Date, nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    folha_pagamento = relationship("FolhaPagamento", back_populates="funcionario")

class FolhaPagamento(Base):
    __tablename__ = "folha_pagamento"
    
    id = Column(Integer, primary_key=True, index=True)
    funcionario_id = Column(Integer, ForeignKey("funcionarios.id"), nullable=False)
    data_pagamento = Column(Date, nullable=False)
    valor_pago = Column(DECIMAL(10, 2), nullable=False)
    sacas_colhidas = Column(DECIMAL(10, 2), nullable=True)
    bonus = Column(DECIMAL(10, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    funcionario = relationship("Funcionario", back_populates="folha_pagamento")

class FluxoCaixa(Base):
    __tablename__ = "fluxo_caixa"
    
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(20), nullable=False)  # 'Receita' or 'Despesa'
    valor = Column(DECIMAL(12, 2), nullable=False)
    categoria_financeira = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=True)
    data = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("tipo IN ('Receita', 'Despesa')"),
    )

class Safra(Base):
    __tablename__ = "safras"
    
    id = Column(Integer, primary_key=True, index=True)
    nome_safra = Column(String(100), nullable=False)
    cultura = Column(String(50), nullable=False)
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=True)
    hectares_plantados = Column(DECIMAL(10, 2), nullable=False)
    sacas_produzidas = Column(DECIMAL(10, 2), nullable=True)
    custo_total_acumulado = Column(DECIMAL(12, 2), default=0, nullable=False)
    producao_total = Column(DECIMAL(12, 2), nullable=True)
    custo_total = Column(DECIMAL(12, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    aplicacoes = relationship("AplicacaoInsumo", back_populates="safra")


class Compra(Base):
    __tablename__ = "compras"

    id = Column(Integer, primary_key=True, index=True)
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"), nullable=False, index=True)
    valor_total = Column(DECIMAL(12, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    fornecedor = relationship("Fornecedor", back_populates="compras")
    itens = relationship("ItemCompra", back_populates="compra", cascade="all, delete-orphan")


class ItemCompra(Base):
    __tablename__ = "itens_compra"

    id = Column(Integer, primary_key=True, index=True)
    compra_id = Column(Integer, ForeignKey("compras.id"), nullable=False, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False, index=True)
    quantidade = Column(DECIMAL(12, 2), nullable=False)
    preco_unitario = Column(DECIMAL(12, 2), nullable=False)

    compra = relationship("Compra", back_populates="itens")
    produto = relationship("Produto", back_populates="itens_compra")


class AplicacaoInsumo(Base):
    __tablename__ = "aplicacoes_insumos"

    id = Column(Integer, primary_key=True, index=True)
    safra_id = Column(Integer, ForeignKey("safras.id"), nullable=False, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False, index=True)
    quantidade_usada = Column(DECIMAL(12, 2), nullable=False)
    custo_total = Column(DECIMAL(12, 2), nullable=False)
    data_aplicacao = Column(Date, default=date.today, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    safra = relationship("Safra", back_populates="aplicacoes")
    produto = relationship("Produto", back_populates="aplicacoes")


class OrdemAplicacao(Base):
    __tablename__ = "ordens_aplicacao"

    id = Column(Integer, primary_key=True, index=True)
    fazenda = Column(String(150), nullable=False)
    cultura = Column(String(50), nullable=False)
    variedade = Column(String(100), nullable=False)
    data_recomendacao = Column(Date, nullable=False)
    data_maxima_aplicacao = Column(Date, nullable=False)
    tipo_maquina = Column(String(50), nullable=False)
    operador = Column(String(150), nullable=False)
    modelo_maquina = Column(String(100), nullable=False)
    capacidade_tanque_l = Column(DECIMAL(12, 2), nullable=False)
    vazao_l_ha = Column(DECIMAL(12, 2), nullable=False)
    pressao_bar = Column(DECIMAL(12, 2), nullable=False)
    velocidade_kmh = Column(DECIMAL(12, 2), nullable=False)
    bico = Column(String(100), nullable=False)
    area_total_ha = Column(DECIMAL(12, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    itens = relationship("ItemOrdemAplicacao", back_populates="ordem", cascade="all, delete-orphan")


class ItemOrdemAplicacao(Base):
    __tablename__ = "itens_ordem_aplicacao"

    id = Column(Integer, primary_key=True, index=True)
    ordem_id = Column(Integer, ForeignKey("ordens_aplicacao.id"), nullable=False, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False, index=True)
    dose_ha = Column(DECIMAL(12, 4), nullable=False)
    quantidade_total = Column(DECIMAL(12, 2), nullable=False)

    ordem = relationship("OrdemAplicacao", back_populates="itens")
    produto = relationship("Produto")

class AlertaEstoque(Base):
    __tablename__ = "alertas_estoque"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)  # IDOR: track creator
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    mensagem = Column(Text, nullable=False)
    tipo_alerta = Column(String(50), nullable=True)
    resolvido = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    usuario = relationship("Usuario")
    produto = relationship("Produto", back_populates="alertas")
