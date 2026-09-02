# Checklist de Deploy em Produção - Agro-BI

Este checklist foi preparado para refletir a configuração real usada pela aplicação em produção, incluindo autenticação, cookies, CORS, banco, logs e retenção de dados.

## 1) Definir o ambiente de produção

No Railway, em Settings > Variables:

- `ENVIRONMENT=production`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none`
- `CORS_ORIGINS=https://agro-bi-system.vercel.app`
- `ENABLE_HSTS=true`
- `LOG_LEVEL=WARNING`

## 2) Configurar segredos e chaves

- `SECRET_KEY=<valor forte gerado com openssl rand -hex 32>`
- `DATABASE_URL=postgresql+pg8000://postgres:<senha>@<host>:5432/agro_estoque`

Observações:
- `SECRET_KEY` deve ter pelo menos 32 bytes.
- `DATABASE_URL` deve usar o host real do PostgreSQL provisionado no Railway.
- Nunca deixe valores reais em arquivos versionados.

## 3) Configurar banco PostgreSQL

- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=<senha forte>`
- `POSTGRES_DB=agro_estoque`

A aplicação usa a URL do banco em `DATABASE_URL`, e a conexão PostgreSQL é forçada para TLS/SSL com `sslmode=require` quando a URL for do tipo PostgreSQL local/externo.

## 4) Configurar autenticação e sessão

- `AUTH_COOKIE_NAME=agro_bi_token`
- `CSRF_COOKIE_NAME=agro_bi_csrf`
- `CSRF_HEADER_NAME=X-CSRF-Token`
- `JWT_ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES=60`

Essas variáveis são essenciais para: JWT, cookies HttpOnly, CSRF e logout seguro.

## 5) Configurar CORS e HTTPS

- `CORS_ORIGINS=https://agro-bi-system.vercel.app`
- `ENABLE_HSTS=true`

Importante:
- em produção, não usar `*` com `credentials=true`
- remover origens locais e de preview
- manter apenas o domínio principal do frontend

## 6) Configurar limites e proteção

- `PDF_LIMIT_PER_MINUTE=5`
- `MAX_ITENS_COMPRA=50`
- `MAX_ALERTAS_POR_DIA=20`

Esses valores protegem contra abuso de geração de PDF, compras em massa e múltiplos alertas por dia.

## 7) Configurar dados institucionais dos relatórios

- `FAZENDA_RAZAO_SOCIAL=Agro-BI Fazenda`
- `FAZENDA_CNPJ=00.000.000/0000-00`
- `FAZENDA_ENDERECO=Endereço da Fazenda, s/n`
- `FAZENDA_CIDADE_UF=Cidade - UF`
- `AGRO_BI_LOGO_PATH=`
- `AGRO_BI_FONT_REGULAR=`
- `AGRO_BI_FONT_BOLD=`

São opcionais, mas usados em documentos PDF e relatórios da ordem de aplicação.

## 8) Configurar variáveis opcionais do Railway

- `RAILWAY_ENVIRONMENT_NAME=production`
- `RAILWAY_SERVICE_NAME=agro-bi-api`

Essas variáveis são fornecidas automaticamente pelo Railway e não são usadas pela aplicação para detectar produção. O seed é controlado exclusivamente por `ENVIRONMENT`: use `production` para bloqueá-lo e `development`, `test` ou vazio para permitir o seed.

## 9) Ordem recomendada do deploy

1. Provisionar o banco PostgreSQL no Railway.
2. Definir `POSTGRES_*` e `DATABASE_URL`.
3. Definir `SECRET_KEY`.
4. Definir `ENVIRONMENT=production`.
5. Definir `CORS_ORIGINS`, `COOKIE_SECURE`, `COOKIE_SAMESITE`.
6. Definir `ENABLE_HSTS=true`.
7. Definir `LOG_LEVEL=WARNING`.
8. Definir os limites de abuso (`PDF_LIMIT_PER_MINUTE`, `MAX_ITENS_COMPRA`, `MAX_ALERTAS_POR_DIA`).
9. Verificar se o backend sobe sem erros.
10. Publicar o frontend Vercel com o domínio `https://agro-bi-system.vercel.app`.
11. Testar login, logout, CSRF, CORS e PDF.
12. Validar logs e auditoria.

## 10) Recomendação de retenção e LGPD

A aplicação inclui a função de retenção:

- `limpar_logs_antigos_90_dias(db, dias=90)`

Recomendação operacional:
- executar a limpeza mensalmente
- arquivar logs antigos em storage seguro antes da remoção definitiva
- preservar somente dados estritamente necessários

## 11) Checklist final antes de liberar

- [ ] `ENVIRONMENT=production`
- [ ] `SECRET_KEY` preenchida e forte
- [ ] `DATABASE_URL` correta
- [ ] `COOKIE_SECURE=true`
- [ ] `COOKIE_SAMESITE=none`
- [ ] `CORS_ORIGINS=https://agro-bi-system.vercel.app`
- [ ] `ENABLE_HSTS=true`
- [ ] `LOG_LEVEL=WARNING`
- [ ] `POSTGRES_*` configurados
- [ ] backend subiu sem erro
- [ ] frontend build OK
- [ ] login/logout funcionando
- [ ] CSRF validando corretamente
- [ ] logs de acesso gerando registros
- [ ] retenção de 90 dias definida
