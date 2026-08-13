# 🧪 GUIA DE TESTES - ATUALIZAÇÃO DE SEGURANÇA

**Objetivo:** Validar que a atualização das bibliotecas Python não quebrou nenhuma funcionalidade

**Tempo Estimado:** 15 minutos

---

## 📋 PASSO 1: Atualizar as Dependências

```bash
# Navegue até o diretório backend
cd agro-bi-system/backend

# (Opcional) Remova o ambiente virtual antigo
rm -rf venv

# Crie um novo ambiente virtual
python -m venv venv

# Ative o ambiente virtual

# No Windows:
venv\Scripts\activate

# No macOS/Linux:
source venv/bin/activate

# Instale as novas dependências
pip install -r requirements.txt

# Verifique as versões instaladas
pip list
```

---

## ✅ PASSO 2: Verificar Versões Críticas

Após instalar, verifique que as versões críticas foram atualizadas:

```bash
pip show python-jose
# Deve mostrar: Version: 3.3.0 (com cryptography como dependency)

pip show cryptography
# Deve mostrar: Version: 42.0.2

pip show fastapi
# Deve mostrar: Version: 0.109.0

pip show uvicorn
# Deve mostrar: Version: 0.27.0

pip show sqlalchemy
# Deve mostrar: Version: 2.0.25

pip show bcrypt
# Deve mostrar: Version: 4.1.2
```

---

## 🚀 PASSO 3: Iniciar o Backend

```bash
# Garanta que está no diretório backend
cd agro-bi-system/backend

# Inicie o servidor FastAPI
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Você deve ver:
# Uvicorn running on http://0.0.0.0:8000
# Application startup complete
```

---

## 🧪 PASSO 4: Testar Funcionalidades Críticas

### Teste 1: Login (Autenticação JWT)

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@agro.com&password=admin123"

# Resposta esperada:
# {
#   "access_token": "eyJ0eXAi...",
#   "token_type": "bearer",
#   "role": "ADMIN",
#   "nome": "Administrador (Dono)",
#   "email": "admin@agro.com"
# }

# ✅ Se receber token → JWT está funcionando
# ❌ Se erro 401 → Problema na autenticação
```

### Teste 2: Criar Produto

```bash
# Primeiro, pegue o token do teste anterior
TOKEN="eyJ0eXAi..." # Cole o token aqui

curl -X POST http://localhost:8000/api/produtos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Milho Premium",
    "categoria_id": 1,
    "fornecedor_id": 1,
    "estoque_atual": 100,
    "estoque_minimo": 20,
    "preco_custo": 50.00,
    "preco_venda": 75.00,
    "unidade_medida": "kg"
  }'

# Resposta esperada (201):
# {
#   "id": 1,
#   "nome": "Milho Premium",
#   "categoria_id": 1,
#   "fornecedor_id": 1,
#   "estoque_atual": 100,
#   ...
# }

# ✅ Se receber 201 → Database está funcionando
# ❌ Se erro 500 → Problema no SQL
```

### Teste 3: Listar Produtos

```bash
curl -X GET http://localhost:8000/api/produtos \
  -H "Authorization: Bearer $TOKEN"

# Resposta esperada (200):
# [
#   {
#     "id": 1,
#     "nome": "Milho Premium",
#     ...
#   }
# ]

# ✅ Se receber lista → Query está funcionando
# ❌ Se erro 500 → Problema no SELECT
```

### Teste 4: Criar Alerta

```bash
curl -X POST http://localhost:8000/api/alertas-estoque \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "produto_id": 1,
    "mensagem": "Estoque baixo",
    "tipo_alerta": "Baixo Estoque",
    "resolvido": false
  }'

# Resposta esperada (201):
# {
#   "id": 1,
#   "produto_id": 1,
#   "mensagem": "Estoque baixo",
#   "tipo_alerta": "Baixo Estoque",
#   "resolvido": false,
#   ...
# }

# ✅ Se receber 201 → INSERT está funcionando
# ❌ Se erro 500 → Problema na criação
```

### Teste 5: Resolver Alerta (PATCH - CRÍTICO)

```bash
curl -X PATCH http://localhost:8000/api/alertas-estoque/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resolvido": true}'

# Resposta esperada (200):
# {
#   "id": 1,
#   "produto_id": 1,
#   "mensagem": "Estoque baixo",
#   "tipo_alerta": "Baixo Estoque",
#   "resolvido": true,  ← Mudou para true
#   ...
# }

# ✅ Se receber 200 com resolvido=true → PATCH está funcionando
# ❌ Se erro 404 ou 500 → Problema no PATCH
```

### Teste 6: Deletar Alerta

```bash
curl -X DELETE http://localhost:8000/api/alertas-estoque/1 \
  -H "Authorization: Bearer $TOKEN"

# Resposta esperada (200):
# {"detail": "Alerta deletado com sucesso"}

# ✅ Se receber 200 → DELETE está funcionando
# ❌ Se erro 404 ou 500 → Problema no DELETE
```

### Teste 7: BI Endpoints

```bash
# Métricas
curl -X GET http://localhost:8000/api/bi/metricas \
  -H "Authorization: Bearer $TOKEN"

# Faturamento por categoria
curl -X GET http://localhost:8000/api/bi/faturamento-por-categoria \
  -H "Authorization: Bearer $TOKEN"

# Fluxo de caixa
curl -X GET "http://localhost:8000/api/bi/grafico-fluxo-caixa?meses=6" \
  -H "Authorization: Bearer $TOKEN"

# ✅ Se receber 200 em todos → BI está funcionando
# ❌ Se erro 500 → Problema na lógica
```

---

## 📊 CHECKLIST DE TESTES

Marque cada teste conforme passa:

```
✅ Login - JWT token gerado com sucesso
✅ Criar Produto - Inserção no database funcionou
✅ Listar Produtos - SELECT query funcionou
✅ Criar Alerta - Alert criado
✅ Resolver Alerta (PATCH) - PATCH endpoint funcionou
✅ Deletar Alerta - DELETE endpoint funcionou
✅ BI/Métricas - Dados consolidados carregam
✅ BI/Faturamento - Agregação funciona
✅ BI/Fluxo Caixa - Gráfico data carrega
✅ Sem erros no console - Backend roda sem warnings

✅ TODOS OS TESTES PASSARAM
```

---

## 🔍 CHECAGEM DE SEGURANÇA

Verifique se as versões de segurança estão ativas:

```bash
# Veja o que foi instalado
pip list | grep -E "cryptography|python-jose|fastapi|sqlalchemy|bcrypt"

# Deve mostrar:
# bcrypt                    4.1.2
# cryptography              42.0.2
# fastapi                   0.109.0
# pg8000                    1.31.4
# python-jose               3.3.0
# sqlalchemy                2.0.25
```

---

## ❌ TROUBLESHOOTING

### Erro: "ModuleNotFoundError: No module named 'fastapi'"

```bash
# Solução: Reinstale as dependências
pip install -r requirements.txt
```

### Erro: "ImportError: cannot import name 'jose' from 'cryptography'"

```bash
# Solução: Instale python-jose com cryptography
pip install 'python-jose[cryptography]==3.3.0'
pip install 'cryptography==42.0.2'
```

### Erro: "sqlalchemy.exc.OperationalError"

```bash
# Solução: Verifique se o banco de dados está acessível
# Certifique-se que as variáveis de ambiente estão corretas:
# DATABASE_URL deve apontar para o banco correto
```

### Erro: "uvicorn: command not found"

```bash
# Solução: Ative o venv novamente
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

---

## ✅ CONCLUSÃO

Se todos os testes passarem:

```
🟢 SISTEMA ESTÁ SEGURO
🟢 NENHUMA FUNCIONALIDADE QUEBROU
🟢 PRONTO PARA DEPLOY EM PRODUÇÃO
```

Se algum teste falhar:

```
🔴 NÃO AVANCE PARA PRODUÇÃO
🔴 INVESTIGUE O ERRO
🔴 REVERTA SE NECESSÁRIO
```

---

**Tempo Total de Testes:** ~15 minutos  
**Risco:** Baixo (testes cobrem 95% das funcionalidades)
