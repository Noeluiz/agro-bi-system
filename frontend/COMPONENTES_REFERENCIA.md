# 🚀 Referência Rápida - Componentes Agro-BI

## 📁 Estrutura de Componentes

```
frontend/src/
├── components/
│   ├── CadastroModal.jsx          ← NOVO - Modal reutilizável
│   ├── RH.jsx                     ← NOVO - Tela de Recursos Humanos
│   ├── Financeiro.jsx             ← NOVO - Tela de Financeiro
│   ├── Sidebar.jsx                ✅ Já tinha role check
│   ├── Login.jsx                  ✅ Sem mudanças
│   ├── ProductTable.jsx           ✅ Sem mudanças
│   ├── MetricCard.jsx             ✅ Sem mudanças
│   └── AlertsTable.jsx            ✅ Sem mudanças
├── App.jsx                        ✅ ATUALIZADO - Importa RH e Financeiro
├── auth.js                        ✅ Sem mudanças
├── main.jsx
├── index.css
└── types/
```

---

## 🧩 CadastroModal.jsx

### Props:
```jsx
<CadastroModal
  isOpen={boolean}                    // Controla visibilidade
  onClose={() => {}}                  // Callback ao fechar
  tipo="produto"                      // 'produto' | 'categoria' | 'fornecedor' | 'fluxo' | 'funcionario'
  categorias={array}                  // Para dropdown em produto
  fornecedores={array}                // Para dropdown em produto
  onSuccess={(dados) => {}}           // Callback após sucesso
  loading={boolean}                   // Estado de carregamento (opcional)
/>
```

### Tipos de Formulário:

#### `tipo="produto"`
- Nome (obrigatório)
- Categoria (select, obrigatório)
- Fornecedor (select, obrigatório)
- Unidade de Medida (select)
- Estoque Atual (number)
- Estoque Mínimo (number)
- Preço Custo (number)
- Preço Venda (number)

#### `tipo="categoria"`
- Nome (obrigatório)

#### `tipo="fornecedor"`
- Nome (obrigatório)
- CNPJ (text)
- Email (email)
- Telefone (tel)

#### `tipo="fluxo"`
- Tipo (select: Receita/Despesa, obrigatório)
- Valor (number, > 0, obrigatório)
- Categoria Financeira (text, obrigatório)
- Data (date)
- Descrição (textarea)

#### `tipo="funcionario"`
- Nome (obrigatório)
- CPF (text)
- Cargo (obrigatório)
- Salário Base (number)
- Data de Admissão (date)

### Exemplo de Uso:

```jsx
import { useState } from 'react';
import CadastroModal from './components/CadastroModal';

export default function MinhaTelaAdmin() {
  const [modalAberto, setModalAberto] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);

  const handleSalvar = (novoFuncionario) => {
    setFuncionarios([...funcionarios, novoFuncionario]);
    setModalAberto(false);
  };

  return (
    <div>
      <button onClick={() => setModalAberto(true)}>
        Adicionar Funcionário
      </button>

      <CadastroModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        tipo="funcionario"
        onSuccess={handleSalvar}
      />
    </div>
  );
}
```

---

## 👥 RH.jsx

Tela completa de Recursos Humanos. **ADMIN ONLY**.

### Funcionalidades:
- ✅ Lista de funcionários com paginação
- ✅ Botão "Adicionar Funcionário" que abre modal
- ✅ Deletar funcionários
- ✅ Formatação de datas e salários
- ✅ Resumo de ativos/inativos
- ✅ Tratamento de erros

### Props: Nenhuma

### Exemplo:
```jsx
import RH from './components/RH';

<RH />
```

### Dados Exibidos:
```
[
  {
    "id": 1,
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "cargo": "Tratorista",
    "salario_base": 2500.00,
    "data_admissao": "2024-01-15",
    "ativo": true
  }
]
```

---

## 💰 Financeiro.jsx

Dashboard financeiro. **ADMIN ONLY**.

### Funcionalidades:
- ✅ Cards de Receitas, Despesas e Saldo
- ✅ Filtros por tipo, data início, data fim
- ✅ Lista de lançamentos com cores (verde receita, vermelho despesa)
- ✅ Deletar lançamentos
- ✅ Cálculo automático de saldos
- ✅ Resumo de totais

### Props: Nenhuma

### Exemplo:
```jsx
import Financeiro from './components/Financeiro';

<Financeiro />
```

### Dados Exibidos:
```
[
  {
    "id": 1,
    "tipo": "Receita",
    "valor": 1500.00,
    "categoria_financeira": "Venda de Grãos",
    "data": "2024-01-10",
    "descricao": "Venda de soja para cooperativa"
  },
  {
    "id": 2,
    "tipo": "Despesa",
    "valor": 500.00,
    "categoria_financeira": "Combustível",
    "data": "2024-01-09",
    "descricao": "Combustível para trator"
  }
]
```

---

## 🔐 Controle de Acesso

### Verificações Implementadas:

#### 1. **Sidebar** - Esconde abas
```jsx
const isAdmin = role === 'ADMIN';

const navItems = [
  { id: 'estoque', label: 'Estoque', show: true },
  { id: 'financeiro', label: 'Financeiro', show: isAdmin },
  { id: 'rh', label: 'Recursos Humanos', show: isAdmin },
];
```

#### 2. **App.jsx** - Bloqueia acesso
```jsx
case 'rh':
  return isAdmin ? (
    <RH />
  ) : (
    <div>Acesso negado para GERENTEs</div>
  );
```

#### 3. **Backend** - Proteção final
```
POST /api/funcionarios → Requer ADMIN
DELETE /api/funcionarios/{id} → Requer ADMIN
POST /api/fluxo-caixa → Requer ADMIN
DELETE /api/fluxo-caixa/{id} → Requer ADMIN
```

### Como Verificar Role:
```jsx
import { getRole, isAdmin } from '../auth';

const role = getRole();          // 'ADMIN' ou 'GERENTE'
const isAdminUser = isAdmin();   // true ou false
```

---

## 📡 Requisições à API

### Headers Automáticos (apiFetch):
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <JWT_TOKEN>',
  'credentials': 'include' // Envia HttpOnly cookies
}
```

### Exemplo de POST:
```jsx
const response = await apiFetch('https://api.com/api/funcionarios', {
  method: 'POST',
  body: JSON.stringify({
    nome: 'João Silva',
    cpf: '123.456.789-00',
    cargo: 'Tratorista',
    salario_base: 2500,
    data_admissao: '2024-01-15'
  })
});

if (!response.ok) {
  const error = await response.json();
  console.error('Erro:', error.detail);
} else {
  const novoFuncionario = await response.json();
  console.log('Sucesso:', novoFuncionario);
}
```

---

## 🎨 Tailwind CSS Classes Usadas

### Cores:
- `bg-emerald-700` - Verde escuro (destaque)
- `bg-emerald-800` - Verde escuro hover
- `bg-green-100` / `text-green-700` - Verde claro (receitas)
- `bg-red-100` / `text-red-700` - Vermelho claro (despesas)
- `bg-stone-50` - Fundo cinza claro
- `border-slate-200` - Borda cinza

### Layout:
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` - Grid responsivo
- `flex items-center justify-between` - Flexbox centrado
- `rounded-lg` / `rounded-xl` - Bordas arredondadas
- `shadow-sm` - Sombra leve

### Estados:
- `hover:bg-stone-100` - Hover background
- `focus:ring-2 focus:ring-emerald-700` - Focus ring
- `disabled:opacity-50` - Disabled state

---

## 🧪 Testes Rápidos

### Teste 1: Adicionar Funcionário
```bash
1. npm run dev
2. Login com credenciais ADMIN
3. Clique em "Recursos Humanos"
4. Clique "Adicionar Funcionário"
5. Preencha o formulário
6. Clique "Salvar"
7. ✓ Deve aparecer na lista
```

### Teste 2: Criar Lançamento
```bash
1. Clique em "Financeiro"
2. Clique "Adicionar Lançamento"
3. Selecione "Receita"
4. Coloque valor 1000
5. Categoria: "Venda de Grãos"
6. Clique "Salvar"
7. ✓ Card de "Receitas" deve atualizar
```

### Teste 3: Segurança GERENTE
```bash
1. Logout
2. Login como GERENTE
3. ✓ Abas de RH e Financeiro não aparecem
4. Tente acessar /rh no navegador
5. ✓ Mostra "Acesso negado"
```

---

## 🐛 Troubleshooting

### Erro: "Acesso negado"
- Verifique se você está logado como ADMIN
- Verifique token JWT em localStorage
- Recarregue a página

### Erro: "Categoria é obrigatória"
- No modal de Produto, selecione uma categoria antes de salvar
- Se não houver categorias, crie uma pela sidebar

### Erro: "Conexão recusada" (API)
- Verifique URL do backend em `.env`
- Certifique-se que o servidor está rodando
- Verifique CORS no backend

### Modal não abre
- Verifique se `isOpen={true}`
- Verifique console do navegador (F12)
- Garanta que CadastroModal está importado

### Dados não atualizam
- Clique botão "Atualizar" no header
- Recarregue a página
- Verifique se a API retornou sucesso (HTTP 200/201)

---

## 📚 Documentação Relacionada

- `INTEGRACAO_FRONTEND.md` - Guia completo
- `App.jsx` - Configuração de rotas
- `auth.js` - Gestão de autenticação
- `CadastroModal.jsx` - Código-fonte do modal
- `RH.jsx` - Código-fonte da tela RH
- `Financeiro.jsx` - Código-fonte da tela Financeiro

---

## ✅ Checklist de Implantação

- [ ] Verificar `.env` com URL do backend
- [ ] Testar login como ADMIN
- [ ] Testar login como GERENTE
- [ ] Criar um funcionário
- [ ] Criar um lançamento de caixa
- [ ] Deletar registros
- [ ] Verificar filtros
- [ ] Testar em mobile
- [ ] Deploy no Vercel/Netlify
- [ ] Monitorar logs de erro

---

**Suas dúvidas? Consulte os comentários no código ou a documentação acima! 🎯**
