import React from 'react';
import { LogOut, LayoutDashboard, Package, Wallet, Users, Bell, User, X, Leaf, ClipboardList } from 'lucide-react';

export default function Sidebar({
  role,
  userName,
  onLogout,
  activeSection,
  onNavigate,
  mobileOpen,
  onCloseMenu
}) {
  const isAdmin = role === 'ADMIN';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'estoque', label: 'Estoque', icon: Package, show: true },
    { id: 'alertas', label: 'Alertas', icon: Bell, show: true },
    { id: 'safras', label: 'Safras', icon: Leaf, show: true },
    { id: 'ordens-aplicacao', label: 'Ordens de Aplicação', icon: ClipboardList, show: true },
    { id: 'financeiro', label: 'Financeiro', icon: Wallet, show: isAdmin },
    { id: 'rh', label: 'Recursos Humanos', icon: Users, show: isAdmin },
  ];

  const handleNavigate = (id) => {
    onNavigate && onNavigate(id);
    // Fecha o drawer no mobile após navegar
    onCloseMenu && onCloseMenu();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Logo/Title */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-emerald-800 font-bold text-xl">Agro-BI</h2>
          <p className="text-slate-500 text-xs mt-1">Sistema de Gestão</p>
        </div>
        {/* Botão fechar no mobile */}
        <button
          onClick={onCloseMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-stone-100 transition"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="mb-6 p-3 bg-stone-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {userName || 'Usuário'}
            </p>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isAdmin
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
          <LayoutDashboard className="w-4 h-4" />
          Menu
        </h3>
        <nav className="space-y-1">
          {navItems.filter(item => item.show).map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-600 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>



      {/* Footer + Logout */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
        <div className="mt-4 text-xs text-slate-500 text-center">
          <p>Sistema de Gestão Agrícola</p>
          <p className="mt-1">Desenvolvido com React + Tailwind</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ===== DESKTOP: Sidebar fixa à esquerda ===== */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 shadow-sm p-6 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* ===== MOBILE: Drawer lateral (menu hambúrguer) ===== */}
      <>
        {/* Overlay escuro */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onCloseMenu}
            aria-hidden="true"
          />
        )}

        {/* Drawer deslizante */}
        <div
          className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300 md:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </>
</>
  );
}
