import { useEffect, useState } from 'react';
import { AlertCircle, LogOut, Menu, User } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import RH from './components/RH';
import Financeiro from './components/Financeiro';
import Estoque from './components/Estoque';
import Alertas from './components/Alertas';
import NotFound from './components/NotFound';
import Privacidade from './components/Privacidade';
import Safras from './components/Safras';
import DetalhesSafra from './components/DetalhesSafra';
import OrdensAplicacao from './components/OrdensAplicacao';
import NovaOrdemAplicacao from './components/NovaOrdemAplicacao';
import { getRole, getUserName, isAuthenticated, logout } from './auth';

function Sistema({ role, userName, onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error] = useState(null);
  const [safraId, setSafraId] = useState(null);
  const [ordemView, setOrdemView] = useState('list');

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleNavigate = (section) => {
    setActiveSection(section);
    setSafraId(null);
    if (section === 'ordens-aplicacao') setOrdemView('list');
    setMobileMenuOpen(false);
  };

  const handleSelectSafra = (id) => {
    setSafraId(id);
  };

  const handleBackFromSafra = () => {
    setSafraId(null);
  };

  const renderSection = () => {
    // Se estamos vendo detalhes de uma safra específica
    if (safraId !== null) {
      return <DetalhesSafra safraId={safraId} onBack={handleBackFromSafra} />;
    }

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'estoque':
        return <Estoque />;
      case 'alertas':
        return <Alertas />;
      case 'safras':
        return <Safras onSelectSafra={handleSelectSafra} />;
      case 'ordens-aplicacao':
        return ordemView === 'create'
          ? <NovaOrdemAplicacao onBack={() => setOrdemView('list')} onCreated={() => setOrdemView('list')} />
          : <OrdensAplicacao onNovaOrdem={() => setOrdemView('create')} />;
      case 'financeiro':
        return role === 'ADMIN' ? <Financeiro /> : <AcessoNegado />;
      case 'rh':
        return role === 'ADMIN' ? <RH /> : <AcessoNegado />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto mb-4" />
          <p className="text-slate-600">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar
        role={role}
        userName={userName}
        onLogout={onLogout}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        mobileOpen={mobileMenuOpen}
        onCloseMenu={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg m-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              {error}
            </div>
          </div>
        )}

        <div className="p-4 md:p-6 bg-white border-b border-slate-200">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-stone-100 transition border border-slate-200"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-bold text-emerald-800 truncate">Agro-BI System</h1>
                <p className="text-slate-600 mt-1 text-xs md:text-sm">Gestão Agrícola Inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" aria-hidden="true" />
                <span className="max-w-36 truncate">{userName || 'Usuário'}</span>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition"
                aria-label="Sair do sistema"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">{renderSection()}</div>
      </main>
    </div>
  );
}

function AcessoNegado() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <p className="text-red-700 font-medium">Acesso negado. Apenas administradores podem acessar este módulo.</p>
    </div>
  );
}

function App() {
  const [autenticado, setAutenticado] = useState(isAuthenticated());
  const [role, setRole] = useState(getRole());
  const [userName, setUserName] = useState(getUserName());

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
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={autenticado ? '/dashboard' : '/login'} replace />} />
      <Route
        path="/login"
        element={autenticado ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
      />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route
        path="/dashboard"
        element={autenticado ? <Sistema role={role} userName={userName} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<NotFound autenticado={autenticado} />} />
    </Routes>
  );
}

export default App;
