import { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, ClipboardList, FileText, Loader, Plus, RefreshCw } from 'lucide-react';
import { apiFetch } from '../auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const formatarData = (data) => {
  if (!data) return '-';
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR');
};

export default function OrdensAplicacao({ onNovaOrdem }) {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregarOrdens = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch(`${API_URL}/api/ordens-aplicacao`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Não foi possível carregar as ordens.');
      }
      setOrdens(await response.json());
    } catch (err) {
      setError(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  const baixarPdf = async (ordemId) => {
    try {
      const response = await apiFetch(`${API_URL}/api/ordens-aplicacao/${ordemId}/pdf`);
      if (!response.ok) {
        throw new Error('Não foi possível gerar o PDF desta ordem.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ordem-aplicacao-${ordemId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Erro ao baixar PDF.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-800">Ordens de Aplicação</h1>
          </div>
          <p className="text-slate-600 mt-2">Planeje, registre e acompanhe as aplicações da lavoura.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={carregarOrdens}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-stone-50 transition"
            title="Atualizar ordens"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <button
            type="button"
            onClick={onNovaOrdem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            Nova Ordem
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-red-700 font-medium">Erro ao carregar ordens</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-600">
            <Loader className="w-6 h-6 animate-spin text-emerald-700" aria-hidden="true" />
            <span className="ml-2">Carregando ordens...</span>
          </div>
        ) : ordens.length === 0 ? (
          <div className="text-center py-16 px-6">
            <ClipboardList className="w-10 h-10 mx-auto text-slate-300" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold text-slate-800">Nenhuma ordem cadastrada</h2>
            <p className="mt-1 text-slate-500">Crie a primeira ordem para iniciar o acompanhamento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-stone-50 border-b border-slate-200">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-5 py-3 font-semibold">Fazenda</th>
                  <th className="px-5 py-3 font-semibold">Cultura</th>
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-5 py-3 font-semibold">Máquina</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordens.map((ordem) => (
                  <tr key={ordem.id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-4 font-semibold text-emerald-800">#{ordem.id}</td>
                    <td className="px-5 py-4 text-slate-800">{ordem.fazenda}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{ordem.cultura}</p>
                      <p className="text-xs text-slate-500">{ordem.variedade}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" aria-hidden="true" />
                        {formatarData(ordem.data_recomendacao)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{ordem.tipo_maquina}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        Criada
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => baixarPdf(ordem.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-emerald-700 text-emerald-800 rounded-lg hover:bg-emerald-50 transition"
                        title={`Baixar PDF da ordem ${ordem.id}`}
                      >
                        <FileText className="w-4 h-4" aria-hidden="true" />
                        Baixar PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}