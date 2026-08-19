import { BookOpen, PlayCircle, RotateCcw, Video } from 'lucide-react';

export default function Ajuda({ onReplayOnboarding }) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <BookOpen className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-800">Ajuda e Tutoriais</h1>
        </div>
        <p className="text-slate-600 mt-2">Aprenda os principais fluxos do Agro-BI e reveja o guia quando precisar.</p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-emerald-800">Tour interativo</h2>
            <p className="text-slate-600 mt-1">Reinicie o passo a passo para conhecer novamente Estoque, Safras, Ordens e resultados.</p>
          </div>
          <button type="button" onClick={onReplayOnboarding} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition">
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Reiniciar Tour
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-emerald-800">
            <Video className="w-5 h-5" aria-hidden="true" />
            <h2 className="text-xl font-bold">Vídeo Tutorial</h2>
          </div>
          <p className="text-slate-600 mt-1">Este espaço está preparado para receber o vídeo de treinamento da sua operação.</p>
        </div>
        <div className="aspect-video bg-stone-100 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <PlayCircle className="w-12 h-12 text-emerald-700" aria-hidden="true" />
          <p className="text-lg font-semibold text-slate-700">Vídeo tutorial em breve</p>
          <p className="text-sm text-slate-500 max-w-md">O vídeo poderá ser incorporado aqui por meio de um endereço seguro do YouTube, Vimeo ou da biblioteca da empresa.</p>
          {/* Substituir esta área por um iframe quando houver uma URL de vídeo aprovada. */}
        </div>
      </section>
    </div>
  );
}