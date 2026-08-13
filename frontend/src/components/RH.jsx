import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import CadastroModal from './CadastroModal';
import { apiFetch } from '../auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function RH() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [deletando, setDeletando] = useState(null);

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  const carregarFuncionarios = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch(`${API_URL}/api/funcionarios`);

      if (!response.ok) {
        throw new Error('Erro ao carregar funcionários');
      }

      const data = await response.json();
      setFuncionarios(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar funcionários:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarFuncionario = (novoFuncionario) => {
    setFuncionarios(prev => [...prev, novoFuncionario]);
    carregarFuncionarios();
  };

  const handleDeletar = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este funcionário?')) {
      return;
    }

    setDeletando(id);
    try {
      const response = await apiFetch(`${API_URL}/api/funcionarios/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar funcionário');
      }

      setFuncionarios(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError('Erro ao deletar: ' + err.message);
      console.error('Erro ao deletar funcionário:', err);
    } finally {
      setDeletando(null);
    }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  };

  const formatarSalario = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-3"></div>
            <p className="text-slate-600">Carregando funcionários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão de adicionar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-emerald-800">Recursos Humanos</h2>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition"
        >
          <Plus className="w-5 h-5" />
          Adicionar Funcionário
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Erro</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Modal */}
      <CadastroModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        tipo="funcionario"
        onSuccess={handleAdicionarFuncionario}
      />

      {/* Tabela de Funcionários */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Nome</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">CPF</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Cargo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Salário</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Data Admissão</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    Nenhum funcionário cadastrado
                  </td>
                </tr>
              ) : (
                funcionarios.map((func, idx) => (
                  <tr key={func.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{func.nome}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{func.cpf || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{func.cargo}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                      {formatarSalario(func.salario_base)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatarData(func.data_admissao)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          func.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {func.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {/* TRAVA #2 CORRIGIDA: Remover botão de editar não funcional */}
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeletar(func.id)}
                        disabled={deletando === func.id}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer com resumo */}
        {funcionarios.length > 0 && (
          <div className="px-6 py-3 bg-stone-50 border-t border-slate-200 text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-800">{funcionarios.length}</span> funcionário(s)
            |
            Ativos: <span className="font-semibold text-green-700">{funcionarios.filter(f => f.ativo).length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
