# Agro-BI System

Sistema de gestão agrícola e business intelligence para operação de fazendas, controle de estoque, compras, pagamentos, safra, alertas e monitoramento administrativo.

## Visão Geral

O Agro-BI System combina:

- backend em FastAPI
- frontend em React + Vite
- banco PostgreSQL
- autenticação com cookies HttpOnly + CSRF
- proteção contra brute force, abuso e validações de entrada
- logs de auditoria e acesso
- relatório e exportação de dados

O projeto foi estruturado para uso local, desenvolvimento e implantação em ambientes de produção com políticas de segurança mais rígidas.

---

## Stack Tecnológica

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- JWT
- SlowAPI (rate limiting)
- ReportLab (PDF)

### Frontend
- React 18
- Vite
- React Router
- Tailwind CSS
- Recharts
- Axios

### Infraestrutura
- Docker
- Docker Compose
- PostgreSQL 16

---

## Estrutura do Projeto

```text
agro-bi-system/
├── backend/
│   ├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── ...
├── docker-compose.yml
├── init-db.sql
├── .env.example
├── README.md
├── TODO.md
├── SECURITY_AUDIT.md
├── SECURITY_SUMMARY.md
└── ...
```

---

## Requisitos

Antes de iniciar, garanta que você tenha instalado:

- Python 3.11+
- Node.js 18+
- npm
- Docker + Docker Compose
- Git

---

## Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no template disponível em `.env.example`.

```bash
cp .env.example .env
```

Exemplo mínimo de variáveis:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha
POSTGRES_DB=agro_estoque
DATABASE_URL=postgresql+pg8000://postgres:sua_senha@db:5432/agro_estoque
SECRET_KEY=sua_chave_muito_segura
ENVIRONMENT=development
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
CORS_ORIGINS=http://localhost:5173
ENABLE_HSTS=false
```

> Em produção, use valores reais, chaves fortes e `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, além de `ENVIRONMENT=production`.

---

## Executando com Docker Compose

Na raiz do projeto:

```bash
docker compose up --build
```

Isso inicia:

- PostgreSQL em `localhost` internamente via rede Docker
- backend em `http://localhost:8000`
- frontend em `http://localhost:5173`

Documentação interativa da API:

- Swagger: `http://localhost:8000/docs`
- Redoc: `http://localhost:8000/redoc`

---

## Executando Backend Localmente

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# ou no Windows PowerShell:
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

A API fica disponível em:

```text
http://localhost:8000
```

---

## Executando Frontend Localmente

```bash
cd frontend
npm install
npm run dev
```

A aplicação web fica disponível em:

```text
http://localhost:5173
```

---

## Build de Produção do Frontend

```bash
cd frontend
npm run build
```

O build gerado fica em `frontend/dist` e pode ser servido com qualquer static host compatible.

---

## Validação de Qualidade

### Backend
```bash
cd backend
python -m py_compile app/main.py
```

### Frontend
```bash
cd frontend
npm run build
```

---

## Usuários Iniciais

Em ambiente de desenvolvimento, o sistema pode popular usuários padrão quando a base estiver vazia.

- Admin: `admin@agro.com` / `admin123`
- Gerente: `gerente@agro.com` / `gerente123`

> Em produção, a criação automática de usuários padrão é desabilitada e o ambiente deve ser provisionado de forma explícita.

---

## Funcionalidades Principais

- gestão de estoque
- cadastro de produtos e categorias
- compras e movimentações
- fluxos de caixa
- registro de safra
- alertas de estoque
- folha de pagamento
- aplicação de insumos
- relatórios e PDF
- autenticação e autorização por perfil
- auditoria de acesso e ações
- proteção contra abuso e tentativas de brute force

---

## Segurança

O projeto inclui medidas importantes como:

- cookies HttpOnly
- proteção CSRF
- rate limiting
- CORS restritivo
- headers de segurança (HSTS, X-Frame-Options, X-Content-Type-Options)
- validação de entrada em modelos de dados
- logs de acesso e auditoria
- seeds condicionadas ao ambiente

---

## Comandos Úteis

### Iniciar tudo com Docker
```bash
docker compose up --build
```

### Parar todos os containers
```bash
docker compose down
```

### Reiniciar um container específico
```bash
docker compose restart backend
```

### Ver logs do backend
```bash
docker compose logs -f backend
```

### Ver logs do frontend
```bash
docker compose logs -f frontend
```

---

## Roadmap e Observações

Este repositório já contém documentação adicional de segurança, auditoria e deploy, incluindo arquivos como:

- `SECURITY_AUDIT.md`
- `SECURITY_SUMMARY.md`
- `DOSSIER_TECNICO.md`
- `TODO.md`

Consulte esses arquivos para revisar políticas de segurança, checklist de produção e detalhes operacionais.

---

## Licença

Este projeto foi desenvolvido para uso interno/operacional e pode ser ajustado conforme a necessidade da organização. Verifique as políticas internas antes de publicar em produção pública.

---

## Contato / Manutenção

Para apoiar manutenção, deploy e ajustes de produção, use a documentação do projeto e as convenções de ambiente configuradas nos arquivos `.env.example`, `docker-compose.yml` e nos relatórios de segurança na raiz do repositório.
