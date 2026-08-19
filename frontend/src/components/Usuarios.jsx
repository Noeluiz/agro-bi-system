import { useEffect, useState } from 'react';
import { AlertCircle, Edit3, Loader, Lock, Plus, ShieldCheck, Unlock, UserCog, X } from 'lucide-react';
import { apiFetch } from '../auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const vazio = { nome: '', email: '', senha: '', role: 'GERENTE' };
const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState('');

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch(`${API_URL}/api/usuarios`);
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || 'Erro ao carregar usuários.');
      setUsuarios(await response.json());
    } catch (err) {
      setError(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarUsuarios(); }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm(vazio);
    setModalAberto(true);
  };

  const abrirEdicao = (usuario) => {
    setEditando(usuario);
    setForm({ nome: usuario.nome, email: usuario.email, senha: '', role: usuario.role });
    setModalAberto(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSalvando(true);
      setError('');
      const payload = { nome: form.nome, email: form.email, role: form.role };
      if (form.senha) payload.senha = form.senha;
      const response = await apiFetch(
        editando ? `${API_URL}/api/usuarios/${editando.id}` : `${API_URL}/api/usuarios`,
        { method: editando ? 'PATCH' : 'POST', body: JSON.stringify(editando ? payload : { ...payload, senha: form.senha }) },
      );
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || 'Não foi possível salvar o usuário.');
      setModalAberto(false);
      await carregarUsuarios();
    } catch (err) {
      setError(err.message || 'Erro ao salvar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (usuario) => {
    try {
      setError('');
      const response = await apiFetch(`${API_URL}/api/usuarios/${usuario.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: !usuario.ativo }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || 'Não foi possível alterar o status.');
      await carregarUsuarios();
    } catch (err) {
      setError(err.message || 'Erro ao alterar status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center"><UserCog className="w-5 h-5" aria-hidden="true" /></div>
          <div><h1 className="text-3xl font-bold text-emerald-800">Usuários</h1><p className="text-slate-600 mt-1">Gerencie acessos e papéis do sistema.</p></div>
        </div>
        <button type="button" onClick={abrirNovo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"><Plus className="w-5 h-5" aria-hidden="true" />Novo usuário</button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-600 shrink-0" aria-hidden="true" /><p className="text-red-700 text-sm">{error}</p></div>}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-16 text-slate-600"><Loader className="w-6 h-6 animate-spin text-emerald-700" /><span className="ml-2">Carregando usuários...</span></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-stone-50 border-b border-slate-200"><tr className="text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-5 py-3">Nome</th><th className="px-5 py-3">E-mail</th><th className="px-5 py-3">Papel</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{usuarios.map((usuario) => <tr key={usuario.id} className="hover:bg-stone-50"><td className="px-5 py-4 font-medium text-slate-800">{usuario.nome}</td><td className="px-5 py-4 text-slate-600">{usuario.email}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-slate-700"><ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />{usuario.role}</span></td><td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${usuario.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>{usuario.ativo ? 'Ativo' : 'Bloqueado'}</span></td><td className="px-5 py-4 text-right"><div className="inline-flex items-center gap-1"><button type="button" onClick={() => abrirEdicao(usuario)} className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50" title="Editar usuário"><Edit3 className="w-4 h-4" aria-hidden="true" /></button><button type="button" onClick={() => alternarStatus(usuario)} className={`p-2 rounded-lg ${usuario.ativo ? 'text-red-600 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'}`} title={usuario.ativo ? 'Bloquear usuário' : 'Desbloquear usuário'}>{usuario.ativo ? <Lock className="w-4 h-4" aria-hidden="true" /> : <Unlock className="w-4 h-4" aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      </div>

      {modalAberto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200"><div className="flex items-center justify-between p-5 border-b border-slate-200"><h2 className="text-xl font-bold text-emerald-800">{editando ? 'Editar usuário' : 'Novo usuário'}</h2><button type="button" onClick={() => setModalAberto(false)} className="p-2 rounded-lg text-slate-500 hover:bg-stone-100" title="Fechar"><X className="w-5 h-5" /></button></div><form onSubmit={handleSubmit} className="p-5 space-y-4"><div><label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="usuario-nome">Nome</label><input id="usuario-nome" className={inputClass} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="usuario-email">E-mail</label><input id="usuario-email" type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="usuario-senha">Senha {editando && <span className="font-normal text-slate-500">(deixe em branco para manter)</span>}</label><input id="usuario-senha" type="password" minLength="6" className={inputClass} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} required={!editando} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="usuario-role">Papel</label><select id="usuario-role" className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="ADMIN">ADMIN</option><option value="GERENTE">GERENTE</option><option value="OPERADOR">OPERADOR</option></select></div><div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-stone-50">Cancelar</button><button type="submit" disabled={salvando} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-60">{salvando && <Loader className="w-4 h-4 animate-spin" />}{editando ? 'Salvar alterações' : 'Cadastrar usuário'}</button></div></form></div></div>}
    </div>
  );
}