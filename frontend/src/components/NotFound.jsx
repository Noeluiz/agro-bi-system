import { Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound({ autenticado }) {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <section className="w-full max-w-lg text-center bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-800 mb-6">
          <Sprout className="w-9 h-9 text-emerald-100" aria-hidden="true" />
        </div>
        <p className="text-emerald-700 font-semibold tracking-wide">AGRO-BI</p>
        <h1 className="text-6xl font-bold text-emerald-800 mt-3">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mt-4">Página não encontrada</h2>
        <p className="text-slate-600 mt-3">O endereço informado não existe ou pode ter sido movido.</p>
        <Link
          to={autenticado ? '/dashboard' : '/login'}
          className="inline-flex mt-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-5 rounded-lg transition"
        >
          Voltar para Dashboard
        </Link>
      </section>
    </main>
  );
}
