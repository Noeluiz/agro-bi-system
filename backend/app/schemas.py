from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List

# ============= AUTH SCHEMAS =============

class UsuarioCreate(BaseModel):
    """Schema de criação de usuário.

    ATENÇÃO: o campo `role` NÃO é aceito do cliente. A role é definida
    exclusivamente no servidor (proteção contra escalonamento de privilégio
    via Mass Assignment).
    """
    nome: str
    email: str
    senha: str

class UsuarioLogin(BaseModel):
    email: str
    senha: str

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# ============= CATEGORIA SCHEMAS =============

class CategoriaBase(BaseModel):
    nome: str

class CategoriaResponse(CategoriaBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Fornecedor Schemas
class FornecedorBase(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None

class FornecedorResponse(FornecedorBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Produto Schemas
class ProdutoBase(BaseModel):
    nome: str
    categoria_id: int
    fornecedor_id: int
    estoque_atual: Decimal
    estoque_minimo: Decimal
    preco_custo: Decimal
    preco_venda: Decimal
    unidade_medida: str

class ProdutoResponse(ProdutoBase):
    id: int
    created_at: datetime
    categoria: Optional[CategoriaResponse] = None
    fornecedor: Optional[FornecedorResponse] = None
    
    class Config:
        from_attributes = True

class ProdutoComAlertaResponse(ProdutoResponse):
    alerta: Optional[str] = None

# Funcionario Schemas
class FuncionarioBase(BaseModel):
    nome: str
    cpf: Optional[str] = None
    cargo: str
    salario_base: Decimal
    data_admissao: date

class FuncionarioResponse(FuncionarioBase):
    id: int
    ativo: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# FolhaPagamento Schemas
class FolhaPagamentoBase(BaseModel):
    funcionario_id: int
    data_pagamento: date
    valor_pago: Decimal
    sacas_colhidas: Optional[Decimal] = None
    bonus: Decimal = Decimal("0")

class FolhaPagamentoResponse(FolhaPagamentoBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# FluxoCaixa Schemas
class FluxoCaixaBase(BaseModel):
    tipo: str
    valor: Decimal
    categoria_financeira: str
    descricao: Optional[str] = None
    data: date

class FluxoCaixaResponse(FluxoCaixaBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Safra Schemas
class SafraBase(BaseModel):
    nome_safra: str
    cultura: str
    data_inicio: date
    data_fim: Optional[date] = None
    hectares_plantados: Decimal
    sacas_produzidas: Optional[Decimal] = None
    custo_total_acumulado: Decimal

class SafraResponse(SafraBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# AlertaEstoque Schemas
class AlertaEstoqueBase(BaseModel):
    produto_id: int
    mensagem: str
    tipo_alerta: Optional[str] = None
    resolvido: bool = False

class AlertaEstoqueResponse(AlertaEstoqueBase):
    id: int
    created_at: datetime
    produto: Optional[ProdutoResponse] = None
    
    class Config:
        from_attributes = True

class AlertaEstoqueUpdate(BaseModel):
    resolvido: Optional[bool] = None
    mensagem: Optional[str] = None
    tipo_alerta: Optional[str] = None

# BI Dashboard Schemas
class MetricasBI(BaseModel):
    faturamento_estimado: float
    lucro_estimado: float
    margem_lucro_media: float
    custo_por_hectare: float
    total_estoque_custo: float
    total_funcionarios: int

class DistribuicaoFaturamento(BaseModel):
    categoria: str
    valor: float
    percentual: float

class InvestimentoEstoque(BaseModel):
    categoria: str
    quantidade: float
    valor_total: float

class DadosGrafico(BaseModel):
    labels: List[str]
    valores: List[float]

class FiltroBuscaRequest(BaseModel):
    categoria_id: Optional[int] = None
    fornecedor_id: Optional[int] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
