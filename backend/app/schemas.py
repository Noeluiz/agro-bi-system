from pydantic import BaseModel, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum

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


class ProdutoUpdate(BaseModel):
    """Campos que podem ser alterados parcialmente em um produto."""
    nome: Optional[str] = None
    categoria_id: Optional[int] = None
    fornecedor_id: Optional[int] = None
    estoque_atual: Optional[Decimal] = None
    estoque_minimo: Optional[Decimal] = None
    preco_custo: Optional[Decimal] = None
    preco_venda: Optional[Decimal] = None
    unidade_medida: Optional[str] = None


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


class FuncionarioUpdate(BaseModel):
    """Campos que podem ser alterados em um funcionário."""
    nome: Optional[str] = None
    cpf: Optional[str] = None
    cargo: Optional[str] = None
    salario_base: Optional[Decimal] = None
    data_admissao: Optional[date] = None
    ativo: Optional[bool] = None

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

# Compras Schemas
class ItemCompraBase(BaseModel):
    produto_id: int
    quantidade: Decimal = Field(gt=0)
    preco_unitario: Decimal = Field(ge=0)

class CompraCreate(BaseModel):
    fornecedor_id: int
    itens: List[ItemCompraBase] = Field(min_length=1)

class ItemCompraResponse(ItemCompraBase):
    id: int
    compra_id: int

    class Config:
        from_attributes = True

class CompraResponse(BaseModel):
    id: int
    fornecedor_id: int
    valor_total: Decimal
    created_at: datetime
    itens: List[ItemCompraResponse]

    class Config:
        from_attributes = True

# Aplicação de insumos Schemas
class AplicacaoInsumoCreate(BaseModel):
    safra_id: int
    produto_id: int
    quantidade_usada: Decimal = Field(gt=0)
    data_aplicacao: Optional[date] = None

class AplicacaoInsumoResponse(BaseModel):
    id: int
    safra_id: int
    produto_id: int
    quantidade_usada: Decimal
    custo_total: Decimal
    data_aplicacao: date
    created_at: datetime

    class Config:
        from_attributes = True


class TipoMaquina(str, Enum):
    pulverizador = "Pulverizador"
    drone = "Drone"
    aviao = "Avião"
    costal = "Costal"
    outro = "Outro"


class ItemOrdemAplicacaoCreate(BaseModel):
    produto_id: int
    dose_ha: Decimal = Field(gt=0)
    quantidade_total: Optional[Decimal] = Field(default=None, gt=0)


class OrdemAplicacaoCreate(BaseModel):
    fazenda: str = Field(min_length=1, max_length=150)
    cultura: str = Field(min_length=1, max_length=50)
    variedade: str = Field(min_length=1, max_length=100)
    data_recomendacao: date
    data_maxima_aplicacao: date
    tipo_maquina: TipoMaquina
    operador: str = Field(min_length=1, max_length=150)
    modelo_maquina: str = Field(min_length=1, max_length=100)
    capacidade_tanque_l: Decimal = Field(gt=0)
    vazao_l_ha: Decimal = Field(gt=0)
    pressao_bar: Decimal = Field(gt=0)
    velocidade_kmh: Decimal = Field(gt=0)
    bico: str = Field(min_length=1, max_length=100)
    area_total_ha: Decimal = Field(gt=0)
    itens: List[ItemOrdemAplicacaoCreate] = Field(min_length=1)


class ItemOrdemAplicacaoResponse(BaseModel):
    id: int
    ordem_id: int
    produto_id: int
    dose_ha: Decimal
    quantidade_total: Decimal

    class Config:
        from_attributes = True


class OrdemAplicacaoResponse(BaseModel):
    id: int
    fazenda: str
    cultura: str
    variedade: str
    data_recomendacao: date
    data_maxima_aplicacao: date
    tipo_maquina: TipoMaquina
    operador: str
    modelo_maquina: str
    capacidade_tanque_l: Decimal
    vazao_l_ha: Decimal
    pressao_bar: Decimal
    velocidade_kmh: Decimal
    bico: str
    area_total_ha: Decimal
    created_at: datetime
    itens: List[ItemOrdemAplicacaoResponse]

    class Config:
        from_attributes = True


class MovimentacaoEstoqueResponse(BaseModel):
    id: int
    tipo: str
    produto_id: int
    produto_nome: str
    quantidade: Decimal
    data: datetime
    referencia: str


# Safra Schemas
class SafraBase(BaseModel):
    nome_safra: str
    cultura: str
    data_inicio: date
    data_fim: Optional[date] = None
    hectares_plantados: Decimal
    sacas_produzidas: Optional[Decimal] = None
    custo_total_acumulado: Decimal = Decimal("0")
    producao_total: Optional[Decimal] = None
    custo_total: Optional[Decimal] = None

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
    custo_por_saca: float
    produtividade_sacas_por_hectare: float
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
