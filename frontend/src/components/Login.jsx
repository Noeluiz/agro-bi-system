import { useState } from 'react';
import { Lock, Mail, LogIn, Sprout, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { saveSession } from '../auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      // O backend usa OAuth2PasswordRequestForm, que espera form-urlencoded
      const body = new URLSearchParams();
      body.append('username', email);
      body.append('password', senha);

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        credentials: 'include', // aceita/define o cookie HttpOnly
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || 'E-mail ou senha incorretos');
      }

      // O backend retorna role/nome/email no corpo da resposta do login.
      const role = data.role || 'GERENTE';
      const nome = data.nome || '';
      const emailLogado = data.email || email;

      saveSession({ role, nome, email: emailLogado });

      if (onLogin) onLogin({ role, nome, email: emailLogado });
    } catch (err) {
      setErro(err.message || 'Falha ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-800 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-700/40 mb-4">
              <Sprout className="w-9 h-9 text-emerald-100" />
            </div>
            <h1 className="text-2xl font-bold text-white">Agro-BI</h1>
            <p className="text-emerald-200 text-sm mt-1">Sistema de Gestão Agrícola</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Senha</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showSenha ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Mostrar senha"
                >
                  {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="text-center text-xs text-slate-500 leading-relaxed">
              Ao continuar, você concorda com nossos{' '}
              <Link to="/termos" className="text-emerald-700 hover:text-emerald-800 underline underline-offset-2">
                Termos de Uso
              </Link>{' '}e{' '}
              <Link to="/privacidade" className="text-emerald-700 hover:text-emerald-800 underline underline-offset-2">
                Política de Privacidade
              </Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
