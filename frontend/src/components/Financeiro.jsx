import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import CadastroModal from './CadastroModal';
import { apiFetch } from '../auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [deletando, setDeletando] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    carregarLancamentos();
  }, [filtroTipo, dataInicio, dataFim]);

  const carregarLancamentos = async () => {
    try {
      setLoading(true);
      setError('');

      let url = `${API_URL}/api/fluxo-caixa`;
      const params = new URLSearchParams();

      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await apiFetch(url);

      if (!response.ok) {
        throw new Error('Erro ao carregar lançamentos');
      }

      let data = await response.json();

      // Filtrar por tipo se necessário
      if (filtroTipo !== 'todos') {
        data = data.filter(l => l.tipo === filtroTipo);
      }

      // Ordenar por data decrescente
      data.sort((a, b) => new Date(b.data) - new Date(a.data));

      setLancamentos(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar lançamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarLancamento = (novoLancamento) => {
    setLancamentos(prev => [novoLancamento, ...prev]);
    carregarLancamentos();
  };

  const handleDeletar = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este lançamento?')) {
      return;
    }

    setDeletando(id);
    try {
      const response = await apiFetch(`${API_URL}/api/fluxo-caixa/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar lançamento');
      }

      setLancamentos(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      setError('Erro ao deletar: ' + err.message);
      console.error('Erro ao deletar lançamento:', err);
    } finally {
      setDeletando(null);
    }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);
  };

  const calcularSaldos = () => {
    const receitas = lancamentos
      .filter(l => l.tipo === 'Receita')
      .reduce((sum, l) => sum + parseFloat(l.valor || 0), 0);

    const despesas = lancamentos
      .filter(l => l.tipo === 'Despesa')
      .reduce((sum, l) => sum + parseFloat(l.valor || 0), 0);

    return { receitas, despesas, saldo: receitas - despesas };
  };

  const { receitas, despesas, saldo } = calcularSaldos();

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-3"></div>
            <p className="text-slate-600">Carregando lançamentos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão de adicionar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-emerald-800">Financeiro</h2>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition"
        >
          <Plus className="w-5 h-5" />
          Adicionar Lançamento
        </button>
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
        tipo="fluxo"
        onSuccess={handleAdicionarLancamento}
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Receitas</p>
              <p className="text-2xl font-bold text-green-700 mt-2">{formatarValor(receitas)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-700" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Despesas</p>
              <p className="text-2xl font-bold text-red-700 mt-2">{formatarValor(despesas)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-700" />
          </div>
        </div>

        <div className={`rounded-xl border shadow-sm p-6 ${
          saldo >= 0
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Saldo
              </p>
              <p className={`text-2xl font-bold mt-2 ${saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatarValor(saldo)}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              saldo >= 0 ? 'bg-green-200' : 'bg-red-200'
            }`}>
              {saldo >= 0 ? '✓' : '!'}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Lançamento</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="Receita">Receitas</option>
              <option value="Despesa">Despesas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm"
            />
          </div>
        </div>

        {(dataInicio || dataFim || filtroTipo !== 'todos') && (
          <button
            onClick={() => {
              setFiltroTipo('todos');
              setDataInicio('');
              setDataFim('');
            }}
            className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Data</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Categoria</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Valor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Descrição</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                    Nenhum lançamento encontrado
                  </td>
                </tr>
              ) : (
                lancamentos.map((lanc, idx) => (
                  <tr key={lanc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatarData(lanc.data)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          lanc.tipo === 'Receita'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {lanc.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                      {lanc.categoria_financeira}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      <span
                        className={lanc.tipo === 'Receita' ? 'text-green-700' : 'text-red-700'}
                      >
                        {lanc.tipo === 'Receita' ? '+' : '-'} {formatarValor(lanc.valor)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {lanc.descricao || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeletar(lanc.id)}
                        disabled={deletando === lanc.id}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer com resumo */}
        {lancamentos.length > 0 && (
          <div className="px-6 py-3 bg-stone-50 border-t border-slate-200 text-sm text-slate-600">
            Total de lançamentos: <span className="font-semibold text-slate-800">{lancamentos.length}</span>
            | Receitas: <span className="font-semibold text-green-700">{lancamentos.filter(l => l.tipo === 'Receita').length}</span>
            | Despesas: <span className="font-semibold text-red-700">{lancamentos.filter(l => l.tipo === 'Despesa').length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
