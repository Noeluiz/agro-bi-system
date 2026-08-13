import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * ErrorBoundary Component
 * 
 * Componente reutilizável para exibir erros
 * Centraliza estilo de mensagem de erro
 * 
 * Props:
 * - error (string, optional): Mensagem de erro a exibir
 * - onClear (function, optional): Callback para limpar erro
 * - children (React.Node): Conteúdo quando não há erro
 * 
 * Exemplo:
 * <ErrorBoundary error={error} onClear={() => setError('')}>
 *   {/* conteúdo normal */}
 * </ErrorBoundary>
 */
export default function ErrorBoundary({ error, onClear, children }) {
  if (!error) {
    return children;
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-700 font-medium">Erro</p>
        <p className="text-red-600 text-sm">{error}</p>
        {onClear && (
          <button
            onClick={onClear}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium underline"
          >\n            Descartar\n          </button>\n        )}\n      </div>\n    </div>\n  );\n}
