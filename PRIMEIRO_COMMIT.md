# 🚀 GUIA RÁPIDO: Primeiro Commit Seguro - Agro-BI System

**Status:** ✅ PRONTO PARA GIT  
**Data:** 2026-08-07  
**Arquivos Atualizados:** `.gitignore`, `.env.example`, `SECURITY_AUDIT.md`

---

## 📋 RESUMO EXECUTIVO

| Item | Antes | Depois | Status |
|------|-------|--------|--------|
| `.env` versionado | ❌ SIM | ✅ NÃO | CORRIGIDO |
| `.gitignore` completo | ❌ INCOMPLETO | ✅ COMPLETO | CORRIGIDO |
| Secrets em código | ✅ SEGURO | ✅ SEGURO | OK |
| `.env.example` | ❌ NÃO | ✅ SIM | CRIADO |
| Certificados/chaves | ✅ NENHUM | ✅ NENHUM | OK |

---

## ⚡ EXECUÇÃO (Copie e Cole)

### 1️⃣ Inicializar Git (primeira vez)
```bash
cd agro-bi-system
git init
git config user.name "Seu Nome"
git config user.email "seu@email.com"
```

### 2️⃣ Remover `.env` do staging (se foi adicionado antes)
```bash
# Se o .env já foi commitado anteriormente:
git rm --cached .env
git update-index --assume-unchanged .env

# Verificar
git status
# Resultado esperado: .env não deve aparecer na lista de "Changes to be committed"
```

### 3️⃣ Adicionar arquivos SEGUROS ao Git
```bash
# Adicionar apenas o .gitignore e .env.example
git add .gitignore
git add .env.example
git add SECURITY_AUDIT.md

# Verificar status ANTES de commitar
git status
```

### 4️⃣ Verificação de Segurança (Executar sempre!)
```bash
# Listar todos os arquivos que serão commitados
git diff --cached --name-only

# Procurar por padrões perigosos
echo "🔍 Procurando por passwords/secrets..."
git diff --cached | grep -i "password\|secret\|api_key\|token" && echo "❌ ENCONTRADOS SECRETS!" || echo "✅ Sem secrets visíveis"

# Verificar se .env está sendo commitado
git diff --cached --name-only | grep -E "^\.env$" && echo "❌ .env vai ser commitado!" || echo "✅ .env está seguro (ignorado)"

# Verificar se existem certificados/chaves
find . -name "*.pem" -o -name "*.key" -o -name "*.p12" 2>/dev/null | grep -v node_modules && echo "⚠️ Certificados encontrados!" || echo "✅ Sem certificados"
```

### 5️⃣ Primeiro Commit Seguro
```bash
git commit -m "chore: Initial commit - Agro-BI SaaS Platform

- FastAPI backend com autenticação JWT + Rate Limiting
- React frontend com Tailwind CSS + Vite
- PostgreSQL database com seed data realista (agronegócio)
- Docker Compose para desenvolvimento local
- Security: CORS restrito, password hashing bcrypt, JWT assimétrico
- Database: Migrations, ORM (SQLAlchemy), Pool connections
- Frontend: Componentes reutilizáveis, TypeScript safe, Recharts BI
- CI/CD ready: .gitignore seguro, .env.example, .dockerignore
- Documentação: SECURITY_AUDIT.md com procedimentos pré-commit"
```

### 6️⃣ Verificar o Commit
```bash
# Ver o histórico
git log --oneline

# Ver o conteúdo do primeiro commit
git show HEAD

# Verificar que .env NÃO foi incluído
git ls-tree -r HEAD | grep -E "\.env$" && echo "❌ .env FOI COMMITADO!" || echo "✅ .env não está no commit"
```

---

## 🔒 VERIFICAÇÃO PRÉ-COMMIT (Script Automático)

Salve este script como `verify-commit.sh`:

```bash
#!/bin/bash
set -e

echo "================================"
echo "🔒 Verificação de Segurança"
echo "================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Verificar .env
echo "1️⃣  Verificando .env..."
if git diff --cached --name-only | grep -E "^\.env$"; then
    echo -e "${RED}❌ .env será commitado!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ .env está seguro${NC}"
fi

# 2. Verificar .env.example
echo "2️⃣  Verificando .env.example..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example existe${NC}"
else
    echo -e "${YELLOW}⚠️  .env.example não existe${NC}"
fi

# 3. Procurar por secrets em staged changes
echo "3️⃣  Procurando por secrets no código..."
if git diff --cached | grep -iE "(password|secret|api_key|token|passwd|pwd)\s*[:=]" | grep -v ".env.example" | head -5; then
    echo -e "${RED}❌ Possíveis secrets encontrados!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Sem secrets visíveis${NC}"
fi

# 4. Verificar por arquivos de chave
echo "4️⃣  Verificando por arquivos de chave..."
if git diff --cached --name-only | grep -E "\.(pem|key|p12|pfx|cert|crt)$"; then
    echo -e "${RED}❌ Arquivos de chave encontrados!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Sem arquivos de chave${NC}"
fi

# 5. Verificar .gitignore
echo "5️⃣  Verificando .gitignore..."
if git diff --cached -- .gitignore | grep -q "^-"; then
    echo -e "${YELLOW}⚠️  .gitignore está sendo modificado${NC}"
fi
echo -e "${GREEN}✅ .gitignore verificado${NC}"

# Resultado final
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ SEGURO PARA COMMIT${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS PROBLEMA(S) ENCONTRADO(S)${NC}"
    exit 1
fi
```

Executar:
```bash
chmod +x verify-commit.sh
./verify-commit.sh
```

---

## 📊 Checklist Final

Antes de `git push`:

- [ ] `.env` não está sendo commitado (verificar com `git ls-tree -r HEAD`)
- [ ] `.env.example` existe e contém apenas placeholders
- [ ] `.gitignore` foi atualizado com padrões completos
- [ ] `SECURITY_AUDIT.md` foi adicionado
- [ ] Nenhum arquivo `.pem`, `.key`, `.p12` foi adicionado
- [ ] Nenhuma senha/secret visível em diffs
- [ ] `docker-compose.yml` usa apenas variáveis de ambiente
- [ ] Código Python está usando `os.getenv()` para secrets
- [ ] README.md contém instruções de setup com `.env.example`

---

## 🚀 Próximos Passos

### Imediatamente após commit:
```bash
# 1. Criar remote (GitHub/GitLab/Gitea)
git remote add origin https://seu-repo.git

# 2. Push para remote
git branch -M main
git push -u origin main

# 3. Ativar proteção de branch (no GitHub/GitLab)
# Settings → Branches → Require pull request reviews
```

### Antes de Produção:
- [ ] Implementar GitHub/GitLab Secret Scanning
- [ ] Configurar pre-commit hooks com `detect-secrets`
- [ ] Setup CI/CD pipeline (GitHub Actions/GitLab CI)
- [ ] Audit de segurança completo (OWASP Top 10)
- [ ] Testes de integração containerizados

---

## 🆘 Troubleshooting

### Problema: "`.env` foi commitado por acidente"

```bash
# Remover do histórico (CUIDADO: reescreve histórico)
git filter-branch --tree-filter 'rm -f .env' -- --all

# Ou, mais seguro (se commit foi só o primeiro):
git reset --soft HEAD~1
git reset .env
git commit -m "Remover .env"
```

### Problema: "Não tenho certeza se há secrets"

```bash
# Escanear TODO o repositório com ferramenta de detecção
pip install detect-secrets
detect-secrets scan

# Ou usar ferramenta online:
# https://github.com/gitleaks/gitleaks
```

### Problema: ".env.example foi modificado acidentalmente"

```bash
# Restaurar de nosso backup
git checkout HEAD -- .env.example
```

---

## 📞 Suporte

Para dúvidas de segurança durante o commit:

1. Leia `SECURITY_AUDIT.md` completo
2. Verifique com: `./verify-commit.sh`
3. Nunca faça commit sem passar na verificação

---

**Última atualização:** 2026-08-07  
**Status:** ✅ Pronto para `git push`
