import { useState, useEffect } from 'react';
import { AlertCircle, Plus, ChevronRight, Loader, Trash2 } from 'lucide-react';
import { apiFetch } from '../auth';
import { formatarMoeda } from '../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Safras({ onSelectSafra, role }) {
  const [safras, setSafras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome_safra: '',
    cultura: '',
    data_inicio: '',
    data_fim: '',
    hectares_plantados: '',
    sacas_produzidas: '',
    custo_total_acumulado: '0',
  });

  useEffect(() => {
    carregarSafras();
  }, []);

  const carregarSafras = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(`${API_URL}/api/safras`);
      if (res.ok) {
        const dados = await res.json();
        setSafras(dados);
      } else {
        setError('Erro ao carregar safras');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const novasSafras = {
        ...formData,
        hectares_plantados: parseFloat(formData.hectares_plantados),
        sacas_produzidas: formData.sacas_produzidas ? parseFloat(formData.sacas_produzidas) : null,
        custo_total_acumulado: parseFloat(formData.custo_total_acumulado || 0),
      };

      const res = await apiFetch(`${API_URL}/api/safras`, {
        method: 'POST',
        body: JSON.stringify(novasSafras),
      });

      if (res.ok) {
        await carregarSafras();
        setFormData({
          nome_safra: '',
          cultura: '',
          data_inicio: '',
          data_fim: '',
          hectares_plantados: '',
          sacas_produzidas: '',
          custo_total_acumulado: '0',
        });
        setShowForm(false);
      } else {
        const erro = await res.json();
        setError('Erro ao criar safra: ' + (erro.detail || 'Erro desconhecido'));
      }
    } catch (err) {
      setError('Erro ao criar safra: ' + err.message);
    }
  };

  const handleDeletarSafra = async (safra) => {
    if (!window.confirm(`Excluir a safra "${safra.nome_safra}"?`)) return;
    try {
      const response = await apiFetch(`${API_URL}/api/safras/${safra.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Não foi possível excluir a safra.');
      }
      setSafras((current) => current.filter((item) => item.id !== safra.id));
    } catch (err) {
      setError(`Erro ao excluir safra: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-emerald-700" />
          <span className="ml-2 text-slate-600">Carregando safras...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-800">Safras</h1>
          <p className="text-slate-600 mt-1">Gerencie suas safras e culturas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Safra
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Erro</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Formulário de Nova Safra */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-emerald-800 mb-4">Nova Safra</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="nome_safra"
              placeholder="Nome da safra"
              value={formData.nome_safra}
              onChange={handleInputChange}
              required
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <input
              type="text"
              name="cultura"
              placeholder="Cultura (ex: Soja, Milho, Trigo)"
              value={formData.cultura}
              onChange={handleInputChange}
              required
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <input
              type="date"
              name="data_inicio"
              value={formData.data_inicio}
              onChange={handleInputChange}
              required
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <input
              type="date"
              name="data_fim"
              value={formData.data_fim}
              onChange={handleInputChange}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <input
              type="number"
              name="hectares_plantados"
              placeholder="Hectares plantados"
              value={formData.hectares_plantados}
              onChange={handleInputChange}
              step="0.01"
              required
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <input
              type="number"
              name="sacas_produzidas"
              placeholder="Sacas produzidas (opcional)"
              value={formData.sacas_produzidas}
              onChange={handleInputChange}
              step="0.01"
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors font-medium"
              >
                Criar Safra
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Safras */}
      <div className="space-y-3">
        {safras.length === 0 ? (
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <p className="text-slate-600">Nenhuma safra registrada. Crie uma para começar!</p>
          </div>
        ) : (
          safras.map(safra => (
              <div
              key={safra.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <button type="button" onClick={() => onSelectSafra(safra.id)} className="text-left text-lg font-semibold text-emerald-800 hover:text-emerald-700">{safra.nome_safra}</button>
                  <p className="text-sm text-slate-600 mt-1">
                    Cultura: <span className="font-medium">{safra.cultura}</span>
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-slate-600">
                    <span>📍 {safra.hectares_plantados} ha</span>
                    {safra.sacas_produzidas && <span>🌾 {safra.sacas_produzidas} sacas</span>}
                    <span>💰 {formatarMoeda(safra.custo_total || safra.custo_total_acumulado)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                  {role === 'ADMIN' && <button type="button" onClick={() => handleDeletarSafra(safra)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Excluir safra"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
