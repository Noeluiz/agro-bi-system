import { useState, useEffect } from 'react';
import { Plus, AlertCircle, Edit2, Trash2 } from 'lucide-react';
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
  const [modalEditandoAberto, setModalEditandoAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [novoEstoque, setNovoEstoque] = useState('');
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
  };

  const handleCategoriesUpdated = (novasCategorias) => {
    setCategorias(novasCategorias);
  };

  const handleFornecedoresUpdated = (novosFornecedores) => {
    setFornecedores(novosFornecedores);
  };

  // TRAVA #4 CORRIGIDA: Permitir atualização de estoque sem deletar produto
  const handleEditarEstoque = (produto) => {
    setProdutoEditando(produto);
    setNovoEstoque(produto.estoque_atual.toString());
    setModalEditandoAberto(true);
  };

  const handleSalvarEstoque = async () => {
    if (!produtoEditando || novoEstoque === '') {
      setError('Preencha o novo estoque');
      return;
    }

    try {
      const novoValor = parseFloat(novoEstoque);
      if (novoValor < 0) {
        setError('Estoque não pode ser negativo');
        return;
      }

      // Usar PATCH para atualizar apenas o estoque
      const response = await apiFetch(`${API_URL}/api/produtos/${produtoEditando.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estoque_atual: novoValor }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao atualizar estoque');
      }

      // Atualizar lista localmente
      setProdutos(prev =>
        prev.map(p =>
          p.id === produtoEditando.id
            ? { ...p, estoque_atual: novoValor }
            : p
        )
      );

      setModalEditandoAberto(false);
      setProdutoEditando(null);
      setNovoEstoque('');
    } catch (err) {
      setError('Erro ao atualizar: ' + err.message);
      console.error('Erro:', err);
    }
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

      {/* Modal de novo produto */}
      <CadastroModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        tipo="produto"
        categorias={categorias}
        fornecedores={fornecedores}
        onSuccess={handleNovoProduto}
        onCategoriesUpdated={handleCategoriesUpdated}
        onFornecedoresUpdated={handleFornecedoresUpdated}
      />

      {/* Modal de editar estoque - TRAVA #4 */}
      {modalEditandoAberto && produtoEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-emerald-800">Atualizar Estoque</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600">Produto</p>
                <p className="text-lg font-semibold text-slate-800">{produtoEditando.nome}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estoque Atual
                </label>
                <input
                  type="number"
                  value={novoEstoque}
                  onChange={(e) => setNovoEstoque(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  placeholder="Ex: 100"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setModalEditandoAberto(false);
                    setProdutoEditando(null);
                    setNovoEstoque('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarEstoque}
                  className="flex-1 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition font-medium"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Tabela de Produtos com botão de editar estoque */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Nome</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Categoria</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Fornecedor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Estoque</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Preço Custo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Preço Venda</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                produtos.map((produto, idx) => (
                  <tr key={produto.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{produto.nome}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{produto.categoria?.nome || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{produto.fornecedor?.nome || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-800">{parseFloat(produto.estoque_atual).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-sm text-slate-800">R$ {parseFloat(produto.preco_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-sm text-slate-800">R$ {parseFloat(produto.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => handleEditarEstoque(produto)}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                        title="Atualizar estoque"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer com resumo */}
        {produtos.length > 0 && (
          <div className="px-6 py-3 bg-stone-50 border-t border-slate-200 text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-800">{produtos.length}</span> produto(s)
            | Em falta: <span className="font-semibold text-red-700">
              {produtos.filter(p => parseFloat(p.estoque_atual) <= parseFloat(p.estoque_minimo)).length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
