import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ProductTable({ produtos }) {
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' });

  const sortedProdutos = [...produtos].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (typeof aVal === 'string') {
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const SortIcon = ({ field }) => {
    if (sortConfig.key !== field) return <div className="w-4 h-4" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Listagem de Produtos</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-slate-200">
            <tr>
              <th
                onClick={() => handleSort('nome')}
                className="px-6 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-stone-100 transition"
              >
                <div className="flex items-center gap-2">Nome <SortIcon field="nome" /></div>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Categoria</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Fornecedor</th>
              <th
                onClick={() => handleSort('estoque_atual')}
                className="px-6 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-stone-100 transition"
              >
                <div className="flex items-center gap-2">Estoque <SortIcon field="estoque_atual" /></div>
              </th>
              <th
                onClick={() => handleSort('preco_custo')}
                className="px-6 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-stone-100 transition"
              >
                <div className="flex items-center gap-2">P. Custo <SortIcon field="preco_custo" /></div>
              </th>
              <th
                onClick={() => handleSort('preco_venda')}
                className="px-6 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-stone-100 transition"
              >
                <div className="flex items-center gap-2">P. Venda <SortIcon field="preco_venda" /></div>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Unidade</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Margem %</th>
            </tr>
          </thead>
          <tbody>
            {sortedProdutos.map((produto, idx) => {
              const margem = ((produto.preco_venda - produto.preco_custo) / produto.preco_venda * 100).toFixed(1);
              return (
                <tr key={produto.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                  <td className="px-6 py-4 text-sm text-slate-800 font-medium">{produto.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{produto.categoria?.nome || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{produto.fornecedor?.nome || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-800">{parseFloat(produto.estoque_atual).toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-sm text-slate-800">R$ {parseFloat(produto.preco_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-sm text-slate-800">R$ {parseFloat(produto.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{produto.unidade_medida}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-700">{margem}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {produtos.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Nenhum produto encontrado
          </div>
        )}
      </div>
    </div>
  );
}
