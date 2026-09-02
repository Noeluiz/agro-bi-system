import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, Search } from 'lucide-react';
import { apiFetch } from '../auth';
import { exportarRelatorioCsv, formatarDataBR } from '../utils/csvExport';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const formatarAcao = (acao) => {
  const mapa = {
    login: 'Login',
    logout: 'Logout',
    tentativa_falha: 'Tentativa Falha',
  };

  return mapa[acao] || acao || 'Desconhecida';
};

export default function LogsAcesso() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [termoBusca, setTermoBusca] = useState('');

  useEffect(() => {
    carregarLogs();
  }, []);

  const carregarLogs = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiFetch(`${API_URL}/api/logs-acesso`);
      if (!response.ok) {
        throw new Error('Erro ao carregar logs de acesso');
      }

      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar logs de acesso');
      console.error('Erro ao carregar logs de acesso:', err);
    } finally {
      setLoading(false);
    }
  };

  const logsFiltrados = useMemo(() => {
    const busca = termoBusca.trim().toLowerCase();
    if (!busca) return logs;

    return logs.filter((log) => {
      const email = String(log.email_usuario || '').toLowerCase();
      return email.includes(busca);
    });
  }, [logs, termoBusca]);

  const handleExportarCsv = () => {
    if (logsFiltrados.length === 0) {
      setError('Nenhum registro para exportar');
      return;
    }

    try {
      const cabecalhos = ['Data/Hora', 'E-mail do usuário', 'Ação', 'IP de origem'];
      const linhas = logsFiltrados.map((log) => [
        formatarDataBR(log.data_hora, true),
        log.email_usuario || '',
        formatarAcao(log.acao),
        log.ip_origem || '',
      ]);

      exportarRelatorioCsv({
        nomeArquivo: `logs-acesso_${new Date().toISOString().slice(0, 10)}.csv`,
        cabecalhos,
        linhas,
      });
    } catch (err) {
      setError('Erro ao exportar CSV: ' + (err.message || 'desconhecido'));
      console.error('Erro ao exportar CSV:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-3" />
            <p className="text-slate-600">Carregando logs de acesso...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-emerald-800">Logs de Acesso</h2>
          <p className="text-sm text-slate-600">Monitoramento de login, logout e tentativas falhas.</p>
        </div>

        <button
          type="button"
          onClick={handleExportarCsv}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-emerald-700 text-emerald-700 hover:bg-emerald-50 transition"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 max-w-md">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Filtrar por e-mail"
            className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Data/Hora</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">E-mail do usuário</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Ação</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">IP de origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{formatarDataBR(log.data_hora, true)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{log.email_usuario || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        log.acao === 'login'
                          ? 'bg-emerald-100 text-emerald-700'
                          : log.acao === 'logout'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {formatarAcao(log.acao)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{log.ip_origem || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
