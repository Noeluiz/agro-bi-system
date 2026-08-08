import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function AlertsTable({ alertas }) {
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Alertas de Reposição</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Produto</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Tipo Alerta</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Mensagem</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map((alerta, idx) => (
              <tr key={alerta.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                <td className="px-6 py-4 text-sm text-slate-800 font-medium">{alerta.produto?.nome || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTipoBadge(alerta.tipo_alerta)}`}>
                    {alerta.tipo_alerta || 'Geral'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{alerta.mensagem}</td>
                <td className="px-6 py-4 text-sm">
                  {alerta.resolvido ? (
                    <div className="flex items-center gap-1 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Resolvido</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Pendente</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {alertas.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Nenhum alerta pendente
          </div>
        )}
      </div>
    </div>
  );
}
