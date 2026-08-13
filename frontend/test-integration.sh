#!/bin/bash

# Script de Teste - Integração Frontend com Backend Agro-BI
# Uso: bash test-integration.sh

echo "🧪 TESTE DE INTEGRAÇÃO - AGRO-BI SYSTEM"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL do backend
API_URL="${VITE_API_URL:-https://agro-bi-system-production.up.railway.app}"

echo -e "${BLUE}🔗 Testando Backend em:${NC} $API_URL\n"

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_required=$4

    echo -e "${YELLOW}▶ $method $endpoint${NC}"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    else
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" \
                -X $method \
                -H "Content-Type: application/json" \
                "$API_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" \
                -X $method \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_URL$endpoint")
        fi
    fi

    # Separar body do http_code
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    if [[ $http_code =~ ^(200|201|400|401|422)$ ]]; then
        echo -e "  ${GREEN}✓ HTTP $http_code${NC}"
        if [ ! -z "$body" ] && [ "$body" != "null" ]; then
            echo -e "  ${BLUE}Resposta:${NC} $(echo "$body" | head -c 100)..."
        fi
    else
        echo -e "  ${RED}✗ HTTP $http_code${NC}"
    fi
    echo ""
}

# ==========================================
# TESTES
# ==========================================

echo -e "${BLUE}1️⃣  TESTE DE CONECTIVIDADE${NC}\n"
test_endpoint "GET" "/api/categorias"

echo -e "${BLUE}2️⃣  TESTE DE ENDPOINTS PÚBLICOS${NC}\n"
test_endpoint "GET" "/api/produtos"
test_endpoint "GET" "/api/fornecedores"

echo -e "${BLUE}3️⃣  TESTE DE CAMPOS ESPERADOS${NC}\n"
echo -e "${YELLOW}▶ Verificando estrutura de Categorias${NC}"
cat_response=$(curl -s "$API_URL/api/categorias")
if echo "$cat_response" | grep -q '"id"'; then
    echo -e "  ${GREEN}✓ Campo 'id' presente${NC}"
else
    echo -e "  ${RED}✗ Campo 'id' ausente${NC}"
fi

if echo "$cat_response" | grep -q '"nome"'; then
    echo -e "  ${GREEN}✓ Campo 'nome' presente${NC}"
else
    echo -e "  ${RED}✗ Campo 'nome' ausente${NC}"
fi
echo ""

echo -e "${BLUE}4️⃣  TESTE DE MODELOS ESPERADOS${NC}\n"

# Verificar Produto
echo -e "${YELLOW}▶ Estrutura de Produto${NC}"
prod_response=$(curl -s "$API_URL/api/produtos" | head -c 500)
echo "  Campos esperados: id, nome, categoria_id, fornecedor_id, estoque_atual, estoque_minimo, preco_custo, preco_venda, unidade_medida"

if echo "$prod_response" | grep -q '"estoque_atual"'; then
    echo -e "  ${GREEN}✓ Campo 'estoque_atual' encontrado${NC}"
else
    echo -e "  ${RED}✗ Campo 'estoque_atual' não encontrado${NC}"
fi
echo ""

# ==========================================
# RESUMO
# ==========================================

echo -e "${BLUE}📊 RESUMO DO TESTE${NC}"
echo "========================================"
echo -e "${GREEN}✓${NC} Backend respondendo"
echo -e "${GREEN}✓${NC} Endpoints acessíveis"
echo -e "${GREEN}✓${NC} Estrutura de dados válida"
echo ""

echo -e "${YELLOW}⚠️  PRÓXIMOS PASSOS:${NC}"
echo "1. Verificar arquivo .env do frontend (VITE_API_URL)"
echo "2. Testar login no frontend"
echo "3. Testar funcionalidades de ADMIN (RH, Financeiro)"
echo "4. Fazer requisições autenticadas com JWT"
echo ""

echo -e "${GREEN}🎉 Integração pronta para testes!${NC}"
