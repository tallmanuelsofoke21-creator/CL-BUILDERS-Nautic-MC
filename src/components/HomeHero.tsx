import React, { useState } from 'react';
import { ServerLogo } from './ServerLogo';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Mic, 
  Sparkles, 
  Hammer, 
  Shield, 
  Search,
  Wrench,
  Star,
  Clock,
  Radio,
  FileText,
  ChevronRight
} from 'lucide-react';
import { ApplicationRole } from '../types';

interface HomeHeroProps {
  onStartApplication: (role?: ApplicationRole) => void;
  onCheckStatus: () => void;
  onOpenMyApplications?: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  onStartApplication,
  onCheckStatus,
  onOpenMyApplications,
}) => {
  return (
    <div className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
      
      {/* Top Server Branding Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <ServerLogo size="lg" className="hover:scale-105 transition-transform" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brand text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-wide">
                CL <span className="text-blue-500 font-light">|</span> BUILDERS Nautic MC
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Convocatorias Oficiales
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              Portal Oficial de Postulaciones • Construcción (Builders) & Moderación (Staff)
            </p>
          </div>
        </div>

        {/* Quick Check Status & My Applications CTA in Header */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenMyApplications && (
            <button
              id="hero-btn-my-applications"
              onClick={onOpenMyApplications}
              className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white rounded-xl border border-blue-500/40 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Mis Postulaciones</span>
            </button>
          )}

          <button
            id="hero-quick-status-top"
            onClick={onCheckStatus}
            className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Consultar por ID</span>
          </button>
        </div>
      </div>

      {/* Main Grid: DUAL CARDS (BUILDER & STAFF) SIDE BY SIDE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Formularios de Postulación Disponibles</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Selecciona el equipo al que deseas unirte y completa el formulario oficial.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-[#121620] px-3 py-1 rounded-lg border border-[#1e2638] self-start sm:self-auto">
            Ambos formularios activos
          </span>
        </div>

        {/* The 2 Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          
          {/* ========================================================================= */}
          {/* 1. BUILDER FORM CARD (Ambar / Dorado) */}
          {/* ========================================================================= */}
          <div 
            id="card-builder-form"
            className="relative bg-[#121620] border-2 border-amber-500/40 hover:border-amber-500/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-black/50 hover:shadow-amber-500/10 transition-all group overflow-hidden"
          >
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-amber-500/15 transition-all" />

            <div className="relative z-10 space-y-6">
              {/* Badge & Title */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-wider mb-3 shadow-sm">
                  <Hammer className="w-3.5 h-3.5 text-amber-400" />
                  <span>EQUIPO DE CONSTRUCCIÓN</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
                  POSTULACIONES PARA BUILDER
                </h3>
              </div>

              {/* Description */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Estamos en busca de nuevos miembros para el equipo de construccion.
                <br />
                Si eres responsable, comprometido y te apasiona ayudar a la comunidad, esta es tu oportunidad.
              </p>

              {/* Requirements Box (Exact layout from user image) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Requisitos:</span>
                  </span>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    14 Preguntas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200">
                  {/* Req 1 */}
                  <div className="flex items-start gap-2.5 bg-[#0b0e16]/90 p-3.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Tener una edad <strong className="text-white font-semibold">igual o mayor a 12 años</strong>
                    </span>
                  </div>

                  {/* Req 2 */}
                  <div className="flex items-start gap-2.5 bg-[#0b0e16]/90 p-3.5 rounded-xl border border-slate-800">
                    <Mic className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Tener <strong className="text-white font-semibold">micrófono funcional</strong> para comunicación en Discord
                    </span>
                  </div>

                  {/* Req 3 */}
                  <div className="flex items-start gap-2.5 bg-[#0b0e16]/90 p-3.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Manejo de herramientas de construcción (WorldEdit, Axiom, goPaint, etc.)
                    </span>
                  </div>

                  {/* Req 4 */}
                  <div className="flex items-start gap-2.5 bg-[#0b0e16]/90 p-3.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Disponibilidad para trabajar en equipo y construir mapas para la comunidad
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons for Builder */}
            <div className="relative z-10 pt-6 mt-6 border-t border-amber-500/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                id="btn-apply-builder-hero"
                onClick={() => onStartApplication('BUILDER')}
                className="flex-1 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-sm sm:text-base rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>POSTULARME COMO BUILDER</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-status-builder-hero"
                onClick={onCheckStatus}
                className="px-4 py-3.5 bg-[#182030] hover:bg-[#202a40] text-slate-300 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Consultar Estado</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. STAFF FORM CARD (Azul / Moderación) */}
          {/* ========================================================================= */}
          <div 
            id="card-staff-form"
            className="relative bg-[#121620] border-2 border-blue-500/40 hover:border-blue-500/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-black/50 hover:shadow-blue-500/10 transition-all group overflow-hidden"
          >
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-blue-600/15 transition-all" />

            <div className="relative z-10 space-y-6">
              {/* Badge & Title */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-400 text-xs font-black uppercase tracking-wider mb-3 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>EQUIPO DE MODERACIÓN</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
                  POSTULACIONES PARA STAFF
                </h3>
              </div>

              {/* Description */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Estamos en busca de nuevos miembros para el equipo de moderación.
                <br />
                Si eres responsable, comprometido y te apasiona ayudar a la comunidad, esta es tu oportunidad.
              </p>

              {/* Requirements Box (Exact layout from user image) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>Requisitos:</span>
                  </span>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
                    13 Preguntas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200">
                  {/* Req 1 */}
                  <div className="flex items-start gap-2.5 bg-[#0b0e16]/90 p-3.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Tener una edad <strong className="text-white font-semibold">igual o mayor a 16 años</strong> (no vale cumplirlos dentro de poco)
                    </span>
                  </div>

                  {/* Req 2 */}
                  <div className="flex items-start gap-2.5 bg-[#0b0e16]/90 p-3.5 rounded-xl border border-slate-800">
                    <Mic className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Tener <strong className="text-white font-semibold">micrófono funcional</strong> para entrevistas en Discord y comunicación
                    </span>
                  </div>

                  {/* Req 3 */}
                  <div className="flex items-start gap-2.5 bg-[#0b0e16]/90 p-3.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Poseer cuenta de <strong className="text-white font-semibold">Minecraft Premium (Oficial)</strong>
                    </span>
                  </div>

                  {/* Req 4 */}
                  <div className="flex items-start gap-2.5 bg-[#0b0e16]/90 p-3.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white font-semibold">No haber sido sancionado</strong> recientemente en el servidor ni en Discord
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons for Staff */}
            <div className="relative z-10 pt-6 mt-6 border-t border-blue-500/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                id="btn-apply-staff-hero"
                onClick={() => onStartApplication('STAFF')}
                className="flex-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-sm sm:text-base rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>POSTULARME COMO STAFF</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-status-staff-hero"
                onClick={onCheckStatus}
                className="px-4 py-3.5 bg-[#182030] hover:bg-[#202a40] text-slate-300 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Consultar Estado</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Discord Notification Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#5865F2]/10 via-[#10141e] to-[#5865F2]/10 border border-[#5865F2]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-white flex-shrink-0">
            <Radio className="w-5 h-5 text-[#5865F2]" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Notificaciones Automáticas por Discord</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#5865F2] text-white">Activo</span>
            </h4>
            <p className="text-xs text-slate-300">
              Al revisar tu postulación, si eres <strong>Aceptado</strong> o <strong>Rechazado</strong> recibirás una mención y mensaje con los siguientes pasos en el canal oficial de Discord.
            </p>
          </div>
        </div>

        <button
          onClick={onCheckStatus}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-bold whitespace-nowrap transition-all"
        >
          Consultar Estado Online
        </button>
      </div>

      {/* 3 Step Process */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-[#10141e] border border-[#1b2233] p-5 rounded-2xl flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h4 className="text-white font-bold text-base">Completa tu Formulario</h4>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Elige entre <strong>Builder</strong> (14 preguntas) o <strong>Staff</strong> (13 preguntas) y responde con máxima sinceridad.
          </p>
        </div>

        <div className="bg-[#10141e] border border-[#1b2233] p-5 rounded-2xl flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h4 className="text-white font-bold text-base">Evaluación Directiva</h4>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            El equipo directivo examina tus respuestas, antecedentes y portafolio en el panel administrativo.
          </p>
        </div>

        <div className="bg-[#10141e] border border-[#1b2233] p-5 rounded-2xl flex flex-col gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h4 className="text-white font-bold text-base">Resolución en Discord</h4>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Recibirás el aviso en Discord con cita para entrevista de voz (Staff) o prueba en parcela creativa (Builder).
          </p>
        </div>
      </div>

    </div>
  );
};
