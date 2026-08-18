import { useState, useEffect } from 'react';
import { AlertCircle, Plus, ArrowLeft, Loader, Trash2, Check } from 'lucide-react';
import { apiFetch } from '../auth';
import { formatarMoeda } from '../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function DetalhesSafra({ safraId, onBack }) {
  const [safra, setSafra] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [aplicacoes, setAplicacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    produto_id: '',
    quantidade_usada: '',
    data_aplicacao: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [safraId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar detalhes da safra
      const safraRes = await apiFetch(`${API_URL}/api/safras`);
      if (safraRes.ok) {
        const safras = await safraRes.json();
        const safraEncontrada = safras.find(s => s.id === parseInt(safraId));
        if (safraEncontrada) {
          setSafra(safraEncontrada);
        } else {
          setError('Safra não encontrada');
        }
      }

      // Carregar produtos disponíveis
      const prodRes = await apiFetch(`${API_URL}/api/produtos`);
      if (prodRes.ok) {
        const prods = await prodRes.json();
        setProdutos(prods);
      }

      // Carregar aplicações desta safra (se houver um endpoint específico)
      // Por enquanto, usaremos uma lista vazia que será preenchida quando adicionar
      setAplicacoes([]);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
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
    
    if (!formData.produto_id || !formData.quantidade_usada) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const aplicacaoData = {
        safra_id: parseInt(safraId),
        produto_id: parseInt(formData.produto_id),
        quantidade_usada: parseFloat(formData.quantidade_usada),
        data_aplicacao: formData.data_aplicacao,
      };

      const res = await apiFetch(`${API_URL}/api/aplicacoes`, {
        method: 'POST',
        body: JSON.stringify(aplicacaoData),
      });

      if (res.ok) {
        const novaAplicacao = await res.json();
        
        // Adicionar à lista de aplicações
        setAplicacoes(prev => [novaAplicacao, ...prev]);

        // Atualizar custo da safra
        if (safra) {
          setSafra(prev => ({
            ...prev,
            custo_total: (parseFloat(prev.custo_total || prev.custo_total_acumulado || 0) + parseFloat(novaAplicacao.custo_total)).toFixed(2)
          }));
        }

        // Atualizar produto (estoque reduzido)
        const produtoAfetado = produtos.find(p => p.id === parseInt(formData.produto_id));
        if (produtoAfetado) {
          setProdutos(prev => prev.map(p => 
            p.id === produtoAfetado.id 
              ? { ...p, estoque_atual: (parseFloat(p.estoque_atual) - parseFloat(formData.quantidade_usada)).toFixed(2) }
              : p
          ));
        }

        // Limpar formulário
        setFormData({
          produto_id: '',
          quantidade_usada: '',
          data_aplicacao: new Date().toISOString().split('T')[0],
        });
        setShowForm(false);
      } else {
        const erro = await res.json();
        setError('Erro ao registrar aplicação: ' + (erro.detail || 'Erro desconhecido'));
      }
    } catch (err) {
      setError('Erro ao registrar aplicação: ' + err.message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-emerald-700" />
          <span className="ml-2 text-slate-600">Carregando detalhes...</span>
        </div>
      </div>
    );
  }

  if (!safra) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center">
          <p className="text-red-600">Erro: Safra não encontrada</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const produtoSelecionado = produtos.find(p => p.id === parseInt(formData.produto_id));
  const custoPrevisualizacao = produtoSelecionado && formData.quantidade_usada 
    ? (parseFloat(produtoSelecionado.preco_custo) * parseFloat(formData.quantidade_usada)).toFixed(2)
    : 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-emerald-800">{safra.nome_safra}</h1>
          <p className="text-slate-600 mt-1">Cultura: <span className="font-medium">{safra.cultura}</span></p>
        </div>
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

      {/* Informações da Safra */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-sm text-slate-600 mb-1">Hectares</p>
          <p className="text-2xl font-bold text-emerald-800">{safra.hectares_plantados}</p>
          <p className="text-xs text-slate-500 mt-1">hectares plantados</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-sm text-slate-600 mb-1">Produção</p>
          <p className="text-2xl font-bold text-emerald-800">{safra.sacas_produzidas || '-'}</p>
          <p className="text-xs text-slate-500 mt-1">sacas produzidas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-sm text-slate-600 mb-1">Custo Total</p>
          <p className="text-2xl font-bold text-emerald-800">{formatarMoeda(safra.custo_total || safra.custo_total_acumulado)}</p>
          <p className="text-xs text-slate-500 mt-1">investimento acumulado</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-sm text-slate-600 mb-1">Aplicações</p>
          <p className="text-2xl font-bold text-emerald-800">{aplicacoes.length}</p>
          <p className="text-xs text-slate-500 mt-1">insumos registrados</p>
        </div>
      </div>

      {/* Datas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600 mb-1">Data de Início</p>
            <p className="text-lg font-medium text-emerald-800">
              {new Date(safra.data_inicio).toLocaleDateString('pt-BR')}
            </p>
          </div>
          {safra.data_fim && (
            <div>
              <p className="text-sm text-slate-600 mb-1">Data de Término</p>
              <p className="text-lg font-medium text-emerald-800">
                {new Date(safra.data_fim).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Aplicações de Insumos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-emerald-800">Aplicações de Insumos</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Aplicação
          </button>
        </div>

        {/* Formulário de Aplicação */}
        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-emerald-800 mb-4">Nova Aplicação de Insumo</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Produto
                  </label>
                  <select
                    name="produto_id"
                    value={formData.produto_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">Selecione um produto</option>
                    {produtos.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.nome} (Estoque: {prod.estoque_atual} {prod.unidade_medida})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantidade Usada
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="quantidade_usada"
                      placeholder="0.00"
                      value={formData.quantidade_usada}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                    {produtoSelecionado && (
                      <span className="absolute right-3 top-2.5 text-sm text-slate-600">
                        {produtoSelecionado.unidade_medida}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Data da Aplicação
                  </label>
                  <input
                    type="date"
                    name="data_aplicacao"
                    value={formData.data_aplicacao}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                {custoPrevisualizacao > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-slate-700">Custo estimado:</span>
                    <span className="text-lg font-bold text-emerald-800">
                      {formatarMoeda(custoPrevisualizacao)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {submitting ? 'Registrando...' : 'Registrar Aplicação'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      produto_id: '',
                      quantidade_usada: '',
                      data_aplicacao: new Date().toISOString().split('T')[0],
                    });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Aplicações */}
        <div className="space-y-3">
          {aplicacoes.length === 0 ? (
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <p className="text-slate-600">Nenhuma aplicação registrada. Adicione uma para começar!</p>
            </div>
          ) : (
            aplicacoes.map(app => {
              const prod = produtos.find(p => p.id === app.produto_id);
              return (
                <div
                  key={app.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-emerald-800">{prod?.nome || 'Produto desconhecido'}</h4>
                      <div className="flex gap-4 mt-2 text-sm text-slate-600">
                        <span>📦 {app.quantidade_usada} {prod?.unidade_medida}</span>
                        <span>💰 {formatarMoeda(app.custo_total)}</span>
                        <span>📅 {new Date(app.data_aplicacao).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
