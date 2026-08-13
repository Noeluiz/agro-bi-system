import { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import CadastroModal from './CadastroModal';
import ProductTable from './ProductTable';
import { apiFetch } from '../auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [filtroFornecedor, setFiltroFornecedor] = useState(null);

  useEffect(() => {
    carregarDados();
  }, [filtroCategoria, filtroFornecedor]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar categorias
      const catRes = await apiFetch(`${API_URL}/api/categorias`);
      if (catRes.ok) setCategorias(await catRes.json());

      // Carregar fornecedores
      const fornRes = await apiFetch(`${API_URL}/api/fornecedores`);
      if (fornRes.ok) setFornecedores(await fornRes.json());

      // Carregar produtos com filtros
      let prodUrl = `${API_URL}/api/produtos`;
      if (filtroCategoria || filtroFornecedor) {
        const params = new URLSearchParams();
        if (filtroCategoria) params.append('categoria_id', filtroCategoria);
        if (filtroFornecedor) params.append('fornecedor_id', filtroFornecedor);
        prodUrl += '?' + params.toString();
      }
      const prodRes = await apiFetch(prodUrl);
      if (prodRes.ok) setProdutos(await prodRes.json());

      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
      setLoading(false);
      console.error('Erro ao carregar dados:', err);
    }
  };

  const handleNovoProduto = (novoProduto) => {
    setProdutos(prev => [...prev, novoProduto]);
    carregarDados(); // Recarrega para garantir dados atualizados
  };

  const handleExportar = () => {
    if (produtos.length === 0) {
      alert('Nenhum produto para exportar');
      return;
    }

    const headers = ['ID', 'Nome', 'Categoria', 'Fornecedor', 'Estoque Atual', 'Estoque Mínimo', 'Preço Custo', 'Preço Venda', 'Unidade'];
    const rows = produtos.map(p => [
      p.id,
      p.nome,
      p.categoria?.nome || '',
      p.fornecedor?.nome || '',
      p.estoque_atual,
      p.estoque_minimo,
      p.preco_custo,
      p.preco_venda,
      p.unidade_medida
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estoque_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

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
      {/* Header com botões */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Estoque</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition flex-1 md:flex-none justify-center"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
          <button
            onClick={handleExportar}
            className="px-4 py-2 border border-emerald-700 text-emerald-700 rounded-lg hover:bg-emerald-50 transition flex-1 md:flex-none"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Erro</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Modal */}
      <CadastroModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        tipo="produto"
        categorias={categorias}
        fornecedores={fornecedores}
        onSuccess={handleNovoProduto}
      />

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
            <select
              value={filtroCategoria || ''}
              onChange={(e) => setFiltroCategoria(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fornecedor</label>
            <select
              value={filtroFornecedor || ''}
              onChange={(e) => setFiltroFornecedor(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm"
            >
              <option value="">Todos os fornecedores</option>
              {fornecedores.map(forn => (
                <option key={forn.id} value={forn.id}>
                  {forn.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(filtroCategoria || filtroFornecedor) && (
          <button
            onClick={() => {
              setFiltroCategoria(null);
              setFiltroFornecedor(null);
            }}
            className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Tabela de Produtos */}
      <ProductTable produtos={produtos} />

      {/* Resumo */}
      {produtos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-600 text-sm">Total de Produtos</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{produtos.length}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm">Estoque Total (R$)</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(
                  produtos.reduce((sum, p) => sum + (parseFloat(p.estoque_atual) * parseFloat(p.preco_custo)), 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-sm">Produtos em Falta</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {produtos.filter(p => parseFloat(p.estoque_atual) <= parseFloat(p.estoque_minimo)).length}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-sm">Valor de Venda (R$)</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(
                  produtos.reduce((sum, p) => sum + (parseFloat(p.estoque_atual) * parseFloat(p.preco_venda)), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
