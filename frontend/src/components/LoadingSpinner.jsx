import React from 'react';

/**
 * LoadingSpinner Component
 * 
 * Componente reutilizável para tela de carregamento
 * Centraliza estilo de spinner
 * 
 * Props:
 * - message (string, optional): Mensagem a exibir durante carregamento
 *   Default: "Carregando..."
 * 
 * Exemplo:
 * {loading && <LoadingSpinner message="Carregando funcionários..." />}
 */
export default function LoadingSpinner({ message = 'Carregando...' }) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-3"></div>
          <p className="text-slate-600">{message}</p>
        </div>
      </div>
    </div>
  );
}
