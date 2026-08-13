import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { apiFetch } from '../auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Categorias financeiras pré-definidas - TRAVA #3
const CATEGORIAS_FINANCEIRAS = [
  'Vendas de Grãos',
  'Vendas de Insumos',
  'Vendas de Serviços',
  'Combustível',
  'Manutenção de Equipamentos',
  'Salários',
  'Compra de Insumos',
  'Juros',
  'Impostos',
  'Energia Elétrica',
  'Água e Saneamento',
  'Aluguel',
  'Transporte',
  'Consultorias',
  'Outros',
];

/**
 * CadastroModal.jsx - COM ABAS
 * Modal reutilizável com abas para cadastro de Produtos, Categorias e Fornecedores.
 * Atualização inteligente de listas sem recarregar a página.
 * 
 * Props:
 * - isOpen: boolean para controlar visibilidade
 * - onClose: callback ao fechar
 * - tipo: 'produto' | 'categoria' | 'fornecedor' | 'fluxo' | 'funcionario' | 'alerta'
 * - categorias: array de categorias (para produto)
 * - fornecedores: array de fornecedores (para produto)
 * - produtos: array de produtos (para alerta)
 * - onSuccess: callback após sucesso na API
 * - onCategoriesUpdated: callback quando novas categorias são adicionadas
 * - onFornecedoresUpdated: callback quando novos fornecedores são adicionados
 */
export default function CadastroModal({
  isOpen,
  onClose,
  tipo = 'produto',
  categorias = [],
  fornecedores = [],
  produtos = [],
  onSuccess = () => { },
  onCategoriesUpdated = () => { },
  onFornecedoresUpdated = () => { },
}) {
  // Estado para abas (apenas quando tipo === 'produto')
  const [activeTab, setActiveTab] = useState('produto');
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localCategorias, setLocalCategorias] = useState(categorias);
  const [localFornecedores, setLocalFornecedores] = useState(fornecedores);

  // Quando as props de categorias ou fornecedores mudam, atualiza localmente
  useEffect(() => {
    setLocalCategorias(categorias);
  }, [categorias]);

  useEffect(() => {
    setLocalFornecedores(fornecedores);
  }, [fornecedores]);

  useEffect(() => {
    if (isOpen) {
      // Se é modal de produto, inicia com aba de produto
      if (tipo === 'produto') {
        setActiveTab('produto');
      }
      setFormData(getDefaultValues(tipo === 'produto' ? activeTab : tipo));
      setError('');
    }
  }, [isOpen, tipo]);

  // Muda aba e reseta form
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormData(getDefaultValues(tab));
    setError('');
  };

  const getDefaultValues = (tipoForm) => {
    const defaults = {
      produto: {
        nome: '',
        categoria_id: '',
        fornecedor_id: '',
        estoque_atual: 0,
        estoque_minimo: 0,
        preco_custo: 0,
        preco_venda: 0,
        unidade_medida: 'Unidade',
      },
      categoria: {
        nome: '',
      },
      fornecedor: {
        nome: '',
        cnpj: '',
        email: '',
        telefone: '',
      },
      fluxo: {
        tipo: 'Receita',
        valor: 0,
        categoria_financeira: '',
        descricao: '',
        data: new Date().toISOString().split('T')[0],
      },
      funcionario: {
        nome: '',
        cpf: '',
        cargo: '',
        salario_base: 0,
        data_admissao: new Date().toISOString().split('T')[0],
      },
      alerta: {
        produto_id: '',
        tipo_alerta: 'Baixo Estoque',
        mensagem: '',
      },
    };

    return defaults[tipoForm] || {};
  };

  const getTitle = () => {
    if (tipo === 'produto') {
      const titles = {
        produto: 'Adicionar Produto',
        categoria: 'Adicionar Categoria',
        fornecedor: 'Adicionar Fornecedor',
      };
      return titles[activeTab] || 'Cadastro';
    }

    const titles = {
      fluxo: 'Adicionar Lançamento de Caixa',
      funcionario: 'Adicionar Funcionário',
      alerta: 'Adicionar Alerta de Estoque',
    };
    return titles[tipo] || 'Cadastro';
  };

  const getEndpoint = () => {
    const currentTipo = tipo === 'produto' ? activeTab : tipo;
    const endpoints = {
      produto: '/api/produtos',
      categoria: '/api/categorias',
      fornecedor: '/api/fornecedores',
      fluxo: '/api/fluxo-caixa',
      funcionario: '/api/funcionarios',
      alerta: '/api/alertas-estoque',
    };
    return endpoints[currentTipo] || '';
  };

  const validateForm = () => {
    const currentTipo = tipo === 'produto' ? activeTab : tipo;

    if (!formData.nome && currentTipo !== 'fluxo' && currentTipo !== 'alerta') {
      setError('Nome é obrigatório');
      return false;
    }

    if (currentTipo === 'produto') {
      if (!formData.categoria_id) {
        setError('Categoria é obrigatória');
        return false;
      }
      if (!formData.fornecedor_id) {
        setError('Fornecedor é obrigatório');
        return false;
      }
      if (formData.preco_custo < 0 || formData.preco_venda < 0) {
        setError('Preços não podem ser negativos');
        return false;
      }
    }

    if (currentTipo === 'fluxo') {
      if (!formData.categoria_financeira || formData.categoria_financeira.trim() === '') {
        setError('Categoria financeira é obrigatória');
        return false;
      }
      if (formData.valor <= 0) {
        setError('Valor deve ser maior que zero');
        return false;
      }
    }

    if (currentTipo === 'funcionario') {
      if (!formData.cargo || formData.cargo.trim() === '') {
        setError('Cargo é obrigatório');
        return false;
      }
      if (formData.salario_base < 0) {
        setError('Salário não pode ser negativo');
        return false;
      }
    }

    if (currentTipo === 'alerta') {
      if (!formData.produto_id) {
        setError('Produto é obrigatório');
        return false;
      }
      if (!formData.mensagem || formData.mensagem.trim() === '') {
        setError('Mensagem é obrigatória');
        return false;
      }
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const dataToSend = { ...formData };
      const currentTipo = tipo === 'produto' ? activeTab : tipo;

      if (currentTipo === 'produto') {
        dataToSend.categoria_id = parseInt(dataToSend.categoria_id, 10);
        dataToSend.fornecedor_id = parseInt(dataToSend.fornecedor_id, 10);
      }

      if (currentTipo === 'alerta') {
        dataToSend.produto_id = parseInt(dataToSend.produto_id, 10);
      }

      const response = await apiFetch(`${API_URL}${getEndpoint()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Erro ao salvar ${currentTipo}`);
      }

      const result = await response.json();

      // Atualização inteligente de listas locais
      if (currentTipo === 'categoria') {
        setLocalCategorias(prev => [...prev, result]);
        onCategoriesUpdated([...localCategorias, result]);
      } else if (currentTipo === 'fornecedor') {
        setLocalFornecedores(prev => [...prev, result]);
        onFornecedoresUpdated([...localFornecedores, result]);
      }

      onSuccess(result);

      // Se é modal de produto com abas, reseta formulário mas mantém modal aberto
      if (tipo === 'produto') {
        setFormData(getDefaultValues(currentTipo));
        // Mostra mensagem de sucesso por um breve momento
        setTimeout(() => {
          setFormData(getDefaultValues(currentTipo));
        }, 1000);
      } else {
        // Outros tipos fecham o modal
        onClose();
        setFormData(getDefaultValues(currentTipo));
      }
    } catch (err) {
      setError(err.message || `Erro ao salvar`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Determina qual tipo realmente usar
  const currentTipo = tipo === 'produto' ? activeTab : tipo;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-emerald-800">{getTitle()}</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-stone-100 transition disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* ABAS - Mostrar apenas para modal de Produto */}
        {tipo === 'produto' && (
          <div className="flex gap-0 border-b border-slate-200 bg-stone-50 px-6">
            {['produto', 'categoria', 'fornecedor'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab
                    ? 'text-emerald-700 border-emerald-700'
                    : 'text-slate-600 border-transparent hover:text-emerald-700'
                }`}
              >
                {tab === 'produto' && 'Produto'}
                {tab === 'categoria' && 'Categoria'}
                {tab === 'fornecedor' && 'Fornecedor'}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* PRODUTO */}
          {currentTipo === 'produto' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Produto *</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome || ''}
                    onChange={handleChange}
                    placeholder="Ex: Semente de Soja"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Categoria *</label>
                  <select
                    name="categoria_id"
                    value={formData.categoria_id || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione uma categoria</option>
                    {localCategorias.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fornecedor *</label>
                  <select
                    name="fornecedor_id"
                    value={formData.fornecedor_id || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione um fornecedor</option>
                    {localFornecedores.map(forn => (
                      <option key={forn.id} value={forn.id}>
                        {forn.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Unidade de Medida</label>
                  <select
                    name="unidade_medida"
                    value={formData.unidade_medida || 'Unidade'}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  >
                    <option value="Unidade">Unidade</option>
                    <option value="Kg">Kg</option>
                    <option value="Litro">Litro</option>
                    <option value="Saca">Saca</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estoque Atual</label>
                  <input
                    type="number"
                    name="estoque_atual"
                    value={formData.estoque_atual || 0}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estoque Mínimo</label>
                  <input
                    type="number"
                    name="estoque_minimo"
                    value={formData.estoque_minimo || 0}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preço Custo (R$)</label>
                  <input
                    type="number"
                    name="preco_custo"
                    value={formData.preco_custo || 0}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preço Venda (R$)</label>
                  <input
                    type="number"
                    name="preco_venda"
                    value={formData.preco_venda || 0}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </>
          )}

          {/* CATEGORIA */}
          {currentTipo === 'categoria' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Categoria *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome || ''}
                onChange={handleChange}
                placeholder="Ex: Sementes"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* FORNECEDOR */}
          {currentTipo === 'fornecedor' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Fornecedor *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome || ''}
                  onChange={handleChange}
                  placeholder="Ex: Bayer CropScience"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">CNPJ</label>
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj || ''}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    placeholder="contato@fornecedor.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone || ''}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </>
          )}

          {/* FLUXO DE CAIXA */}
          {currentTipo === 'fluxo' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo *</label>
                  <select
                    name="tipo"
                    value={formData.tipo || 'Receita'}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  >
                    <option value="Receita">Receita (Entrada)</option>
                    <option value="Despesa">Despesa (Saída)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Valor (R$) *</label>
                  <input
                    type="number"
                    name="valor"
                    value={formData.valor || 0}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Categoria Financeira *</label>
                  <select
                    name="categoria_financeira"
                    value={formData.categoria_financeira || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione uma categoria</option>
                    {CATEGORIAS_FINANCEIRAS.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Data</label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                <textarea
                  name="descricao"
                  value={formData.descricao || ''}
                  onChange={handleChange}
                  placeholder="Detalhes do lançamento..."
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {/* FUNCIONÁRIO */}
          {currentTipo === 'funcionario' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nome *</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome || ''}
                    onChange={handleChange}
                    placeholder="Ex: João Silva"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">CPF</label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf || ''}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cargo *</label>
                  <input
                    type="text"
                    name="cargo"
                    value={formData.cargo || ''}
                    onChange={handleChange}
                    placeholder="Ex: Tratorista"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Salário Base (R$)</label>
                  <input
                    type="number"
                    name="salario_base"
                    value={formData.salario_base || 0}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Data de Admissão</label>
                  <input
                    type="date"
                    name="data_admissao"
                    value={formData.data_admissao || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </>
          )}

          {/* ALERTA DE ESTOQUE */}
          {currentTipo === 'alerta' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Produto *</label>
                  <select
                    name="produto_id"
                    value={formData.produto_id || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  >
                    <option value="">Selecione um produto</option>
                    {produtos.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Alerta</label>
                  <select
                    name="tipo_alerta"
                    value={formData.tipo_alerta || 'Baixo Estoque'}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    disabled={isSubmitting}
                  >
                    <option value="Crítico">Crítico</option>
                    <option value="Baixo Estoque">Baixo Estoque</option>
                    <option value="Aviso">Aviso</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Reposição">Reposição</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mensagem *</label>
                <textarea
                  name="mensagem"
                  value={formData.mensagem || ''}
                  onChange={handleChange}
                  placeholder="Descrição do alerta..."
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-stone-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
