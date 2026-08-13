# ✅ ANÁLISE DE TRAVAS DE USABILIDADE - FRONTEND AGRO-BI

## 🎯 Problema Solucionado

### ✅ PROBLEMA ORIGINAL (Estoque):
**Sem categorias ou fornecedores cadastrados** = Usuário fica preso
- Ao abrir modal de Produto, precisa selecionar categoria e fornecedor
- Se forem vazios → Não consegue criar nenhum produto
- Força reload da página ou logout/login para tentar refrescar

**SOLUÇÃO IMPLEMENTADA:**
- ✅ Abas dentro do modal (Produto, Categoria, Fornecedor)
- ✅ Usuário pode cadastrar Categoria/Fornecedor inline no mesmo modal
- ✅ Listas atualizam automaticamente sem recarregar
- ✅ Modal permanece aberto para continuar cadastrando

---

## 🔍 OUTRAS TRAVAS DE USABILIDADE IDENTIFICADAS

### 🔴 TRAVA #1: Novo Alerta sem Produtos Cadastrados

**PROBLEMA:**
```
Local: Alertas.jsx + CadastroModal.jsx
Aba: Alertas
Ação: Clica em "Novo Alerta"
```

**O que acontece:**
1. Modal de alerta abre
2. Select de "Produto" vem vazio (lista não carregada)
3. Usuário não consegue criar alerta pois não há produtos
4. Sem avisos claros

**Por quê ocorre:**
- `Alertas.jsx` carrega produtos quando abre (useEffect)
- Se não houver produtos → select fica vazio
- Usuário vê "Selecione um produto" mas não entende por quê
- Sem callback para avisar que a lista está vazia

**SOLUÇÃO:**
```jsx
// Em Alertas.jsx - adicionar verificação

const handleNovoAlerta = () => {
  if (produtos.length === 0) {
    setError('Nenhum produto disponível. Crie um produto antes de criar alertas.');
    return;
  }
  setModalAberto(true);
};

// Mudar o onClick do botão:
<button onClick={handleNovoAlerta}>  // era setModalAberto(true)
```

---

### 🔴 TRAVA #2: Editar Funcionário (Botão não funciona)

**PROBLEMA:**
```
Local: RH.jsx, coluna Ações
Componente: Botão Edit2 (lápis)
```

**O que acontece:**
1. Existe um botão de editar (lápis) em cada linha de funcionário
2. Ao clicar... nada acontece (onClick vazio)
3. Usuário confunde: o botão funciona? Por quê não faz nada?

**Por quê ocorre:**
- Código menciona "// Editar" mas não há implementação
- Botão existe mas sem funcionalidade
- Gera confusão sobre feature

**SOLUÇÃO:**
```jsx
// Em RH.jsx - remover ou implementar

// OPÇÃO 1: Remover se não será usado
{/* <button ... /> comentário de edit */}

// OPÇÃO 2: Implementar edit
const [funcionarioEditando, setFuncionarioEditando] = useState(null);

const handleEditarFuncionario = (funcionario) => {
  setFuncionarioEditando(funcionario);
  setModalAberto(true);
};

// Depois passar tipo dinamicamente ao modal
<CadastroModal
  tipo={funcionarioEditando ? 'funcionario-edit' : 'funcionario'}
  editandoId={funcionarioEditando?.id}
/>
```

---

### 🔴 TRAVA #3: Financeiro - Sem Categorias de Lançamento Pré-definidas

**PROBLEMA:**
```
Local: Financeiro.jsx + CadastroModal.jsx
Campo: "Categoria Financeira" (type="text")
```

**O que acontece:**
1. Modal de Lançamento abre
2. Campo "Categoria Financeira" é um texto livre (não select)
3. Usuário digita "Vendas" uma vez
4. Próxima vez, digita "Vendas de Grãos" (diferente)
5. Terceira vez, digita "Receita de Grãos"
6. Dados inconsistentes no banco: 3 categorias diferentes, mesma coisa

**Por quê ocorre:**
- Campo é input text em vez de select
- Sem validação/autocomplete
- Backend não impõe restrições (campo string)
- Leva a dados sujos e relatorios quebrados

**SOLUÇÃO:**
```jsx
// Mudar campo de input para select com opções

const categoriasFinanceiras = [
  'Vendas de Grãos',
  'Vendas de Insumos',
  'Combustível',
  'Manutenção',
  'Salários',
  'Compra de Insumos',
  'Juros',
  'Impostos',
];

// Em CadastroModal.jsx, trocar:
// <input type="text" name="categoria_financeira" />
// Por:
<select name="categoria_financeira" required>
  <option value="">Selecione...</option>
  {categoriasFinanceiras.map(cat => (
    <option key={cat} value={cat}>{cat}</option>
  ))}
</select>

// Ou fazer uma tabela de categorias + CRUD
```

---

### 🟡 TRAVA #4: Produto sem Estoque Inicial

**PROBLEMA:**
```
Local: Estoque.jsx + CadastroModal.jsx
Campo: "Estoque Atual", "Estoque Mínimo"
```

**O que acontece:**
1. Usuário cria produto com estoque_atual = 0 (padrão)
2. Sistema cria alerta "Produto em falta"
3. Usuário quer atualizar estoque
4. Não há endpoint PUT/PATCH para atualizar produto
5. Precisa deletar e recriar

**Por quê ocorre:**
- CadastroModal só faz POST (criar)
- Sem endpoint para editar produtos
- Sem forma de atualizar estoque depois

**SOLUÇÃO - IMEDIATA:**
```jsx
// Em CadastroModal.jsx, estoque padrão deve ser melhor informado

<div>
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Estoque Atual
    <span className="text-xs text-slate-500"> (deixe em 0 se não tiver stock agora)</span>
  </label>
  <input
    type="number"
    name="estoque_atual"
    value={formData.estoque_atual || 0}
    onChange={handleChange}
    min="0"
    step="0.01"
    placeholder="Ex: 100"
    className="..."
  />
</div>
```

**SOLUÇÃO - LONGA PRAZO:**
- Implementar endpoint PATCH `/api/produtos/{id}`
- Adicionar recurso de editar produtos
- Permitir atualizar estoque sem deletar

---

### 🟡 TRAVA #5: Sem Validação de CNPJ/CPF

**PROBLEMA:**
```
Local: CadastroModal.jsx
Campos: CNPJ (fornecedor), CPF (funcionário)
```

**O que acontece:**
1. Usuário digita CNPJ incorreto: "123"
2. Sistema aceita sem validar
3. Dados inconsistentes no banco
4. Depois não consegue filtrar/buscar por CPF/CNPJ

**Por quê ocorre:**
- Inputs são type="text" sem validação
- Backend provavelmente não valida também

**SOLUÇÃO:**
```jsx
// Adicionar validação simples no frontend

const validarCPF = (cpf) => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.length === 11;
};

const validarCNPJ = (cnpj) => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.length === 14;
};

// Em validateForm():
if (currentTipo === 'funcionario' && formData.cpf) {
  if (!validarCPF(formData.cpf)) {
    setError('CPF deve ter 11 dígitos');
    return false;
  }
}

if (currentTipo === 'fornecedor' && formData.cnpj) {
  if (!validarCNPJ(formData.cnpj)) {
    setError('CNPJ deve ter 14 dígitos');
    return false;
  }
}
```

---

### 🟡 TRAVA #6: Mensagens de Erro Genéricas

**PROBLEMA:**
```
Local: Todos os componentes
Exemplos: "Erro ao salvar", "Erro ao carregar dados"
```

**O que acontece:**
1. Algo falha na API
2. Usuário vê: "Erro ao salvar produto"
3. Não entende o quê foi (servidor cai? Campo inválido? Sem permissão?)
4. Sem contexto para agir

**Por quês ocorre:**
```javascript
// Código atual (genérico)
catch (err) {
  setError(err.message || `Erro ao salvar ${tipo}`);
}

// Deveria ser mais específico:
// 400 = validação
// 401 = sem permissão
// 409 = conflito (duplicado)
// 500 = servidor erro
```

**SOLUÇÃO:**
```jsx
const tratarErroAPI = (err, httpCode) => {
  const mensagens = {
    400: 'Dados inválidos. Verifique os campos.',
    401: 'Você não tem permissão para esta ação.',
    409: 'Este item já existe no sistema.',
    422: 'Erro de validação. Verifique os dados.',
    500: 'Erro do servidor. Tente novamente.',
    503: 'Servidor indisponível. Tente mais tarde.',
  };
  
  return mensagens[httpCode] || err.message || 'Algo deu errado';
};

// No handleSubmit:
try {
  // ...
} catch (err) {
  const httpCode = err.response?.status;
  setError(tratarErroAPI(err, httpCode));
}
```

---

### 🟡 TRAVA #7: Limite de Rows em Tabelas

**PROBLEMA:**
```
Local: Estoque.jsx, RH.jsx, Alertas.jsx, Financeiro.jsx
Cenário: Muitos registros (100+)
```

**O que acontece:**
1. Sistema carrega TODOS os registros na tabela
2. Página fica lenta (browser renderiza 200+ linhas)
3. Scroll infinito
4. Sem paginação

**Por quê ocorre:**
- Não há implementação de pagination
- `carregarDados()` pega GET /api/produtos (sem limite)

**SOLUÇÃO:**
```jsx
// Em Estoque.jsx, adicionar estado:

const [paginaAtual, setPaginaAtual] = useState(1);
const itemsPorPagina = 20;

const produtosPaginados = produtos.slice(
  (paginaAtual - 1) * itemsPorPagina,
  paginaAtual * itemsPorPagina
);

const totalPaginas = Math.ceil(produtos.length / itemsPorPagina);

// Depois da tabela, adicionar:
{totalPaginas > 1 && (
  <div className="flex gap-2 p-4 justify-center">
    {Array.from({ length: totalPaginas }).map((_, i) => (
      <button
        key={i + 1}
        onClick={() => setPaginaAtual(i + 1)}
        className={`px-3 py-1 rounded ${
          paginaAtual === i + 1
            ? 'bg-emerald-700 text-white'
            : 'border border-slate-300'
        }`}
      >
        {i + 1}
      </button>
    ))}
  </div>
)}
```

---

## 📊 RESUMO DE TRAVAS ENCONTRADAS

| Trava | Severidade | Localização | Impacto | Status |
|-------|-----------|------------|---------|--------|
| #1: Alerta sem produtos | 🔴 CRÍTICA | Alertas.jsx | Não consegue criar alerta | ❌ NÃO CORRIGIDO |
| #2: Editar funcionário | 🟡 MÉDIA | RH.jsx | Confunde usuário | ❌ NÃO CORRIGIDO |
| #3: Categoria texto livre | 🟡 MÉDIA | Financeiro.jsx | Dados inconsistentes | ❌ NÃO CORRIGIDO |
| #4: Sem edição de produto | 🟡 MÉDIA | Estoque.jsx | Precisa deletar/recriar | ❌ NÃO CORRIGIDO |
| #5: Sem validação CPF/CNPJ | 🟡 MÉDIA | CadastroModal.jsx | Dados inválidos | ❌ NÃO CORRIGIDO |
| #6: Erros genéricos | 🟡 MÉDIA | Todos | Confunde usuário | ⚠️ PARCIAL |
| #7: Sem paginação | 🟡 MÉDIA | Tabelas | Lentidão com muitos dados | ❌ NÃO CORRIGIDO |

---

## 🎯 RECOMENDAÇÕES DE PRIORIDADE

### HOJE (Crítica):
- [x] **Trava #1**: Validar se há produtos antes de abrir modal de alerta

### ESTA SEMANA (Alta):
- [ ] **Trava #3**: Mudar "Categoria Financeira" para select
- [ ] **Trava #5**: Validar CPF/CNPJ com regex
- [ ] **Trava #6**: Mensagens de erro mais específicas

### PRÓXIMA SEMANA (Média):
- [ ] **Trava #2**: Implementar edição de funcionário
- [ ] **Trava #4**: Implementar PATCH /api/produtos/{id}
- [ ] **Trava #7**: Adicionar paginação

---

## ✅ CONCLUSÃO

O sistema tem **7 travas** de usabilidade. A mais crítica é não poder criar alertas sem produtos. As demais causam confusão ou inconsistência de dados.

O problema original (sem categorias/fornecedores) **foi corrigido com sucesso** usando abas no modal.

Recomendo implementar as correções por severidade para melhorar a experiência do usuário progressivamente.
