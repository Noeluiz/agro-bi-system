import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ClipboardList, Loader, RefreshCw, AlertCircle } from 'lucide-react';
import { apiFetch } from '../auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const formatarData = (data) => data ? new Date(data).toLocaleString('pt-BR') : '-';

export default function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregarMovimentacoes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch(`${API_URL}/api/movimentacoes-estoque`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Não foi possível carregar as movimentações.');
      }
      setMovimentacoes(await response.json());
    } catch (err) {
      setError(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMovimentacoes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-800">Movimentações</h1>
          </div>
          <p className="text-slate-600 mt-2">Histórico de entradas e saídas registradas no estoque.</p>
        </div>
        <button type="button" onClick={carregarMovimentacoes} className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-stone-50 transition" title="Atualizar movimentações">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Atualizar
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-600 shrink-0" aria-hidden="true" /><p className="text-red-700 text-sm">{error}</p></div>}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-600"><Loader className="w-6 h-6 animate-spin text-emerald-700" aria-hidden="true" /><span className="ml-2">Carregando movimentações...</span></div>
        ) : movimentacoes.length === 0 ? (
          <div className="text-center py-16 px-6"><ClipboardList className="w-10 h-10 mx-auto text-slate-300" aria-hidden="true" /><h2 className="mt-3 text-lg font-semibold text-slate-800">Nenhuma movimentação registrada</h2><p className="mt-1 text-slate-500">Compras e ordens de aplicação aparecerão neste histórico.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-stone-50 border-b border-slate-200"><tr className="text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-semibold">Tipo</th><th className="px-5 py-3 font-semibold">Produto</th><th className="px-5 py-3 font-semibold">Quantidade</th><th className="px-5 py-3 font-semibold">Data</th><th className="px-5 py-3 font-semibold">Referência</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {movimentacoes.map((movimentacao, index) => {
                  const entrada = movimentacao.tipo === 'ENTRADA';
                  return <tr key={`${movimentacao.tipo}-${movimentacao.id}-${index}`} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${entrada ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{entrada ? <ArrowDownToLine className="w-3.5 h-3.5" aria-hidden="true" /> : <ArrowUpFromLine className="w-3.5 h-3.5" aria-hidden="true" />}{movimentacao.tipo}</span></td>
                    <td className="px-5 py-4 font-medium text-slate-800">{movimentacao.produto_nome}</td>
                    <td className={`px-5 py-4 font-semibold ${entrada ? 'text-emerald-700' : 'text-amber-700'}`}>{entrada ? '+' : '-'}{movimentacao.quantidade}</td>
                    <td className="px-5 py-4 text-slate-600">{formatarData(movimentacao.data)}</td>
                    <td className="px-5 py-4 text-slate-600">{movimentacao.referencia}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}