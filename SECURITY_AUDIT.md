# 🔒 AUDITORIA DE SEGURANÇA - Agro-BI System (Antes do Primeiro Commit Git)

**Data:** 2026-08-07  
**Status:** ⚠️ CRÍTICO - Secrets encontrados no `.env` versionado  
**Ação Necessária:** Aplicar correções ANTES de executar `git add .`

---

## 1. ANÁLISE DO `.gitignore` ATUAL

### Arquivo atual encontrado:
```
# Environment / Secrets
.env
.env.*
!.env.example

# Python
__pycache__/
*.py[cod]
*.pyo
.venv/
venv/
env/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Frontend builds
dist/
build/

# Logs
*.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Docker
docker-compose.override.yml

# Test / coverage
.coverage
htmlcov/
.pytest_cache/

# Temporary files
*.tmp
*.temp
```

---

## 2. PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🔴 PROBLEMA 1: `.env` ESTÁ VERSIONADO NO GIT
**Severidade:** CRÍTICA  
**Localização:** `agro-bi-system/.env`  
**Conteúdo Sensível Exposto:**
```
POSTGRES_PASSWORD=99776658                 ❌ SENHA DO BANCO
DATABASE_URL=postgresql+pg8000://postgres:99776658@db:5432/agro_estoque  ❌ Contém senha
SECRET_KEY=bb62490f4d1b3a9c7e5f2a8d0c1b3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0dSECUREKEY2026  ❌ JWT Secret
CORS_ORIGINS=...                           ⚠️ Informação sensível (mas menos crítica)
COOKIE_SECURE=false                        ⚠️ Configuração de produção
COOKIE_SAMESITE=strict                     ⚠️ Configuração de segurança
```

**Impacto:**
- ✗ Qualquer pessoa com acesso ao repositório Git tem a senha do PostgreSQL
- ✗ A SECRET_KEY está exposta (JWT pode ser falsificado)
- ✗ Banco de dados é acessível por qualquer pessoa
- ✗ Violação OWASP A01:2021 – Broken Access Control

---

### 🟡 PROBLEMA 2: `.gitignore` não cobre todos os arquivos sensíveis
**Severidade:** ALTA  
**Padrões Faltando:**

```gitignore
# ❌ Faltam: Certificados e chaves privadas
*.pem
*.key
*.p12
*.pfx
*.cert
*.crt

# ❌ Faltam: Direitos de acesso via tokens/credentials
secrets/
credentials/
.aws/
.gcp/

# ❌ Faltam: Arquivos de cache do Python modernos
*.egg-info/
dist/
build/
.eggs/

# ❌ Faltam: Logs sensíveis
logs/
*.log*

# ❌ Faltam: Arquivos de IDE adicionais
.vscode/settings.json
.idea/workspace.xml

# ❌ Faltam: Arquivos do Windows/macOS modernos
.env.local
.env.*.local
*.swp
*.swo
*~
.AppleDouble
.LSOverride
```

---

### 🟡 PROBLEMA 3: Padrão `!.env.example` é redundante
**Severidade:** BAIXA  
**Situação:**
- A regra `!.env.example` permite que `.env.example` seja versionado
- **Resultado:** ❌ Não existe um `.env.example` no projeto
- **Impacto:** Confusão durante clone/setup

**Solução:** Incluir um `.env.example` real no repositório

---

### 🟡 PROBLEMA 4: `docker-compose.override.yml` pode conter secrets
**Severidade:** MÉDIA  
**Situação:**
- O `.gitignore` ignora `docker-compose.override.yml` ✓ (correto)
- **Mas:** Não há recomendação de uso em desenvolvimento local
- **Risco:** Desenvolvedores podem acidentalmente commitar overrides com secrets

---

## 3. VERIFICAÇÃO DE SECRETS HARDCODED

### 🔴 Secrets encontrados em arquivos versionados:

| Arquivo | Tipo | Conteúdo | Status |
|---------|------|----------|--------|
| `.env` | POSTGRES_PASSWORD | `99776658` | ❌ CRÍTICO |
| `.env` | DATABASE_URL | Contém senha em plaintext | ❌ CRÍTICO |
| `.env` | SECRET_KEY | JWT Secret em plaintext | ❌ CRÍTICO |
| `backend/app/auth.py` | ✓ SEGURO | Lê de `os.getenv("SECRET_KEY")` | ✅ Correto |
| `backend/app/database.py` | ✓ SEGURO | Lê de `os.getenv("DATABASE_URL")` | ✅ Correto |
| `docker-compose.yml` | ✓ SEGURO | Usa variáveis de ambiente `${...}` | ✅ Correto |
| `init-db.sql` | ✓ SEGURO | Sem credenciais hardcoded | ✅ Correto |

**Conclusão:** O código está bem-protegido, mas o arquivo `.env` está exposto!

---

## 4. ANÁLISE DETALHADA DO `.gitignore`

### ✅ Correto:
```gitignore
__pycache__/        # Python cache
*.py[cod]           # Python bytecode
.venv/              # Virtual environment
node_modules/       # Node dependencies
dist/               # Frontend build
.vscode/            # IDE
.DS_Store           # macOS
Thumbs.db           # Windows
```

### ⚠️ Incompleto:
```gitignore
# Faltam estes padrões críticos:
*.pem               # Certificados
*.key               # Chaves privadas
.env.local          # Variáveis de ambiente locais
*.egg-info/         # Python packaging
secrets/            # Diretório de secrets
credentials/        # Credenciais salvas
docker-compose.local.yml  # Overrides com secrets
.DS_Store           # ✓ Já está
Thumbs.db           # ✓ Já está
```

### 🟢 Recomendações de melhoria:
1. Criar `.env.example` com placeholders
2. Adicionar seção para arquivos de certificação
3. Documentar o padrão de desenvolvimento local
4. Adicionar suporte a `.env.local` para overrides seguros

---

## 5. `.gitignore` RECOMENDADO (COMPLETO E SEGURO)

Crie/atualize `agro-bi-system/.gitignore` com o conteúdo abaixo:

```gitignore
# =====================================================================
# 🔒 ENVIRONMENT & SECRETS
# =====================================================================
.env
.env.local
.env.*.local
.env.*.prod
.env.example.prod
!.env.example
!.env.example.local

# =====================================================================
# 🔐 CREDENTIALS & KEYS
# =====================================================================
*.pem
*.key
*.p12
*.pfx
*.cert
*.crt
*.jks
*.keystore
secrets/
credentials/
.aws/
.gcp/
.azure/

# =====================================================================
# 🐍 PYTHON
# =====================================================================
__pycache__/
*.py[cod]
*.pyo
*.pyd
.Python
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
pip-log.txt
pip-delete-this-directory.txt
.venv/
.env/
.virtualenv/
*.pyc
.mypy_cache/
.dmypy.json
dmypy.json
.pyre/
htmlcov/
.coverage
.coverage.*
.cache
.pytest_cache/
*.cover
.hypothesis/

# =====================================================================
# 📦 NODE/FRONTEND
# =====================================================================
node_modules/
npm-debug.log*
npm-error.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
pnpm-error.log*
yarn.lock
package-lock.json
pnpm-lock.yaml
dist/
build/
.next/
out/

# =====================================================================
# 📝 LOGS
# =====================================================================
*.log
*.log.*
logs/
logs/**/*
!logs/.gitkeep
npm-debug.log
yarn-debug.log

# =====================================================================
# 💻 IDE & EDITOR
# =====================================================================
.vscode/
!.vscode/extensions.json
!.vscode/settings.json
.idea/
*.swp
*.swo
*~
.vscode/
.DS_Store
Thumbs.db
*.sublime-project
*.sublime-workspace
.project
.pydevproject
.settings/
*.iml
.gradle
.classpath

# =====================================================================
# 🐳 DOCKER
# =====================================================================
docker-compose.override.yml
docker-compose.local.yml
.dockerignore.local
.env.docker

# =====================================================================
# 📊 TEST & COVERAGE
# =====================================================================
.coverage
.coverage.*
htmlcov/
.pytest_cache/
.tox/
.hypothesis/
*.cover
.pytest_cache/
coverage.xml
*.cover[0-9]*

# =====================================================================
# 🌐 TEMPORARY & OS
# =====================================================================
*.tmp
*.temp
*.bak
*.swp
.AppleDouble
.LSOverride
._*
.Spotlight-V100
.Trashes
ehthumbs.db
$RECYCLE.BIN/
*.cab
*.tmp.*

# =====================================================================
# ⚙️ SYSTEM & MISC
# =====================================================================
.vscode/launch.json
.env.production
.env.staging
secrets.yml
config/secrets.yml
```

---

## 6. ARQUIVO `.env.example` RECOMENDADO

Crie `agro-bi-system/.env.example`:

```bash
# =====================================================================
# PostgreSQL Database Configuration
# =====================================================================
# IMPORTANTE: Em produção, use uma senha forte gerada com:
#   openssl rand -hex 16

POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME_IN_PRODUCTION
POSTGRES_DB=agro_estoque

# DATABASE_URL formato: postgresql+pg8000://usuario:senha@host:porta/database
DATABASE_URL=postgresql+pg8000://postgres:CHANGE_ME_IN_PRODUCTION@db:5432/agro_estoque

# =====================================================================
# Backend Security
# =====================================================================
# JWT Secret Key - Gere com: openssl rand -hex 32
# Mínimo 32 caracteres para produção
SECRET_KEY=YOUR_SECRET_KEY_HERE_GENERATE_WITH_openssl_rand_hex_32

# JWT Configuration
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# =====================================================================
# CORS Configuration
# =====================================================================
# Adicione todas as origens do frontend permitidas (separadas por vírgula)
# EXEMPLO: http://localhost:5173,https://app.example.com
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# =====================================================================
# Cookie Security
# =====================================================================
# Em produção com HTTPS, defina para 'true'
COOKIE_SECURE=false
COOKIE_SAMESITE=strict
AUTH_COOKIE_NAME=agro_bi_token

# =====================================================================
# HSTS (HTTP Strict Transport Security)
# =====================================================================
# Ative apenas em produção com HTTPS válido
ENABLE_HSTS=false

# =====================================================================
# Rede e Portas
# =====================================================================
BACKEND_HOST=backend
BACKEND_PORT=8000
FRONTEND_PORT=5173

# =====================================================================
# Logging
# =====================================================================
LOG_LEVEL=INFO
```

---

## 7. SEQUÊNCIA SEGURA PARA PRIMEIRO COMMIT

### ✅ PASSO 1: Remover `.env` do Git (se já foi commitado)
```bash
# Remover .env do histórico Git (IMPORTANTE!)
git rm --cached .env

# Verificar se foi removido
git status
# Deve mostrar: deleted:    .env
```

### ✅ PASSO 2: Criar `.env.example`
```bash
# Copiar .env para .env.example com placeholders
cp agro-bi-system/.env agro-bi-system/.env.example

# Editar .env.example e substituir valores sensíveis por placeholders
# (use um editor ou o comando abaixo)
```

### ✅ PASSO 3: Verificar `.gitignore`
```bash
# Copiar o .gitignore recomendado
# (Substitua o conteúdo do agro-bi-system/.gitignore com o fornecido acima)
```

### ✅ PASSO 4: Verificar quais arquivos serão commitados
```bash
# Listar TODOS os arquivos que serão enviados
git status

# Verificar conteúdo de arquivos específicos ANTES de commitar
git diff --cached agro-bi-system/.env    # Não deve existir após git rm
git diff --cached agro-bi-system/.gitignore
git diff --cached agro-bi-system/docker-compose.yml

# Tentar encontrar secrets (buscar por padrões conhecidos)
grep -r "PASSWORD\|SECRET\|TOKEN\|API_KEY" agro-bi-system/ --include="*.py" --include="*.js" --include="*.yml" --include="*.yaml"
```

### ✅ PASSO 5: Verificar especificamente por secrets
```bash
# Procurar por padrões de secrets em Python
grep -r "password.*=" agro-bi-system/backend/ --include="*.py"
grep -r "secret.*=" agro-bi-system/backend/ --include="*.py"
grep -r "api_key.*=" agro-bi-system/ --include="*.py"

# Procurar por hard-coded URLs de banco
grep -r "@db" agro-bi-system/ --include="*.py" --include="*.yml"

# Procurar por tokens JWT em código
grep -r "jwt\|JWT" agro-bi-system/backend/ --include="*.py"
```

### ✅ PASSO 6: Commits Finais
```bash
# Adicionar .gitignore atualizado
git add agro-bi-system/.gitignore

# Adicionar .env.example
git add agro-bi-system/.env.example

# Remover .env (já feito em PASSO 1)
git status  # Verificar que .env está em "Untracked" (não será commitado)

# Adicionar TODOS os outros arquivos (com segurança)
git add agro-bi-system/

# NÃO fazer git add -A (evita adicionar .env acidentalmente)

# Verificar novamente antes de commitar
git status

# Primeiro commit
git commit -m "chore: Initial commit - Agro-BI SaaS Platform

- FastAPI backend com autenticação JWT
- React frontend com Tailwind CSS
- PostgreSQL database com seed data
- Docker Compose para desenvolvimento
- Security: Rate limiting, CORS restrito, password hashing
- CI/CD ready: .gitignore, .dockerignore, .env.example"
```

---

## 8. COMANDOS VERIFICAÇÃO PRÉ-COMMIT

Execute ANTES de `git commit`:

```bash
#!/bin/bash
# Script: verify-before-commit.sh

echo "🔍 Verificando segurança do projeto antes de commit..."
echo ""

# 1. Verificar se .env está em untracked/ignored
if git ls-files --cached | grep -q "\.env$"; then
    echo "❌ CRÍTICO: .env está sendo commitado!"
    exit 1
else
    echo "✅ .env não será commitado"
fi

# 2. Verificar se .env.example existe
if [ ! -f "agro-bi-system/.env.example" ]; then
    echo "⚠️  AVISO: .env.example não existe"
else
    echo "✅ .env.example existe"
fi

# 3. Procurar por passwords/secrets em código
echo ""
echo "🔐 Procurando por strings sensíveis no código..."

FOUND_SECRETS=0

# Checar por padrões perigosos
if grep -r "PASSWORD.*=" agro-bi-system/*.py 2>/dev/null; then
    echo "⚠️  AVISO: PASSWORD encontrado em .py"
    FOUND_SECRETS=1
fi

if grep -r "SECRET.*=" agro-bi-system/*.py 2>/dev/null; then
    echo "⚠️  AVISO: SECRET encontrado em .py"
    FOUND_SECRETS=1
fi

if grep -r "API_KEY.*=" agro-bi-system/*.py 2>/dev/null; then
    echo "⚠️  AVISO: API_KEY encontrado em .py"
    FOUND_SECRETS=1
fi

# 4. Verificar por arquivos de chave
if find agro-bi-system -name "*.pem" -o -name "*.key" -o -name "*.p12" 2>/dev/null | grep -v node_modules | grep -v .git; then
    echo "❌ CRÍTICO: Arquivos de chave encontrados!"
    FOUND_SECRETS=1
else
    echo "✅ Nenhum arquivo de chave encontrado"
fi

# 5. Resultado final
echo ""
if [ $FOUND_SECRETS -eq 0 ]; then
    echo "✅ Verificação completada - Seguro para commit!"
    exit 0
else
    echo "❌ Verificação encontrou problemas - Não faça commit!"
    exit 1
fi
```

---

## 9. AÇÕES IMEDIATAS REQUERIDAS

### 🚨 ANTES DE QUALQUER `git add .`

1. **[ ] Remover `.env` do controle de versão**
   ```bash
   git rm --cached agro-bi-system/.env
   ```

2. **[ ] Criar `.env.example` seguro**
   ```bash
   # Use o template fornecido acima
   cp agro-bi-system/.env agro-bi-system/.env.example
   # Editar e substituir valores sensíveis por placeholders
   ```

3. **[ ] Atualizar `.gitignore`**
   ```bash
   # Use o `.gitignore` completo fornecido acima
   ```

4. **[ ] Executar verificação de segurança**
   ```bash
   # Executar o script de verificação acima
   bash verify-before-commit.sh
   ```

5. **[ ] Configurar Git para não aceitar `.env`**
   ```bash
   # Adicionar hook de pre-commit (opcional mas recomendado)
   git config core.safecrlf true
   ```

---

## 10. CHECKLIST FINAL ANTES DE GIT INIT

- [ ] Arquivo `.env` REMOVIDO do staging area
- [ ] Arquivo `.env.example` CRIADO com placeholders
- [ ] `.gitignore` ATUALIZADO com padrões de segurança
- [ ] Verificação de secrets executada - **ZERO secrets found**
- [ ] Nenhum arquivo `.pem`, `.key`, `.p12` presente
- [ ] Diretórios `secrets/` e `credentials/` não existem
- [ ] `docker-compose.override.yml` está em `.gitignore`
- [ ] Documentação de setup incluída no README
- [ ] Instruções de variáveis de ambiente documentadas

---

## 11. RECOMENDAÇÕES DE SEGURANÇA ADICIONAL

### Para futuro (Antes de Produção):

1. **Usar GitHub Secrets para CI/CD**
   ```yaml
   # .github/workflows/deploy.yml
   env:
     DATABASE_URL: ${{ secrets.DATABASE_URL }}
     SECRET_KEY: ${{ secrets.SECRET_KEY }}
   ```

2. **Implementar Secret Scanning**
   ```bash
   # GitHub: Settings → Security & analysis → Secret scanning
   # GitLab: Settings → Security & Compliance → Secret detection
   ```

3. **Usar Vault/Key Management Service**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Google Secret Manager

4. **Auditar commits anteriores (se aplicável)**
   ```bash
   git log -p --all -S "PASSWORD\|SECRET" -- agro-bi-system/
   ```

5. **Implementar pre-commit hooks**
   ```bash
   pip install pre-commit
   # Criar .pre-commit-config.yaml para detectar secrets
   ```

---

## ✅ RESUMO EXECUTIVO

| Aspecto | Status | Ação |
|---------|--------|------|
| `.env` versionado | 🔴 CRÍTICO | Remover com `git rm --cached` |
| `.gitignore` completo | 🟡 INCOMPLETO | Atualizar com template fornecido |
| Secrets em código | ✅ SEGURO | Código está bem-protegido |
| `.env.example` | 🔴 FALTANDO | Criar com placeholders |
| Certificados/chaves | ✅ NENHUM FOUND | OK |
| Docker security | ✅ BOM | Bem configurado |
| Autenticação JWT | ✅ SEGURA | Implementação correta |
| Database access | 🟡 RISCO | Remover senha do `.env` |

**Conclusão:** O projeto está bem estruturado de segurança, mas o arquivo `.env` está exposto. Após aplicar as correções acima, será seguro fazer o primeiro commit.

---

**Auditoria realizada em:** 2026-08-07  
**Próxima verificação recomendada:** Antes de primeiro deploy em produção
