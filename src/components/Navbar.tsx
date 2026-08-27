import React, { useState } from 'react';
import { ServerLogo } from './ServerLogo';
import { Shield, FileText, Search, Menu, X, ExternalLink, Sparkles } from 'lucide-react';

import { AppView, ApplicationRole } from '../types';

interface NavbarProps {
  currentView: AppView;
  currentRole?: ApplicationRole;
  onNavigate: (view: AppView, role?: ApplicationRole) => void;
  isAdminLoggedIn?: boolean;
  onAdminLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentRole = 'BUILDER',
  onNavigate,
  isAdminLoggedIn = false,
  onAdminLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: AppView, role?: ApplicationRole) => {
    onNavigate(view, role);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Server Name */}
          <button
            id="nav-brand-logo"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3.5 text-left group focus:outline-none transition-transform active:scale-98 cursor-pointer"
          >
            <ServerLogo size="md" />
            <div className="flex flex-col">
              <span className="font-brand font-extrabold text-lg sm:text-xl text-white tracking-wide group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                CL <span className="text-blue-500 font-normal">|</span> BUILDERS Nautic MC
              </span>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Postulaciones Oficiales • Builders & Staff
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-2.5">
            <button
              id="nav-btn-home"
              onClick={() => handleNavClick('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentView === 'home'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Inicio
            </button>

            {/* BUILDER Form CTA */}
            <button
              id="nav-btn-builder-form"
              onClick={() => handleNavClick('form', 'BUILDER')}
              className={`px-3.5 py-2 rounded-lg text-xs lg:text-sm font-extrabold flex items-center gap-1.5 transition-all border cursor-pointer ${
                currentView === 'form' && currentRole === 'BUILDER'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <span>🛠️</span>
              <span>Postular BUILDER</span>
            </button>

            {/* STAFF Form CTA */}
            <button
              id="nav-btn-staff-form"
              onClick={() => handleNavClick('form', 'STAFF')}
              className={`px-3.5 py-2 rounded-lg text-xs lg:text-sm font-extrabold flex items-center gap-1.5 transition-all border cursor-pointer ${
                currentView === 'form' && currentRole === 'STAFF'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30'
                  : 'bg-blue-600/10 text-blue-300 border-blue-500/30 hover:bg-blue-600/20'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Postular STAFF</span>
            </button>

            {/* MIS POSTULACIONES */}
            <button
              id="nav-btn-my-applications"
              onClick={() => handleNavClick('my-applications')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'my-applications'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Mis Postulaciones</span>
            </button>

            <button
              id="nav-btn-status"
              onClick={() => handleNavClick('status')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'status'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Consultar ID</span>
            </button>

            {/* Admin Panel button - Only visible when already logged in as staff */}
            {isAdminLoggedIn && (
              <>
                <button
                  id="nav-btn-admin"
                  onClick={() => handleNavClick('admin')}
                  className={`ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                    currentView === 'admin'
                      ? 'bg-slate-700 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900/80 text-amber-400 border-amber-500/30 hover:border-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Panel Staff</span>
                </button>

                {onAdminLogout && (
                  <button
                    id="nav-btn-admin-logout"
                    onClick={onAdminLogout}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 underline ml-1 cursor-pointer"
                  >
                    Salir
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="nav-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 flex flex-col gap-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              id="mobile-nav-home"
              onClick={() => handleNavClick('home')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                currentView === 'home' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300'
              }`}
            >
              Inicio
            </button>

            {/* Mobile Builder Form */}
            <button
              id="mobile-nav-form-builder"
              onClick={() => handleNavClick('form', 'BUILDER')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-extrabold flex items-center gap-2 border ${
                currentView === 'form' && currentRole === 'BUILDER'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              <span>🛠️</span>
              <span>Postularme como BUILDER (Construcción)</span>
            </button>

            {/* Mobile Staff Form */}
            <button
              id="mobile-nav-form-staff"
              onClick={() => handleNavClick('form', 'STAFF')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-extrabold flex items-center gap-2 border ${
                currentView === 'form' && currentRole === 'STAFF'
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-blue-600/10 text-blue-300 border-blue-500/30'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Postularme como STAFF (Moderación)</span>
            </button>

            {/* Mobile Mis Postulaciones */}
            <button
              id="mobile-nav-my-applications"
              onClick={() => handleNavClick('my-applications')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                currentView === 'my-applications' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Mis Postulaciones</span>
            </button>

            <button
              id="mobile-nav-status"
              onClick={() => handleNavClick('status')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                currentView === 'status' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300'
              }`}
            >
              <Search className="w-4 h-4" />
              Consultar por ID
            </button>

            {isAdminLoggedIn && (
              <>
                <button
                  id="mobile-nav-admin"
                  onClick={() => handleNavClick('admin')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-800 ${
                    currentView === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'text-amber-400'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Panel Administrativo (Conectado)</span>
                </button>

                {onAdminLogout && (
                  <button
                    id="mobile-nav-logout"
                    onClick={() => {
                      onAdminLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400"
                  >
                    Cerrar Sesión de Staff
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
