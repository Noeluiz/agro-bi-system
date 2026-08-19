import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

const initialForm = {
  fazenda: '', cultura: '', variedade: '', data_recomendacao: '', data_maxima_aplicacao: '',
  tipo_maquina: 'Pulverizador', operador: '', modelo_maquina: '', capacidade_tanque_l: '',
  vazao_l_ha: '', pressao_bar: '', velocidade_kmh: '', bico: '', area_total_ha: '',
};

export default function NovaOrdemAplicacao({ onBack, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [safras, setSafras] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [itens, setItens] = useState([{ produto_id: '', dose_ha: '' }]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [safrasResponse, produtosResponse] = await Promise.all([
          apiFetch(`${API_URL}/api/safras`),
          apiFetch(`${API_URL}/api/produtos`),
        ]);
        if (!safrasResponse.ok || !produtosResponse.ok) throw new Error('Não foi possível carregar safras e produtos.');
        setSafras(await safrasResponse.json());
        setProdutos(await produtosResponse.json());
      } catch (err) {
        setError(err.message || 'Erro ao carregar dados do formulário.');
      } finally {
        setLoadingData(false);
      }
    };
    carregarDados();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSafraChange = (event) => {
    const safra = safras.find((item) => String(item.id) === event.target.value);
    if (!safra) {
      setForm((current) => ({ ...current, fazenda: '', cultura: '', area_total_ha: '' }));
      return;
    }
    setForm((current) => ({
      ...current,
      fazenda: safra.nome_safra,
      cultura: safra.cultura,
      area_total_ha: safra.hectares_plantados,
    }));
  };

  const updateItem = (index, field, value) => {
    setItens((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const addItem = () => setItens((current) => [...current, { produto_id: '', dose_ha: '' }]);
  const removeItem = (index) => setItens((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (itens.some((item) => !item.produto_id || !item.dose_ha || Number(item.dose_ha) <= 0)) {
      setError('Informe um produto e uma dose válida para todos os itens.');
      return;
    }
    if (new Set(itens.map((item) => item.produto_id)).size !== itens.length) {
      setError('Cada produto pode aparecer apenas uma vez na ordem.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        capacidade_tanque_l: Number(form.capacidade_tanque_l),
        vazao_l_ha: Number(form.vazao_l_ha),
        pressao_bar: Number(form.pressao_bar),
        velocidade_kmh: Number(form.velocidade_kmh),
        area_total_ha: Number(form.area_total_ha),
        itens: itens.map((item) => ({ produto_id: Number(item.produto_id), dose_ha: Number(item.dose_ha) })),
      };
      const response = await apiFetch(`${API_URL}/api/ordens-aplicacao`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.detail || 'Não foi possível criar a ordem.');
      }
      onCreated();
    } catch (err) {
      setError(err.message || 'Erro ao criar ordem.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center py-16 text-slate-600"><Loader className="w-6 h-6 animate-spin text-emerald-700" /><span className="ml-2">Carregando dados...</span></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-stone-50" title="Voltar para ordens">
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-emerald-800">Nova Ordem de Aplicação</h1>
          <p className="text-slate-600 mt-1">Preencha os parâmetros operacionais e os produtos da aplicação.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-600 shrink-0" /><p className="text-red-700 text-sm">{error}</p></div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-lg font-bold text-emerald-800 mb-4">Área e cultura</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className={labelClass} htmlFor="safra">Usar dados da safra</label><select id="safra" onChange={handleSafraChange} className={inputClass}><option value="">Selecionar safra (opcional)</option>{safras.map((safra) => <option key={safra.id} value={safra.id}>{safra.nome_safra}</option>)}</select></div>
            <div><label className={labelClass} htmlFor="fazenda">Fazenda</label><input id="fazenda" name="fazenda" value={form.fazenda} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="cultura">Cultura</label><input id="cultura" name="cultura" value={form.cultura} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="variedade">Variedade</label><input id="variedade" name="variedade" value={form.variedade} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="area_total_ha">Área total (ha)</label><input id="area_total_ha" name="area_total_ha" type="number" min="0.01" step="0.01" value={form.area_total_ha} onChange={handleChange} className={inputClass} required /></div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-lg font-bold text-emerald-800 mb-4">Datas e responsável</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className={labelClass} htmlFor="data_recomendacao">Data de recomendação</label><input id="data_recomendacao" name="data_recomendacao" type="date" value={form.data_recomendacao} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="data_maxima_aplicacao">Data máxima de aplicação</label><input id="data_maxima_aplicacao" name="data_maxima_aplicacao" type="date" value={form.data_maxima_aplicacao} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="operador">Operador</label><input id="operador" name="operador" value={form.operador} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="tipo_maquina">Tipo de máquina</label><select id="tipo_maquina" name="tipo_maquina" value={form.tipo_maquina} onChange={handleChange} className={inputClass}><option>Pulverizador</option><option>Drone</option><option>Avião</option><option>Costal</option><option>Outro</option></select></div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h2 className="text-lg font-bold text-emerald-800 mb-4">Parâmetros da máquina</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div><label className={labelClass} htmlFor="modelo_maquina">Modelo</label><input id="modelo_maquina" name="modelo_maquina" value={form.modelo_maquina} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="capacidade_tanque_l">Tanque (L)</label><input id="capacidade_tanque_l" name="capacidade_tanque_l" type="number" min="0.01" step="0.01" value={form.capacidade_tanque_l} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="vazao_l_ha">Vazão (L/ha)</label><input id="vazao_l_ha" name="vazao_l_ha" type="number" min="0.01" step="0.01" value={form.vazao_l_ha} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="pressao_bar">Pressão (bar)</label><input id="pressao_bar" name="pressao_bar" type="number" min="0.01" step="0.01" value={form.pressao_bar} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="velocidade_kmh">Velocidade (km/h)</label><input id="velocidade_kmh" name="velocidade_kmh" type="number" min="0.01" step="0.01" value={form.velocidade_kmh} onChange={handleChange} className={inputClass} required /></div>
            <div><label className={labelClass} htmlFor="bico">Bico</label><input id="bico" name="bico" value={form.bico} onChange={handleChange} className={inputClass} required /></div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"><div><h2 className="text-lg font-bold text-emerald-800">Produtos da aplicação</h2><p className="text-sm text-slate-500 mt-1">A quantidade total será calculada pelo servidor com base na área e na dose.</p></div><button type="button" onClick={addItem} className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-emerald-700 text-emerald-800 rounded-lg hover:bg-emerald-50"><Plus className="w-4 h-4" aria-hidden="true" />Adicionar produto</button></div>
          <div className="space-y-3">
            {itens.map((item, index) => <div key={`item-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3 items-end p-3 bg-stone-50 rounded-lg border border-slate-200"><div><label className={labelClass} htmlFor={`produto-${index}`}>Produto</label><select id={`produto-${index}`} value={item.produto_id} onChange={(event) => updateItem(index, 'produto_id', event.target.value)} className={inputClass} required><option value="">Selecionar produto</option>{produtos.map((produto) => <option key={produto.id} value={produto.id}>{produto.nome} ({produto.unidade_medida})</option>)}</select></div><div><label className={labelClass} htmlFor={`dose-${index}`}>Dose (L/ha)</label><input id={`dose-${index}`} type="number" min="0.0001" step="0.0001" value={item.dose_ha} onChange={(event) => updateItem(index, 'dose_ha', event.target.value)} className={inputClass} required /></div><button type="button" onClick={() => removeItem(index)} disabled={itens.length === 1} className="p-2.5 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed" title="Remover produto"><Trash2 className="w-5 h-5" aria-hidden="true" /></button></div>)}
          </div>
        </section>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3"><button type="button" onClick={onBack} className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-stone-50">Cancelar</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed">{saving && <Loader className="w-4 h-4 animate-spin" aria-hidden="true" />}{saving ? 'Criando...' : 'Criar ordem'}</button></div>
      </form>
    </div>
  );
}