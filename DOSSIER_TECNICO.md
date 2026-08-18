# Dossiê Técnico — Agro-BI

## Visão geral e estrutura

O Agro-BI é um SaaS de gestão agrícola composto por:

- `backend/`: API REST em Python 3.11 com FastAPI e SQLAlchemy.
- `frontend/`: SPA React 18 com Vite, Tailwind CSS, Recharts e Lucide React.

O banco é PostgreSQL, usado pelo backend via SQLAlchemy e `pg8000`. O backend é preparado para deploy no Railway por Docker; o frontend é preparado para deploy no Vercel. A branch principal é `main`, com deploy automático.

## Backend e segurança

- Python 3.11; FastAPI 0.109; Uvicorn; SQLAlchemy 2; Pydantic 2.
- Autenticação por JWT, assinado com `SECRET_KEY`, com expiração configurável.
- O token é aceito no cabeçalho Bearer ou no cookie HttpOnly. `COOKIE_SECURE` e `COOKIE_SAMESITE` são configuráveis por ambiente.
- Senhas usam bcrypt via Passlib.
- `slowapi` limita o login a 5 requisições/minuto e o healthcheck a 20/minuto.
- `DATABASE_URL` e `SECRET_KEY` são obrigatórias; o serviço falha ao iniciar sem elas.
- O seed de usuários de teste só é executado quando `ENVIRONMENT` não é `production`; em produção, configure `ENVIRONMENT=production`.
- Há os papéis `ADMIN` e `GERENTE`. RH, fluxo de caixa e métricas BI administrativas exigem `ADMIN`.

### CORS e headers

O CORS é uma lista fixa e explícita no código em `backend/app/main.py`; a variável `CORS_ORIGINS` **não é lida**. A configuração permite credenciais apenas para as origens listadas.

O middleware `security_headers` permanece comentado intencionalmente para evitar impacto no Swagger durante o MVP. Portanto, ele não adiciona CSP, HSTS, `X-Frame-Options` ou demais headers em execução. Antes de ativá-lo, a política deve ser validada no Swagger e no frontend em produção.

### Auditoria e retenção

O modelo `Log` registra o usuário, a ação, detalhes opcionais e a data/hora das operações de criação e atualização de produtos, criação/atualização/inativação de funcionários e criação de lançamentos de fluxo de caixa. Funcionários são removidos por *soft delete*: a exclusão define `ativo=false`, e a listagem retorna apenas registros ativos.

## Endpoints

### Infraestrutura e autenticação

- `GET /health`: healthcheck público com rate limit.
- `POST /api/auth/login`: autentica e define cookie HttpOnly.
- `POST /api/auth/logout`: remove o cookie.
- `GET /api/auth/me`: retorna o usuário autenticado.

### Estoque, cadastros e safras

- `GET` / `POST /api/categorias`
- `GET` / `POST /api/fornecedores`
- `GET` / `POST /api/produtos`
- `GET` / `PATCH /api/produtos/{produto_id}`: o `PATCH` aceita qualquer campo editável do produto, incluindo estoque e preços.
- `POST /api/compras`: registra uma compra com fornecedor e itens e atualiza o estoque de cada produto de forma atômica.
- `GET` / `POST /api/safras`
- `GET` / `POST /api/alertas-estoque`
- `PATCH` / `DELETE /api/alertas-estoque/{alerta_id}`

Estes recursos aceitam usuários `ADMIN` e `GERENTE` autenticados.

### RH e financeiro

- `GET` / `POST /api/funcionarios`
- `PUT` / `DELETE /api/funcionarios/{funcionario_id}`
- `GET` / `POST /api/fluxo-caixa`

Essas rotas exigem `ADMIN`.

### BI

- `GET /api/bi/metricas`
- `GET /api/bi/faturamento-por-categoria`
- `GET /api/bi/investimento-estoque`
- `GET /api/bi/grafico-fluxo-caixa`
- `GET /api/bi/alertas-resumo`

As quatro primeiras exigem `ADMIN`; `alertas-resumo` aceita `ADMIN` e `GERENTE`.

## Dados e frontend

Os modelos principais são `Usuario`, `Categoria`, `Fornecedor`, `Produto`, `Compra`, `ItemCompra`, `Funcionario`, `FolhaPagamento`, `FluxoCaixa`, `Safra` e `AlertaEstoque`.

Uma `Compra` possui fornecedor, valor total e itens. Cada item registra produto, quantidade e preço unitário; ao registrar a compra, a quantidade é incorporada ao estoque atual do produto na mesma transação.

Safras aceitam os campos `producao_total` (sacas) e `custo_total` (R$), mantendo os campos legados para compatibilidade. O Dashboard calcula custo por saca e produtividade em sacas por hectare com esses dados.

No startup, o backend garante as categorias agrícolas `Adubos`, `Defensivos`, `Sementes`, `Peças` e `Combustíveis`, sem alterar os cadastros existentes. Elas ficam disponíveis no seletor ao cadastrar produtos.

O frontend utiliza componentes reutilizáveis, incluindo `CadastroModal`, tabelas de estoque e alertas, dashboard de BI, exportação CSV e `ErrorBoundary` global. O tema usa Tailwind com verde escuro como cor principal.

## Critérios para mudanças futuras

Toda alteração deve manter compatibilidade com Python 3.11, as variáveis de ambiente já configuradas e o modelo atual de JWT, RBAC, cookies, rate limiting e CORS restrito. Novos endpoints devem usar schemas Pydantic, autenticação apropriada e respostas HTTP coerentes.
