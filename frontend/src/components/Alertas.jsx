import { useState, useEffect } from 'react';
import { Plus, AlertCircle, CheckCircle, AlertTriangle, Trash2, Download } from 'lucide-react';
import CadastroModal from './CadastroModal';
import { apiFetch } from '../auth';
import { exportarRelatorioCsv } from '../utils/csvExport';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [deletando, setDeletando] = useState(null);

  useEffect(() => {
    carregarDados();
  }, [filtroStatus]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar produtos (para o modal)
      const prodRes = await apiFetch(`${API_URL}/api/produtos`);
      if (prodRes.ok) {
        setProdutos(await prodRes.json());
      }

      // Carregar alertas
      let url = `${API_URL}/api/alertas-estoque`;
      if (filtroStatus === 'pendente') {
        url += '?resolvido=false';
      } else if (filtroStatus === 'resolvido') {
        url += '?resolvido=true';
      }

      const alertasRes = await apiFetch(url);
      if (alertasRes.ok) {
        const data = await alertasRes.json();
        setAlertas(data);
      }

      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
      setLoading(false);
      console.error('Erro ao carregar dados:', err);
    }
  };

  // TRAVA #1 CORRIGIDA: Validar se há produtos antes de abrir modal
  const handleAbrirModalAlerta = () => {
    if (produtos.length === 0) {
      setError('⚠️ Nenhum produto disponível. Crie um produto primeiro antes de adicionar alertas.');
      return;
    }
    setModalAberto(true);
  };

  const handleNovoAlerta = (novoAlerta) => {
    setAlertas(prev => [novoAlerta, ...prev]);
    carregarDados();
  };

  const handleResolverAlerta = async (id) => {
    try {
      const response = await apiFetch(`${API_URL}/api/alertas-estoque/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ resolvido: true }),
      });

      if (!response.ok) {
        throw new Error('Erro ao resolver alerta');
      }

      setAlertas(prev =>
        prev.map(a =>
          a.id === id ? { ...a, resolvido: true } : a
        )
      );
    } catch (err) {
      setError('Erro ao resolver: ' + err.message);
      console.error('Erro ao resolver alerta:', err);
    }
  };

  const handleExportar = () => {
    if (alertas.length === 0) {
      setError('Nenhum alerta para exportar');
      return;
    }

    try {
      const headers = ['Produto', 'Tipo', 'Mensagem', 'Status'];
      const rows = alertas.map(a => [
        a.produto?.nome || 'N/A',
        a.tipo_alerta || 'Geral',
        a.mensagem,
        a.resolvido ? 'Resolvido' : 'Pendente'
      ]);

      exportarRelatorioCsv({
        nomeArquivo: `alertas_${new Date().toISOString().slice(0, 10)}.csv`,
        titulo: 'Relatório de Alertas de Estoque',
        cabecalhos: headers,
        linhas: rows,
      });
    } catch (err) {
      setError('Erro ao exportar: ' + err.message);
      console.error('Erro ao exportar:', err);
    }
  };

  const handleDeletarAlerta = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este alerta?')) {
      return;
    }

    setDeletando(id);
    try {
      const response = await apiFetch(`${API_URL}/api/alertas-estoque/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar alerta');
      }

      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError('Erro ao deletar: ' + err.message);
      console.error('Erro ao deletar alerta:', err);
    } finally {
      setDeletando(null);
    }
  };

  const getTipoBadge = (tipo) => {
    const tipos = {
      'Crítico': 'bg-red-100 text-red-700 border border-red-200',
      'Baixo Estoque': 'bg-amber-100 text-amber-700 border border-amber-200',
      'Aviso': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      'Manutenção': 'bg-blue-100 text-blue-700 border border-blue-200',
      'Reposição': 'bg-orange-100 text-orange-700 border border-orange-200'
    };
    return tipos[tipo] || 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  const filtrarAlertas = () => {
    if (filtroStatus === 'pendente') {
      return alertas.filter(a => !a.resolvido);
    } else if (filtroStatus === 'resolvido') {
      return alertas.filter(a => a.resolvido);
    }
    return alertas;
  };

  const alertasFiltrados = filtrarAlertas();

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-3"></div>
            <p className="text-slate-600">Carregando alertas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Alertas de Estoque</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleAbrirModalAlerta}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition flex-1 md:flex-none justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={produtos.length === 0}
            title={produtos.length === 0 ? 'Crie um produto primeiro' : 'Adicionar novo alerta'}
          >
            <Plus className="w-5 h-5" />
            Novo Alerta
          </button>
          <button
            onClick={handleExportar}
            className="px-4 py-2 border border-emerald-700 text-emerald-700 rounded-lg hover:bg-emerald-50 transition flex-1 md:flex-none flex items-center gap-2 justify-center"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Aviso</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Modal */}
      <CadastroModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        tipo="alerta"
        produtos={produtos}
        onSuccess={handleNovoAlerta}
      />

      {/* Filtro de Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtroStatus === 'todos'
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
            }`}
          >
            Todos ({alertas.length})
          </button>
          <button
            onClick={() => setFiltroStatus('pendente')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtroStatus === 'pendente'
                ? 'bg-red-700 text-white'
                : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
            }`}
          >
            Pendentes ({alertas.filter(a => !a.resolvido).length})
          </button>
          <button
            onClick={() => setFiltroStatus('resolvido')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtroStatus === 'resolvido'
                ? 'bg-green-700 text-white'
                : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
            }`}
          >
            Resolvidos ({alertas.filter(a => a.resolvido).length})
          </button>
        </div>
      </div>

      {/* Tabela de Alertas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Produto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Mensagem</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {alertasFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    {filtroStatus === 'pendente'
                      ? 'Nenhum alerta pendente'
                      : filtroStatus === 'resolvido'
                      ? 'Nenhum alerta resolvido'
                      : 'Nenhum alerta'}
                  </td>
                </tr>
              ) : (
                alertasFiltrados.map((alerta, idx) => (
                  <tr key={alerta.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {alerta.produto?.nome || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTipoBadge(alerta.tipo_alerta)}`}>
                        {alerta.tipo_alerta || 'Geral'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {alerta.mensagem}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {alerta.resolvido ? (
                        <div className="flex items-center gap-1 text-green-700 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          <span>Resolvido</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-700 font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Pendente</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      {!alerta.resolvido && (
                        <button
                          onClick={() => handleResolverAlerta(alerta.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-xs font-medium"
                          title="Marcar como resolvido"
                        >
                          Resolver
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletarAlerta(alerta.id)}
                        disabled={deletando === alerta.id}
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
        {alertas.length > 0 && (
          <div className="px-6 py-3 bg-stone-50 border-t border-slate-200 text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-800">{alertas.length}</span> alerta(s)
            | Pendentes: <span className="font-semibold text-red-700">{alertas.filter(a => !a.resolvido).length}</span>
            | Resolvidos: <span className="font-semibold text-green-700">{alertas.filter(a => a.resolvido).length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
