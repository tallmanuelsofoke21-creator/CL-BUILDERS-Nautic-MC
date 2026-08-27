import React from 'react';
import { ServerLogo } from './ServerLogo';
import { Shield, Sparkles, Heart } from 'lucide-react';

import { AppView } from '../types';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#07090e] border-t border-[#182030] py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-center md:text-left">
            <ServerLogo size="md" />
            <div>
              <span className="font-brand font-extrabold text-lg text-white tracking-wide block">
                CL <span className="text-blue-500">|</span> BUILDERS Nautic MC
              </span>
              <p className="text-xs text-slate-400">
                Sistema Oficial de Reclutamiento y Postulaciones para el Equipo de Staff
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-5 text-xs text-slate-400 font-medium flex-wrap justify-center">
            <button
              onClick={() => {
                onNavigate('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Inicio
            </button>
            <button
              onClick={() => {
                onNavigate('form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Postularme
            </button>
            <button
              onClick={() => {
                onNavigate('my-applications');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-blue-400 text-blue-400 font-semibold transition-colors cursor-pointer"
            >
              Mis Postulaciones
            </button>
            <button
              onClick={() => {
                onNavigate('status');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-blue-400 transition-colors cursor-pointer"
            >
              Consultar ID
            </button>
          </div>
        </div>

        <div className="border-t border-[#131926] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p className="flex items-center gap-1.5">
            <button
              title="Acceso"
              onClick={() => onNavigate('admin')}
              className="hover:text-slate-400 transition-colors cursor-default focus:outline-none"
            >
              ©
            </button>
            <span>{new Date().getFullYear()} CL | BUILDERS Nautic MC. Todos los derechos reservados.</span>
          </p>
          <p className="flex items-center gap-1">
            No afiliado de manera oficial con Mojang AB ni Microsoft.
          </p>
        </div>
      </div>
    </footer>
  );
};
