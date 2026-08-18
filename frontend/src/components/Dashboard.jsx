import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Users, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { apiFetch } from '../auth';
import { formatarMoeda } from '../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [metricas, setMetricas] = useState(null);
  const [fluxoCaixa, setFluxoCaixa] = useState(null);
  const [topProdutos, setTopProdutos] = useState([]);
  const [alertasAtivos, setAlertasAtivos] = useState(null);
  const [funcionariosAtivos, setFuncionariosAtivos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar métricas BI
      const metRes = await apiFetch(`${API_URL}/api/bi/metricas`);
      if (metRes.ok) setMetricas(await metRes.json());

      // Carregar fluxo de caixa (6 meses)
      const fluxRes = await apiFetch(`${API_URL}/api/bi/grafico-fluxo-caixa?meses=6`);
      if (fluxRes.ok) setFluxoCaixa(await fluxRes.json());

      // Carregar alertas resumo
      const alertasRes = await apiFetch(`${API_URL}/api/bi/alertas-resumo`);
      if (alertasRes.ok) setAlertasAtivos(await alertasRes.json());

      // Carregar top 3 produtos
      const prodRes = await apiFetch(`${API_URL}/api/produtos`);
      if (prodRes.ok) {
        const produtos = await prodRes.json();
        const topTres = produtos
          .map(p => ({
            ...p,
            valorTotal: p.estoque_atual * p.preco_custo
          }))
          .sort((a, b) => b.valorTotal - a.valorTotal)
          .slice(0, 3);
        setTopProdutos(topTres);
      }

      // Carregar funcionários ativos
      const funcRes = await apiFetch(`${API_URL}/api/funcionarios`);
      if (funcRes.ok) {
        const funcionarios = await funcRes.json();
        setFuncionariosAtivos(funcionarios.length);
      }

      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
      setLoading(false);
      console.error('Erro ao carregar dados:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-3"></div>
            <p className="text-slate-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-emerald-800">Dashboard Executivo</h1>
        <p className="text-slate-600 mt-1">Visão completa do seu negócio agrícola</p>
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

      {/* Seção 1: Métricas Principais (4 cards) */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Faturamento Estimado */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Faturamento Estimado</p>
                <p className="text-2xl font-bold text-emerald-700 mt-2">
                  {formatarMoeda(metricas.faturamento_estimado)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-700" />
            </div>
          </div>

          {/* Card 2: Lucro Estimado */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Lucro Estimado</p>
                <p className="text-2xl font-bold text-emerald-700 mt-2">
                  {formatarMoeda(metricas.lucro_estimado)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-700" />
            </div>
          </div>

          {/* Card 3: Margem de Lucro */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Margem de Lucro Média</p>
                <p className="text-2xl font-bold text-amber-700 mt-2">
                  {metricas.margem_lucro_media.toFixed(2)}%
                </p>
              </div>
              <Package className="w-8 h-8 text-amber-700" />
            </div>
          </div>

          {/* Card 4: Custo por Hectare */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Custo por Hectare</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">
                  {formatarMoeda(metricas.custo_por_hectare)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-slate-600" />
            </div>
          </div>
        </div>
      )}

      {/* Seção 2: Fluxo de Caixa 6 Meses */}
      {fluxoCaixa && fluxoCaixa.labels && fluxoCaixa.labels.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-emerald-800 mb-4">Fluxo de Caixa - Últimos 6 Meses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fluxoCaixa.labels.map((label, i) => ({
              mes: label,
              saldo: fluxoCaixa.valores[i]
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => formatarMoeda(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="#047857" 
                strokeWidth={2} 
                dot={{ fill: '#047857', r: 5 }}
                name="Saldo"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Seção 3: Grid com 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Top 3 Produtos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-4">Top 3 Produtos (por Valor)</h3>
          
          {topProdutos.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhum produto disponível</p>
          ) : (
            <div className="space-y-3">
              {topProdutos.map((produto, idx) => (
                <div key={produto.id} className="p-3 bg-stone-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{idx + 1}. {produto.nome}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {parseFloat(produto.estoque_atual).toLocaleString('pt-BR')} un.
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-700">
                      {formatarMoeda(produto.valorTotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna 2: Alertas Ativos */}
        {alertasAtivos && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-emerald-800 mb-4">Resumo de Alertas</h3>
            
            <div className="space-y-4">
              {/* Alertas Pendentes */}
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-700 text-sm font-medium">Alertas Pendentes</p>
                <p className="text-3xl font-bold text-red-700 mt-2">
                  {alertasAtivos.alertas_nao_resolvidos}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  de {alertasAtivos.alertas_total} total
                </p>
              </div>

              {/* Produtos em Falta */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-amber-700 text-sm font-medium">Produtos em Falta</p>
                <p className="text-3xl font-bold text-amber-700 mt-2">
                  {alertasAtivos.produtos_baixo_estoque}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  abaixo do mínimo
                </p>
              </div>

              {/* Taxa de Resolução */}
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-emerald-700 text-sm font-medium">Taxa de Resolução</p>
                <p className="text-3xl font-bold text-emerald-700 mt-2">
                  {alertasAtivos.alertas_total > 0 
                    ? Math.round(((alertasAtivos.alertas_total - alertasAtivos.alertas_nao_resolvidos) / alertasAtivos.alertas_total) * 100)
                    : 0
                  }%
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  alertas resolvidos
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Coluna 3: Info Funcionários e Estoque */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-4">Resumo Operacional</h3>
          
          <div className="space-y-4">
            {/* Funcionários Ativos */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-700" />
                <div>
                  <p className="text-blue-700 text-sm font-medium">Funcionários Ativos</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {funcionariosAtivos}
                  </p>
                </div>
              </div>
            </div>

            {/* Investimento em Estoque */}
            {metricas && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-purple-700" />
                  <div>
                    <p className="text-purple-700 text-sm font-medium">Investimento Total em Estoque</p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">
                      {formatarMoeda(metricas.total_estoque_custo)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Geral */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700 text-sm font-medium">Status Geral</p>
              <p className="text-lg font-bold text-green-700 mt-2">
                ✓ Sistema Operacional
              </p>
              <p className="text-xs text-green-600 mt-1">
                Todos os dados atualizados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-slate-500 py-4">
        <p>Último carregamento: {new Date().toLocaleTimeString('pt-BR')}</p>
        <Link to="/privacidade" className="inline-block mt-2 text-emerald-700 hover:text-emerald-800 underline underline-offset-2">
          Política de Privacidade
        </Link>
      </div>
    </div>
  );
}
