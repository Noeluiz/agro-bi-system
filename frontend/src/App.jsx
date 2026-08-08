import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, Package, TrendingUp, DollarSign, Users, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MetricCard from './components/MetricCard';
import ProductTable from './components/ProductTable';
import AlertsTable from './components/AlertsTable';
import Login from './components/Login';
import { getToken, getRole, getUserName, isAuthenticated, logout, apiFetch } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [autenticado, setAutenticado] = useState(isAuthenticated());
  const [role, setRole] = useState(getRole());
  const [userName, setUserName] = useState(getUserName());
  const [activeSection, setActiveSection] = useState('estoque');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [metricas, setMetricas] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [faturamentoData, setFaturamentoData] = useState([]);
  const [investimentoData, setInvestimentoData] = useState([]);
  const [fluxoCaixaData, setFluxoCaixaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [filtroFornecedor, setFiltroFornecedor] = useState(null);
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    if (autenticado) {
      carregarDados();
    }
  }, [autenticado, filtroCategoria, filtroFornecedor]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar categorias
      const catRes = await apiFetch(`${API_URL}/api/categorias`);
      if (catRes.ok) setCategorias(await catRes.json());

      // Carregar fornecedores
      const fornRes = await apiFetch(`${API_URL}/api/fornecedores`);
      if (fornRes.ok) setFornecedores(await fornRes.json());

      // Carregar produtos com filtros
      let prodUrl = `${API_URL}/api/produtos`;
      if (filtroCategoria || filtroFornecedor) {
        const params = new URLSearchParams();
        if (filtroCategoria) params.append('categoria_id', filtroCategoria);
        if (filtroFornecedor) params.append('fornecedor_id', filtroFornecedor);
        prodUrl += '?' + params.toString();
      }
      const prodRes = await apiFetch(prodUrl);
      if (prodRes.ok) setProdutos(await prodRes.json());

      // Carregar alertas
      const alertasRes = await apiFetch(`${API_URL}/api/alertas-estoque?resolvido=false`);
      if (alertasRes.ok) setAlertas(await alertasRes.json());

      // Carregar dados financeiros apenas para ADMIN
      if (isAdmin) {
        // Carregar métricas
        const metRes = await apiFetch(`${API_URL}/api/bi/metricas`);
        if (metRes.ok) setMetricas(await metRes.json());

        // Carregar faturamento por categoria
        const fatRes = await apiFetch(`${API_URL}/api/bi/faturamento-por-categoria`);
        if (fatRes.ok) setFaturamentoData(await fatRes.json());

        // Carregar investimento em estoque
        const invRes = await apiFetch(`${API_URL}/api/bi/investimento-estoque`);
        if (invRes.ok) setInvestimentoData(await invRes.json());

        // Carregar fluxo de caixa
        const fluxRes = await apiFetch(`${API_URL}/api/bi/grafico-fluxo-caixa?meses=6`);
        if (fluxRes.ok) setFluxoCaixaData(await fluxRes.json());
      }

      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
      setLoading(false);
      console.error(err);
    }
  };

  const handleLogin = (dados) => {
    setAutenticado(true);
    setRole(dados.role);
    setUserName(dados.nome);
  };

  const handleLogout = async () => {
    await logout();
    setAutenticado(false);
    setRole('GERENTE');
    setUserName('');
    setMetricas(null);
    setProdutos([]);
    setAlertas([]);
    setFaturamentoData([]);
    setInvestimentoData([]);
    setFluxoCaixaData([]);
    setMobileMenuOpen(false);
  };

  const exportarCSV = () => {
    if (produtos.length === 0) {
      alert('Nenhum produto para exportar');
      return;
    }

    const headers = ['ID', 'Nome', 'Categoria', 'Fornecedor', 'Estoque Atual', 'Preço Custo', 'Preço Venda', 'Unidade'];
    const rows = produtos.map(p => [
      p.id,
      p.nome,
      p.categoria?.nome || '',
      p.fornecedor?.nome || '',
      p.estoque_atual,
      p.preco_custo,
      p.preco_venda,
      p.unidade_medida
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produtos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleNavigate = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  // Se não autenticado, exibe a tela de login
  if (!autenticado) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50">
      {/* Sidebar: fixa no desktop, drawer no mobile */}
      <Sidebar
        categorias={categorias}
        fornecedores={fornecedores}
        filtroCategoria={filtroCategoria}
        filtroFornecedor={filtroFornecedor}
        setFiltroCategoria={setFiltroCategoria}
        setFiltroFornecedor={setFiltroFornecedor}
        dataInicio={dataInicio}
        dataFim={dataFim}
        setDataInicio={setDataInicio}
        setDataFim={setDataFim}
        onExportar={exportarCSV}
        role={role}
        userName={userName}
        onLogout={handleLogout}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        mobileOpen={mobileMenuOpen}
        onCloseMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg m-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Dashboard Header - responsivo */}
        <div className="p-4 md:p-6 bg-white border-b border-slate-200">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Botão hambúrguer no mobile */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-stone-100 transition border border-slate-200"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-bold text-emerald-800 truncate">Agro-BI Dashboard</h1>
                <p className="text-slate-600 mt-1 text-xs md:text-sm">Gestão Agrícola e Business Intelligence</p>
              </div>
            </div>
            <button
              onClick={carregarDados}
              className="px-3 md:px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition text-sm shrink-0"
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* Renderização condicional por role */}
        {(() => {
          switch (activeSection) {
            case 'financeiro':
              return (
                <div className="p-4 md:p-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Financeiro</h3>
                    <p className="text-slate-600">Módulo financeiro em construção.</p>
                  </div>
                </div>
              );
            case 'rh':
              return (
                <div className="p-4 md:p-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Recursos Humanos</h3>
                    <p className="text-slate-600">Módulo de RH em construção.</p>
                  </div>
                </div>
              );
            case 'alertas':
              return (
                <div className="p-4 md:p-6">
                  <AlertsTable alertas={alertas} />
                </div>
              );
            case 'estoque':
            default:
              return (
                <>
                  {/* Metrics Cards - apenas ADMIN - grid adaptável */}
                  {isAdmin && metricas && (
                    <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        icon={<DollarSign className="w-6 h-6" />}
                        title="Faturamento Estimado"
                        value={`R$ ${Number(metricas?.faturamento_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        color="emerald"
                      />
                      <MetricCard
                        icon={<TrendingUp className="w-6 h-6" />}
                        title="Lucro Estimado"
                        value={`R$ ${Number(metricas?.lucro_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        color="emerald"
                      />
                      <MetricCard
                        icon={<Package className="w-6 h-6" />}
                        title="Margem de Lucro Média"
                        value={`${Number(metricas?.margem_lucro_media || 0).toFixed(2)}%`}
                        color="amber"
                      />
                      <MetricCard
                        icon={<Users className="w-6 h-6" />}
                        title="Custo por Hectare"
                        value={`R$ ${Number(metricas?.custo_por_hectare || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        color="emerald"
                      />
                    </div>
                  )}

                  {/* Charts - apenas ADMIN (financeiro) - responsivo: empilha no mobile */}
                  {isAdmin && (
                    <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6">
                      {/* Faturamento por Categoria */}
                      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribuição de Faturamento</h3>
                        {faturamentoData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={faturamentoData.map(d => ({
                                  name: d.categoria,
                                  value: parseFloat(d.valor)
                                }))}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#047857"
                                dataKey="value"
                              >
                                {faturamentoData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'][index % 6]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-slate-500 text-center py-8">Sem dados disponíveis</p>
                        )}
                      </div>

                      {/* Investimento em Estoque */}
                      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Investimento Acumulado em Estoque</h3>
                        {investimentoData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={investimentoData.map(d => ({
                              name: d.categoria,
                              value: parseFloat(d.valor_total)
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                              <YAxis />
                              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                              <Bar dataKey="value" fill="#047857" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-slate-500 text-center py-8">Sem dados disponíveis</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fluxo de Caixa Chart - apenas ADMIN */}
                  {isAdmin && fluxoCaixaData && fluxoCaixaData.labels && fluxoCaixaData.labels.length > 0 && (
                    <div className="p-4 md:p-6">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Fluxo de Caixa (6 Últimos Meses)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={fluxoCaixaData.labels.map((label, i) => ({
                            mes: label,
                            saldo: Number(fluxoCaixaData.valores[i] || 0)
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                            <Legend />
                            <Line type="monotone" dataKey="saldo" stroke="#047857" strokeWidth={2} dot={{ fill: '#047857', r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Products Table - acessível para ADMIN e GERENTE */}
                  <div className="p-4 md:p-6">
                    <ProductTable produtos={produtos} />
                  </div>

                  {/* Alerts Table - acessível para ADMIN e GERENTE */}
                  <div className="p-4 md:p-6">
                    <AlertsTable alertas={alertas} />
                  </div>
                </>
              );
          }
        })()}
      </div>
    </div>
  );
}

export default App;
