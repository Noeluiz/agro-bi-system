# Relatorio Final de Seguranca

**Sistema:** Agro-BI System  
**Data:** 2026-09-01  
**Escopo:** backend FastAPI, banco PostgreSQL, frontend React/Vite e operacao no Railway

## Resultado executivo

As oito frentes de blindagem foram implementadas e documentadas. A aplicacao exige configuracao explicita de segredos e banco, aplica autenticacao com sessao revogavel, protege login/logout contra CSRF, restringe origens CORS, limita abuso e mantem trilhas de auditoria. O cadastro de usuarios de demonstracao e os dados demo ficam desativados em producao.

O percentual "100%" deste relatorio significa cobertura das correcoes previstas no escopo das oito etapas. Ele nao substitui monitoramento, atualizacao de dependencias, revisao de infraestrutura ou um pentest externo.

## Correcoes implementadas nas 8 etapas

### 1. Segredos e configuracao

- `SECRET_KEY` e `DATABASE_URL` sao obrigatorias por variavel de ambiente.
- A aplicacao falha ao iniciar quando a chave esta ausente ou tem menos de 32 bytes.
- O `.env` real nao deve ser versionado; o repositorio fornece apenas um template.
- Docker Compose, Railway e frontend usam configuracao externa para valores sensiveis.

### 2. Banco e transporte

- Conexoes PostgreSQL recebem `sslmode=require` quando nao informado.
- O banco usa SQLAlchemy com PostgreSQL e nao expoe credenciais no codigo-fonte.
- Inicializacao e migracoes aditivas preservam instalacoes existentes.

### 3. Autenticacao e sessao

- Senhas sao armazenadas com bcrypt.
- JWT recebe `jti`, expiracao e pode ser revogado no logout.
- O token de autenticacao e mantido em cookie `HttpOnly`.
- Apos cinco falhas de senha, a conta fica bloqueada por 15 minutos.

### 4. CSRF, cookies e CORS

- Login e logout exigem o header `X-CSRF-Token` correspondente ao cookie CSRF.
- Cookies de producao usam `Secure` e `SameSite=None`.
- CORS usa origens explicitas e rejeita wildcard (`*`) com credenciais.
- Cabecalhos de seguranca incluem HSTS em producao, `X-Frame-Options`, `nosniff`, Referrer-Policy e Permissions-Policy.

### 5. Rate limiting e abuso

- Login e limitado a 5 requisicoes por minuto por origem.
- Rotas de criacao possuem limites, incluindo categorias e produtos a 20/minuto e compras a 10/minuto.
- Geracao de PDF possui limite por usuario.
- Ha limites para itens de compra e alertas diarios.
- Excedentes retornam HTTP 429 e sao registrados no log de abuso.

### 6. Validacao e sanitizacao

- Campos textuais tem limites de tamanho e sao sanitizados com Bleach.
- Valores `NaN`, `Infinity` e `-Infinity` sao rejeitados.
- Valores monetarios e quantidades negativas sao rejeitados; campos positivos exigem valor maior que zero.
- Listas e payloads de criacao tem limites de tamanho.

### 7. Integridade e auditoria

- Alteracoes criticas registram eventos operacionais e estado relevante antes/depois.
- Login, logout, falhas de autenticacao, bloqueios e abuso tem registros de acesso.
- O endpoint `GET /api/logs-acesso` e restrito a `ADMIN`.
- A retencao de logs usa `limpar_logs_antigos_90_dias`, com recomendacao de arquivamento antes da remocao.

### 8. Producao e operacao

- Seeds de usuarios padrao e dados demonstrativos sao ignorados somente quando `ENVIRONMENT=production`; variaveis automaticas do Railway nao alteram essa decisao.
- A tela administrativa de Logs de Acesso permite consulta, filtro por e-mail e exportacao CSV.
- O deploy tem checklist de variaveis, ordem de configuracao e verificacoes pos-publicacao.
- Testes automatizados cobrem lockout, validacao numerica, CSRF e HTTP 429.

## Variaveis de ambiente de producao

Configure no Railway, em **Settings > Variables**. Nunca publique os valores reais em Git, logs ou documentacao.

### Banco

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DATABASE_URL` (PostgreSQL, preferencialmente com `postgresql+pg8000://...`)

### Ambiente e autenticacao

- `ENVIRONMENT=production`
- `SECRET_KEY` (minimo de 32 bytes, gerada aleatoriamente)
- `JWT_ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `AUTH_COOKIE_NAME=agro_bi_token`
- `CSRF_COOKIE_NAME=agro_bi_csrf`
- `CSRF_HEADER_NAME=X-CSRF-Token`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none`

### Rede e cabecalhos

- `CORS_ORIGINS` (somente URLs HTTPS reais do frontend)
- `ENABLE_HSTS=true`

### Limites

- `PDF_LIMIT_PER_MINUTE`
- `MAX_ITENS_COMPRA`
- `MAX_ALERTAS_POR_DIA`

### Logs e relatorios

- `LOG_LEVEL`
- `FAZENDA_RAZAO_SOCIAL`
- `FAZENDA_CNPJ`
- `FAZENDA_ENDERECO`
- `FAZENDA_CIDADE_UF`
- `AGRO_BI_LOGO_PATH`
- `AGRO_BI_FONT_REGULAR`
- `AGRO_BI_FONT_BOLD`

### Runtime/Railway

- `RAILWAY_ENVIRONMENT_NAME=production`
- `RAILWAY_ENVIRONMENT_ID` (fornecida automaticamente pelo Railway; ignorada na deteccao de producao)
- `RAILWAY_SERVICE_NAME=agro-bi-api`
- `BACKEND_HOST=0.0.0.0`
- `BACKEND_PORT=8000`
- `FRONTEND_PORT` (somente quando necessario no ambiente de frontend)

## Deploy seguro no Railway

1. Crie ou selecione o projeto e provisione um PostgreSQL privado no Railway.
2. Gere uma chave forte com `openssl rand -hex 32` e defina `SECRET_KEY`.
3. Cadastre `DATABASE_URL` apontando para o banco Railway. Nao use senha de exemplo.
4. Defina `ENVIRONMENT=production`. As variaveis `RAILWAY_ENVIRONMENT_NAME`, `RAILWAY_ENVIRONMENT_ID` e `RAILWAY_SERVICE_NAME` podem permanecer com os valores automaticos do Railway; elas nao controlam a deteccao de producao.
5. Configure `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, `ENABLE_HSTS=true` e o `CORS_ORIGINS` HTTPS definitivo.
6. Configure limites, logs e dados institucionais conforme a lista acima.
7. Faca o deploy do backend e confirme nos logs que o banco inicializou sem executar seed de usuarios ou dados demo.
8. Publique o frontend com `VITE_API_URL` apontando para a URL HTTPS do backend.
9. Verifique o dominio final, certificado TLS e CORS antes de liberar usuarios.
10. Execute smoke tests de login com CSRF, logout, uma rota protegida, uma criacao autorizada e `GET /api/logs-acesso` com usuario ADMIN.
11. Confirme que um usuario nao-admin recebe 403 nos endpoints administrativos e que excesso de requisicoes recebe 429.
12. Programe a limpeza/arquivamento de logs antigos e monitore erros 401, 403, 429 e 5xx.

## Validacao final

No backend:

```powershell
cd backend
$env:SECRET_KEY = 'test-secret-key-with-at-least-32-bytes-123456'
$env:DATABASE_URL = 'sqlite:///./test.db'
pytest -q
python -m py_compile app\*.py tests\*.py
```

No frontend:

```powershell
cd frontend
npm run build
```

Os testes criados em `backend/tests/test_security_hardening.py` validam os quatro controles criticos solicitados. A build do frontend deve terminar com sucesso; avisos de tamanho de bundle nao sao falhas de compilacao.