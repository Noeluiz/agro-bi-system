# 💡 EXEMPLOS DE USO - AGRO-BI COMPONENTS

## 🎯 Exemplos Práticos e Prontos para Copiar

---

## 1️⃣ Usar CadastroModal em uma Tela Customizada

### Exemplo 1: Modal para Adicionar Categorias
```jsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import CadastroModal from './components/CadastroModal';

export default function GerenciadorCategorias() {
  const [modalAberto, setModalAberto] = useState(false);
  const [categorias, setCategorias] = useState([]);

  const handleNovaCat = (novaCat) => {
    setCategorias([...categorias, novaCat]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-emerald-800 mb-4">Categorias</h1>
      
      <button
        onClick={() => setModalAberto(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
      >
        <Plus className="w-5 h-5" />
        Nova Categoria
      </button>

      <CadastroModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        tipo="categoria"
        onSuccess={handleNovaCat}
      />

      <div className="mt-4 grid gap-2">
        {categorias.map(cat => (
          <div key={cat.id} className="p-3 bg-white border rounded-lg">
            {cat.nome}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Exemplo 2: Modal para Adicionar Produtos com Categorias
```jsx
const [modalAberto, setModalAberto] = useState(false);
const [categorias, setCategorias] = useState([
  { id: 1, nome: 'Sementes' },
  { id: 2, nome: 'Defensivos' },
  { id: 3, nome: 'Adubos' },
]);
const [fornecedores, setFornecedores] = useState([
  { id: 1, nome: 'Bayer' },
  { id: 2, nome: 'Syngenta' },
]);

return (
  <CadastroModal
    isOpen={modalAberto}
    onClose={() => setModalAberto(false)}
    tipo="produto"
    categorias={categorias}
    fornecedores={fornecedores}
    onSuccess={(novo) => console.log('Novo produto:', novo)}
  />
);
```

---

## 2️⃣ Usar RH em uma Página Admin

### Exemplo 1: Tela Admin com Abas
```jsx
import { useState } from 'react';
import RH from './components/RH';
import Financeiro from './components/Financeiro';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('rh');

  return (
    <div className="p-6">
      {/* Navigation */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('rh')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'rh'
              ? 'text-emerald-700 border-b-2 border-emerald-700'
              : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          Recursos Humanos
        </button>
        <button
          onClick={() => setActiveTab('financeiro')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'financeiro'
              ? 'text-emerald-700 border-b-2 border-emerald-700'
              : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          Financeiro
        </button>
      </div>

      {/* Content */}
      {activeTab === 'rh' && <RH />}
      {activeTab === 'financeiro' && <Financeiro />}
    </div>
  );
}
```

---

## 3️⃣ Usar Financeiro com Filtros Avançados

### Exemplo 1: Dashboard Financeiro Customizado
```jsx
import { useState } from 'react';
import Financeiro from './components/Financeiro';

export default function FinanceiroDashboard() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
            <option key={m} value={m}>
              {new Date(2024, m - 1).toLocaleString('pt-BR', { month: 'long' })}
            </option>
          ))}
        </select>

        <select
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      {/* Component */}
      <Financeiro key={`${ano}-${mes}`} />
    </div>
  );
}
```

---

## 4️⃣ Criar Tela Customizada com Modal

### Exemplo: Tela de Fornecedores
```jsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import CadastroModal from './components/CadastroModal';
import { apiFetch } from '../auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/api/fornecedores`);
      if (res.ok) {
        setFornecedores(await res.json());
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletar = async (id) => {
    if (!confirm('Deseja deletar?')) return;
    
    try {
      await apiFetch(`${API_URL}/api/fornecedores/${id}`, {
        method: 'DELETE',
      });
      setFornecedores(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-emerald-800">Fornecedores</h2>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Adicionar
        </button>
      </div>

      <CadastroModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        tipo="fornecedor"
        onSuccess={() => carregarFornecedores()}
      />

      {/* Tabela */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">CNPJ</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores.map(forn => (
              <tr key={forn.id} className="border-t">
                <td className="px-4 py-2">{forn.nome}</td>
                <td className="px-4 py-2">{forn.cnpj || '-'}</td>
                <td className="px-4 py-2">{forn.email || '-'}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleDeletar(forn.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fornecedores.length === 0 && !loading && (
        <p className="text-slate-500 text-center py-8">Nenhum fornecedor</p>
      )}
    </div>
  );
}
```

---

## 5️⃣ Validação Customizada no Modal

### Exemplo: Campo com Regra Específica
```jsx
// Dentro do componente que usa CadastroModal

const [validationError, setValidationError] = useState('');

const handleSalvar = async (dados) => {
  // Validação customizada
  if (dados.salario_base < 1320) { // Salário mínimo
    setValidationError('Salário não pode ser menor que salário mínimo');
    return;
  }

  // ... resto do código
};
```

---

## 6️⃣ Integração com LocalStorage

### Exemplo: Salvar Filtros
```jsx
import { useState, useEffect } from 'react';

export default function FinanceiroComFiltrosPreservados() {
  const [filtroTipo, setFiltroTipo] = useState(() => {
    return localStorage.getItem('filtro_tipo') || 'todos';
  });

  useEffect(() => {
    localStorage.setItem('filtro_tipo', filtroTipo);
  }, [filtroTipo]);

  return (
    <select
      value={filtroTipo}
      onChange={(e) => setFiltroTipo(e.target.value)}
    >
      <option value="todos">Todos</option>
      <option value="Receita">Receitas</option>
      <option value="Despesa">Despesas</option>
    </select>
  );
}
```

---

## 7️⃣ Tratamento de Erro Global

### Exemplo: Context para Erros
```jsx
import { createContext, useState } from 'react';

export const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [error, setError] = useState('');

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  };

  return (
    <ErrorContext.Provider value={{ error, showError }}>
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {children}
    </ErrorContext.Provider>
  );
}
```

---

## 8️⃣ Teste Automatizado com Mock

### Exemplo: Teste com fetch mock
```jsx
// test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import RH from './components/RH';

// Mock da API
global.fetch = jest.fn();

describe('RH Component', () => {
  it('deve exibir lista de funcionários', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, nome: 'João', cargo: 'Tratorista', ativo: true }
      ]
    });

    render(<RH />);
    
    const nome = await screen.findByText('João');
    expect(nome).toBeInTheDocument();
  });
});
```

---

## 9️⃣ Aplicar Tema Customizado

### Exemplo: Tema Escuro
```jsx
export default function App() {
  const [tema, setTema] = useState('claro');

  return (
    <div className={tema === 'escuro' ? 'dark' : ''}>
      {/* Conteúdo */}
      <style>{`
        .dark {
          --bg-primary: #1a1a1a;
          --text-primary: #ffffff;
        }
      `}</style>
    </div>
  );
}
```

---

## 🔟 Componente Wrapper com Proteção

### Exemplo: ProtectedRoute
```jsx
import { getRole } from '../auth';

export function ProtectedRoute({ children, requiredRole = 'ADMIN' }) {
  const role = getRole();

  if (role !== requiredRole) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Acesso negado para esta seção</p>
      </div>
    );
  }

  return children;
}

// Uso
<ProtectedRoute requiredRole="ADMIN">
  <RH />
</ProtectedRoute>
```

---

## 📋 SNIPPETS DE CÓDIGO

### Snippet 1: Formatar Moeda
```javascript
const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);
};

console.log(formatarMoeda(1500.50)); // R$ 1.500,50
```

### Snippet 2: Formatar Data
```javascript
const formatarData = (dataStr) => {
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR');
};

console.log(formatarData('2024-01-15')); // 15/01/2024
```

### Snippet 3: Validar Email
```javascript
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

console.log(validarEmail('user@example.com')); // true
```

### Snippet 4: Pedir Confirmação
```javascript
const pedirConfirmacao = async (mensagem) => {
  return window.confirm(mensagem);
};

if (await pedirConfirmacao('Deseja deletar?')) {
  // deletar
}
```

---

## 🚀 CASOS DE USO REAIS

### Caso 1: Dashboard Executivo
```jsx
// Mostrar resumos e gráficos para CEO/Gerente Geral
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>Total de Funcionários: {funcionarios.length}</div>
  <div>Receita Este Mês: R$ {totalReceita}</div>
  <div>Despesa Este Mês: R$ {totalDespesa}</div>
</div>
```

### Caso 2: Importação em Massa
```jsx
// Permitir upload de arquivo para criar múltiplos registros
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  // Parse CSV
  // POST /api/funcionarios (múltiplo)
};
```

### Caso 3: Sincronização com Planilha
```jsx
// Integrar com Google Sheets API
const exportarParaSheetsAPI = async () => {
  // Enviar dados para Sheet
};
```

---

## 💬 DÚVIDAS FREQUENTES RESPONDIDAS

### P: "Como adicionar mais campos ao modal?"
R: Edite `CadastroModal.jsx` e adicione no `switch(tipo)` correspondente.

### P: "Como fazer o modal abrir com dados pré-preenchidos?"
R: Passe `initialData` prop e use `useEffect` para preencher.

### P: "Como integrar com um calendar?"
R: Use biblioteca como `react-calendar` ou `date-fns`.

### P: "Como fazer upload de arquivo?"
R: Use `<input type="file" />` e FormData com `fetch`.

### P: "Como adicionar soft delete?"
R: Adicione coluna `deletado_em` ao invés de deletar realmente.

---

**Todos os exemplos acima estão prontos para usar. Copie e cole no seu código!**
