import React from 'react';

/**
 * SectionTitle Component
 * 
 * Componente reutilizável para cabeçalhos de seção
 * Centraliza estilo e comportamento
 * 
 * Props:
 * - title (string): Título da seção
 * - action (React.Node, optional): Elemento de ação (botão, etc)
 * 
 * Exemplo:
 * <SectionTitle 
 *   title="Estoque" 
 *   action={<button>Novo Produto</button>}
 * />
 */
export default function SectionTitle({ title, action }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <h2 className="text-2xl font-bold text-emerald-800">{title}</h2>
      {action && <div className="w-full md:w-auto">{action}</div>}
    </div>
  );
}
