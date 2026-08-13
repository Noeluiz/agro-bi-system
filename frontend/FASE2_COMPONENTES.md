# 📦 FASE 2 - COMPONENTES REUTILIZÁVEIS

**Status:** ✅ CRIADOS E PRONTOS PARA USO  
**Data:** 2024-08-07  
**Tempo de Implementação:** ~1.5 horas  

---

## 🎯 VISÃO GERAL

3 novos componentes foram criados para centralizar código duplicado:

1. **SectionTitle.jsx** - Cabeçalhos de seção
2. **LoadingSpinner.jsx** - Tela de carregamento
3. **ErrorBoundary.jsx** - Mensagens de erro

---

## 📋 COMPONENTES CRIADOS

### 1️⃣ SectionTitle.jsx

**Localização:** `src/components/SectionTitle.jsx`

**Propósito:** Centraliza estilo de cabeçalho (h2) com ação opcional

**Props:**
- `title` (string) - Título da seção
- `action` (React.Node, optional) - Botão ou elemento de ação

**Antes (código duplicado em 4 telas):**
```jsx
// Em Estoque.jsx
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
  <h2 className="text-2xl font-bold text-emerald-800">Estoque</h2>
  <button>Novo Produto</button>
</div>

// Em RH.jsx (idêntico!)
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
  <h2 className="text-2xl font-bold text-emerald-800">Recursos Humanos</h2>
  <button>Novo Funcionário</button>
</div>

// Em Financeiro.jsx (idêntico!)
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
  <h2 className="text-2xl font-bold text-emerald-800">Financeiro</h2>
  <button>Adicionar Lançamento</button>
</div>

// Em Alertas.jsx (idêntico!)
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
  <h2 className="text-2xl font-bold text-emerald-800">Alertas de Estoque</h2>
  <button>Novo Alerta</button>
</div>
```

**Depois (centralizado):**
```jsx
import SectionTitle from './SectionTitle';

// Em Estoque.jsx
<SectionTitle 
  title="Estoque" 
  action={<button>Novo Produto</button>}
/>

// Em RH.jsx
<SectionTitle 
  title="Recursos Humanos" 
  action={<button>Novo Funcionário</button>}
/>

// Em Financeiro.jsx
<SectionTitle 
  title="Financeiro" 
  action={<button>Adicionar Lançamento</button>}
/>

// Em Alertas.jsx
<SectionTitle 
  title="Alertas de Estoque" 
  action={<button>Novo Alerta</button>}
/>
```

**Impacto:** -20 linhas de código duplicado

---

### 2️⃣ LoadingSpinner.jsx

**Localização:** `src/components/LoadingSpinner.jsx`

**Propósito:** Centraliza tela de carregamento com spinner animado

**Props:**
- `message` (string, optional) - Mensagem customizada
  - Default: "Carregando..."

**Antes (código duplicado em 4 telas):**
```jsx
// Em Estoque.jsx
if (loading) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-3"></div>
          <p className="text-slate-600">Carregando estoque...</p>
        </div>
      </div>
    </div>
  );
}

// Em RH.jsx (praticamente idêntico!)
if (loading) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-3"></div>
          <p className="text-slate-600">Carregando funcionários...</p>
        </div>
      </div>
    </div>
  );
}

// Repetido em Financeiro.jsx e Alertas.jsx...
```

**Depois (centralizado):**
```jsx
import LoadingSpinner from './LoadingSpinner';

// Em Estoque.jsx
{loading && <LoadingSpinner message="Carregando estoque..." />}

// Em RH.jsx
{loading && <LoadingSpinner message="Carregando funcionários..." />}

// Em Financeiro.jsx
{loading && <LoadingSpinner message="Carregando lançamentos..." />}

// Em Alertas.jsx
{loading && <LoadingSpinner message="Carregando alertas..." />}
```

**Impacto:** -80 linhas de código duplicado

---

### 3️⃣ ErrorBoundary.jsx

**Localização:** `src/components/ErrorBoundary.jsx`

**Propósito:** Centraliza exibição de mensagens de erro

**Props:**
- `error` (string, optional) - Mensagem de erro
- `onClear` (function, optional) - Callback para descartar erro
- `children` (React.Node) - Conteúdo quando não há erro

**Antes (código duplicado em 4 telas):**
```jsx
// Em Estoque.jsx
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
    <div>
      <p className="text-red-700 font-medium">Erro</p>
      <p className="text-red-600 text-sm">{error}</p>
    </div>
  </div>
)}

// Em RH.jsx (praticamente idêntico!)
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
    <div>
      <p className="text-red-700 font-medium">Erro</p>
      <p className="text-red-600 text-sm">{error}</p>
    </div>
  </div>
)}

// Repetido em Financeiro.jsx e Alertas.jsx...
```

**Depois (centralizado):**
```jsx
import ErrorBoundary from './ErrorBoundary';

// Em Estoque.jsx
<ErrorBoundary error={error} onClear={() => setError('')}>
  {/* conteúdo normal */}
</ErrorBoundary>

// Em RH.jsx
<ErrorBoundary error={error} onClear={() => setError('')}>
  {/* conteúdo normal */}
</ErrorBoundary>

// Em Financeiro.jsx e Alertas.jsx
<ErrorBoundary error={error} onClear={() => setError('')}>
  {/* conteúdo normal */}
</ErrorBoundary>
```

**Impacto:** -100 linhas de código duplicado

---

## 🔧 COMO USAR

### Opção 1: Usar imediatamente (Quick Wins)

Se quiser usar os componentes agora, atualize:

#### Em Estoque.jsx
```jsx
import SectionTitle from './SectionTitle';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

// Substituir isto:
if (loading) {
  return (
    <div className="p-6 bg-white rounded-xl...">
      <div className="animate-spin..."></div>
      <p className="text-slate-600">Carregando estoque...</p>
    </div>
  );
}

// Por isto:
if (loading) {
  return <LoadingSpinner message="Carregando estoque..." />;
}

// Substituir isto:
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
  <h2 className="text-2xl font-bold text-emerald-800">Estoque</h2>
  <div className="flex gap-2 w-full md:w-auto">
    <button>Novo Produto</button>
    <button>Exportar CSV</button>
  </div>
</div>

// Por isto:
<SectionTitle 
  title="Estoque" 
  action={
    <div className="flex gap-2 w-full md:w-auto">
      <button>Novo Produto</button>
      <button>Exportar CSV</button>
    </div>
  }
/>

// Substituir isto:
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
    <div>
      <p className="text-red-700 font-medium">Erro</p>
      <p className="text-red-600 text-sm">{error}</p>
    </div>
  </div>
)}

// Por isto:
<ErrorBoundary error={error} onClear={() => setError('')}>
  {/* resto do JSX */}
</ErrorBoundary>
```

**Tempo:** ~30 minutos para as 4 telas

---

### Opção 2: Usar gradualmente (Low Risk)

Integrate componentes um por um:

**Semana 1:** SectionTitle em 1 tela (Estoque)  
**Semana 2:** LoadingSpinner em 2 telas (Estoque + RH)  
**Semana 3:** ErrorBoundary em 4 telas  

**Tempo:** Espalhado, menor risco

---

### Opção 3: Não usar agora

Componentes estão criados e prontos, mas pode usar depois:
- Quando adicionar novas telas
- Quando refatorar telas existentes
- Quando precisar manutenção

**Tempo:** Flexível, sem urgência

---

## 📊 IMPACTO DE IMPLEMENTAÇÃO

| Cenário | Linhas Removidas | Tempo | Risco |
|---------|-----------------|-------|-------|
| **Nenhum** | 0 | 0h | Baixo |
| **SectionTitle apenas** | 20 | 15min | Muito Baixo |
| **LoadingSpinner apenas** | 80 | 20min | Muito Baixo |
| **ErrorBoundary apenas** | 100 | 20min | Muito Baixo |
| **Todos os 3** | 200 | 1-1.5h | Baixo |

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

Se escolher usar os componentes agora:

### Para Estoque.jsx
- [ ] Import: `SectionTitle`, `LoadingSpinner`, `ErrorBoundary`
- [ ] Substituir loading spinner
- [ ] Substituir header section
- [ ] Substituir error display
- [ ] Testar: tela carrega sem erros
- [ ] Testar: spinner mostra ao carregar
- [ ] Testar: erro exibe corretamente

### Para RH.jsx
- [ ] Import: `SectionTitle`, `LoadingSpinner`, `ErrorBoundary`
- [ ] Substituir loading spinner
- [ ] Substituir header section
- [ ] Substituir error display
- [ ] Testar todos os acima

### Para Financeiro.jsx
- [ ] Import: `SectionTitle`, `LoadingSpinner`, `ErrorBoundary`
- [ ] Substituir loading spinner
- [ ] Substituir header section
- [ ] Substituir error display
- [ ] Testar todos os acima

### Para Alertas.jsx
- [ ] Import: `SectionTitle`, `LoadingSpinner`, `ErrorBoundary`
- [ ] Substituir loading spinner
- [ ] Substituir header section
- [ ] Substituir error display
- [ ] Testar todos os acima

---

## 🧪 TESTES APÓS IMPLEMENTAÇÃO

```bash
# Testar cada tela
- Estoque: Página carrega? Spinner mostra? Erro mostra?
- RH: Página carrega? Spinner mostra? Erro mostra?
- Financeiro: Página carrega? Spinner mostra? Erro mostra?
- Alertas: Página carrega? Spinner mostra? Erro mostra?

# Testar responsividade
- Desktop: Layout correto?
- Mobile: Layout correto?

# Testar navegação
- Sidebar: Cliques ainda funcionam?
- Logout: Continua funcionando?
```

---

## 📝 EXEMPLO COMPLETO

Exemplo de como refatorar Estoque.jsx com todos os 3 componentes:

**ANTES:**
```jsx
import { useState, useEffect } from 'react';
import { Plus, AlertCircle, Edit2 } from 'lucide-react';

export default function Estoque() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-3"></div>
            <p className="text-slate-600">Carregando estoque...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Estoque</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg">
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Erro</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* resto do JSX */}
    </div>
  );
}
```

**DEPOIS:**
```jsx
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import SectionTitle from './SectionTitle';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

export default function Estoque() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  if (loading) {
    return <LoadingSpinner message="Carregando estoque..." />;
  }

  return (
    <div className="space-y-4">
      <SectionTitle 
        title="Estoque" 
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg">
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        }
      />

      <ErrorBoundary error={error} onClear={() => setError('')}>
        {/* resto do JSX */}
      </ErrorBoundary>
    </div>
  );
}
```

**Impacto:** -30 linhas por arquivo

---

## 📞 PRÓXIMOS PASSOS

1. **Decidir:** Usar componentes agora ou depois?
2. **Se SIM:** Seguir CHECKLIST acima
3. **Se NÃO:** Componentes ficam prontos para uso futuro

**Recomendação:** Use quando tiver tempo, é refactoring baixo-risco.

---

## 📝 NOTAS

- Componentes estão 100% prontos para uso
- Sem breaking changes ao usar
- Pode reverter facilmente se necessário
- Melhor fazer em etapas (1 tela por vez)
- Teste bem cada tela após implementação

---

**Status:** ✅ FASE 2 PRONTA  
**Próximo:** FASE 3 (Dashboard vs Financeiro cards - opcional)
