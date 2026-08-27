import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  Shield, 
  Hammer, 
  Lock, 
  LogOut, 
  Sparkles, 
  HelpCircle, 
  Eye, 
  AlertCircle, 
  UserCheck, 
  ExternalLink,
  ChevronRight,
  Radio,
  PlusCircle
} from 'lucide-react';
import { ApplicationItem, ApplicationRole, MyApplicationsResponse } from '../types';
import { MyApplicationDetailModal } from './MyApplicationDetailModal';

interface MyApplicationsViewProps {
  onBackToHome: () => void;
  onApplyNew: (role?: ApplicationRole) => void;
}

export const MyApplicationsView: React.FC<MyApplicationsViewProps> = ({
  onBackToHome,
  onApplyNew,
}) => {
  // Authentication & Session
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nautic_applicant_token'));
  const [discordId, setDiscordId] = useState<string>(() => localStorage.getItem('nautic_applicant_discord_id') || '');
  const [discordUsername, setDiscordUsername] = useState<string>(() => localStorage.getItem('nautic_applicant_discord_user') || '');

  // Login Form State (when not authenticated)
  const [inputDiscordId, setInputDiscordId] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [inputAppId, setInputAppId] = useState('');
  const [loginMethod, setLoginMethod] = useState<'direct' | 'pin' | 'appid'>('direct');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showDiscordHelp, setShowDiscordHelp] = useState(false);

  // Applications Data State
  const [inReview, setInReview] = useState<ApplicationItem[]>([]);
  const [history, setHistory] = useState<ApplicationItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Detail Modal
  const [selectedApplication, setSelectedApplication] = useState<ApplicationItem | null>(null);

  // Auto-refetch polling ref
  const pollingIntervalRef = useRef<any>(null);

  // 1. Check & fetch on token change
  useEffect(() => {
    if (token) {
      fetchMyApplications(false);
      // Start auto-sync polling every 6 seconds for live state change reflection
      pollingIntervalRef.current = setInterval(() => {
        fetchMyApplications(true);
      }, 6000);
    } else {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [token]);

  const fetchMyApplications = async (isBackground = false) => {
    if (!token) return;
    if (!isBackground) setDataLoading(true);
    setDataError(null);

    try {
      const res = await fetch('/api/applicant/my-applications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Token invalid or expired
          handleLogout();
          return;
        }
        throw new Error('No se pudieron obtener las postulaciones.');
      }

      const data: MyApplicationsResponse & { total_count?: number } = await res.json();
      setInReview(data.in_review || []);
      setHistory(data.history || []);
      setTotalCount(data.total_count !== undefined ? data.total_count : (data.in_review?.length || 0) + (data.history?.length || 0));
      if (data.discord_username) {
        setDiscordUsername(data.discord_username);
        localStorage.setItem('nautic_applicant_discord_user', data.discord_username);
      }
      if (data.discord_id) {
        setDiscordId(data.discord_id);
        localStorage.setItem('nautic_applicant_discord_id', data.discord_id);
      }
    } catch (err: any) {
      if (!isBackground) {
        setDataError('Error al conectar con el servidor. Verifica tu conexión.');
      }
    } finally {
      if (!isBackground) setDataLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchMyApplications(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanId = inputDiscordId.trim();
    if (!cleanId) {
      setLoginError('Por favor ingresa tu Discord ID numérico (ej: 492019384729103841).');
      return;
    }

    if (!/^\d{16,21}$/.test(cleanId)) {
      setLoginError('El Discord ID debe ser numérico de 17 a 20 dígitos.');
      return;
    }

    setLoginLoading(true);

    try {
      const payload: Record<string, string> = { discord_id: cleanId };
      if (loginMethod === 'pin' && inputPin.trim()) payload.pin = inputPin.trim();
      if (loginMethod === 'appid' && inputAppId.trim()) payload.application_id = inputAppId.trim();

      const res = await fetch('/api/applicant/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Error al validar tus credenciales de Discord.');
      } else {
        localStorage.setItem('nautic_applicant_token', data.token);
        localStorage.setItem('nautic_applicant_discord_id', data.discord_id);
        localStorage.setItem('nautic_applicant_discord_user', data.discord_username || `Discord_${data.discord_id.slice(-4)}`);
        
        setToken(data.token);
        setDiscordId(data.discord_id);
        setDiscordUsername(data.discord_username || `Discord_${data.discord_id.slice(-4)}`);
      }
    } catch (err) {
      setLoginError('Error de red al intentar autenticar. Inténtalo nuevamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nautic_applicant_token');
    localStorage.removeItem('nautic_applicant_discord_id');
    localStorage.removeItem('nautic_applicant_discord_user');
    setToken(null);
    setDiscordId('');
    setDiscordUsername('');
    setInReview([]);
    setHistory([]);
    setTotalCount(0);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // =========================================================================
  // VIEW A: NOT LOGGED IN / IDENTIFICATION FORM
  // =========================================================================
  if (!token) {
    return (
      <div className="py-8 sm:py-14 max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <button
          id="btn-back-home-login"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white mb-6 group transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Inicio</span>
        </button>

        {/* Main Identification Box */}
        <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          {/* Heading */}
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              Portal del Postulante
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Mis Postulaciones
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Identifícate con tu <strong className="text-slate-200">Discord ID</strong> para consultar el estado en revisión y el historial de tus postulaciones en <strong className="text-blue-400">CL | BUILDERS Nautic MC</strong>.
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-[#0b0e16] border border-slate-800/90 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-200">Acceso Seguro y Privado:</strong> Tus respuestas y datos están protegidos. Solo tú puedes acceder a tus postulaciones mediante tu identidad de Discord.
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
            {/* Discord ID Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Tu Discord ID (Numérico) *</span>
                <button
                  type="button"
                  onClick={() => setShowDiscordHelp(!showDiscordHelp)}
                  className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>¿Cómo obtener mi ID?</span>
                </button>
              </label>
              <div className="relative">
                <input
                  id="applicant-discord-id-input"
                  type="text"
                  value={inputDiscordId}
                  onChange={(e) => setInputDiscordId(e.target.value)}
                  placeholder="Ej: 492019384729103841"
                  className="w-full bg-[#080a10] border border-[#222c3f] focus:border-blue-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 font-mono text-sm outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Optional Verification Method Tabs */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
                <span>Método de verificación:</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLoginMethod('direct')}
                  className={`py-2 px-2.5 rounded-lg border transition-all cursor-pointer ${
                    loginMethod === 'direct'
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                      : 'bg-[#080a10] text-slate-400 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  Identificación Rápida
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('pin')}
                  className={`py-2 px-2.5 rounded-lg border transition-all cursor-pointer ${
                    loginMethod === 'pin'
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                      : 'bg-[#080a10] text-slate-400 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  Código PIN (6 dígitos)
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('appid')}
                  className={`py-2 px-2.5 rounded-lg border transition-all cursor-pointer ${
                    loginMethod === 'appid'
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                      : 'bg-[#080a10] text-slate-400 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  ID de Postulación
                </button>
              </div>
            </div>

            {loginMethod === 'pin' && (
              <div className="space-y-1.5 pt-1 animate-in fade-in">
                <label className="text-xs font-bold text-slate-300">
                  PIN de Seguridad de tu Postulación (6 dígitos)
                </label>
                <input
                  id="applicant-pin-input"
                  type="text"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  placeholder="Ej: 849201"
                  maxLength={6}
                  className="w-full bg-[#080a10] border border-[#222c3f] focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono text-sm outline-none"
                />
              </div>
            )}

            {loginMethod === 'appid' && (
              <div className="space-y-1.5 pt-1 animate-in fade-in">
                <label className="text-xs font-bold text-slate-300">
                  ID de alguna postulación anterior
                </label>
                <input
                  id="applicant-appid-input"
                  type="text"
                  value={inputAppId}
                  onChange={(e) => setInputAppId(e.target.value)}
                  placeholder="Ej: CL-STF-84921 o CL-BLD-92140"
                  className="w-full bg-[#080a10] border border-[#222c3f] focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono text-sm outline-none"
                />
              </div>
            )}

            {/* How to get Discord ID guide accordion */}
            {showDiscordHelp && (
              <div className="p-4 bg-[#080a10] border border-blue-500/30 rounded-xl text-xs text-slate-300 space-y-2 animate-in fade-in duration-150">
                <h4 className="font-bold text-blue-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  ¿Cómo copiar tu Discord ID?
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                  <li>En Discord ve a <strong>Ajustes de Usuario ⚙️ &gt; Avanzado</strong>.</li>
                  <li>Activa la opción <strong>"Modo Desarrollador"</strong>.</li>
                  <li>Haz clic derecho sobre tu propio perfil (o presiona los 3 puntos en móvil).</li>
                  <li>Selecciona <strong>"Copiar ID de Usuario"</strong> y pégalo aquí.</li>
                </ol>
              </div>
            )}

            {/* Error message */}
            {loginError && (
              <div
                id="applicant-login-error"
                className="p-3.5 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="applicant-btn-login-submit"
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
            >
              {loginLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Consultar Mis Postulaciones</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom hint to apply if never applied */}
          <div className="border-t border-[#1e2638] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>¿Aún no has enviado ninguna postulación?</span>
            <button
              id="btn-go-apply-from-myapps"
              onClick={() => onApplyNew('BUILDER')}
              className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
            >
              Postular ahora (Builder o Staff)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: AUTHENTICATED PORTAL (EN REVISIÓN + HISTORIAL)
  // =========================================================================
  const hasNoApplicationsAtAll = inReview.length === 0 && history.length === 0 && !dataLoading;

  return (
    <div className="py-6 sm:py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in">
      
      {/* Top Header with User Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2638] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Portal del Postulante • CL | BUILDERS Nautic MC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Mis Postulaciones</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold">
              {totalCount} {totalCount === 1 ? 'registro' : 'registros'}
            </span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
            <span>Identificado como: <strong className="text-white">{discordUsername}</strong></span>
            <span>•</span>
            <span className="font-mono text-slate-300 bg-[#121622] px-2 py-0.5 rounded border border-slate-800">
              ID: {discordId}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Sync Status Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-[#10141f] px-3 py-2 rounded-xl border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Sincronización en vivo</span>
          </div>

          {/* Refresh Button */}
          <button
            id="btn-refresh-my-apps"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2.5 bg-[#121622] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refrescar postulaciones"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* New Application Button */}
          <button
            id="btn-apply-new-header"
            onClick={() => onApplyNew('BUILDER')}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Postulación</span>
          </button>

          {/* Logout / Switch Account Button */}
          <button
            id="btn-logout-applicant"
            onClick={handleLogout}
            className="p-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cerrar sesión de postulante"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {dataLoading && !refreshing && (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Cargando tus postulaciones...</p>
        </div>
      )}

      {/* Error Alert */}
      {dataError && (
        <div className="p-4 bg-rose-950/60 border border-rose-600/40 rounded-xl text-rose-200 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{dataError}</span>
        </div>
      )}

      {/* OVERALL EMPTY STATE (Never submitted) */}
      {hasNoApplicationsAtAll && (
        <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              No has realizado ninguna postulación todavía.
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              ¿Deseas formar parte de nuestro equipo de Construcción o Moderación? Completa el formulario oficial para comenzar.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="btn-empty-apply-builder"
              onClick={() => onApplyNew('BUILDER')}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
            >
              <span>🛠️</span>
              <span>REALIZAR POSTULACIÓN (BUILDER)</span>
            </button>
            <button
              id="btn-empty-apply-staff"
              onClick={() => onApplyNew('STAFF')}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>REALIZAR POSTULACIÓN (STAFF)</span>
            </button>
          </div>
        </div>
      )}

      {!hasNoApplicationsAtAll && (
        <div className="space-y-10">
          
          {/* ========================================================================= */}
          {/* 1. SECCIÓN: POSTULACIONES EN REVISIÓN (PENDIENTE) */}
          {/* ========================================================================= */}
          <section id="seccion-en-revision" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                  Postulaciones en revisión
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
                  {inReview.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Pendientes de evaluación directiva
              </span>
            </div>

            {inReview.length === 0 ? (
              /* Empty state: No pending applications */
              <div className="bg-[#121620]/60 border border-[#1e2638] rounded-2xl p-6 sm:p-8 text-center space-y-2">
                <p className="text-base sm:text-lg font-bold text-slate-200 flex items-center justify-center gap-2">
                  <span>🎉</span>
                  <span>No tienes postulaciones pendientes.</span>
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Todas tus solicitudes han sido evaluadas por el equipo o aún no has enviado una nueva.
                </p>
              </div>
            ) : (
              /* In-Review Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {inReview.map((app) => {
                  const isBld = app.role === 'BUILDER';
                  return (
                    <div
                      key={app.id}
                      className="bg-[#121620] border-2 border-amber-500/40 hover:border-amber-500/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl space-y-5 transition-all group hover:shadow-amber-500/10"
                    >
                      <div className="space-y-3.5">
                        {/* Header: ID + Role */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-base font-black text-white">
                            Postulación #{app.id}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isBld 
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                              : 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                          }`}>
                            {isBld ? <Hammer className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {isBld ? 'BUILDER' : 'STAFF'}
                          </span>
                        </div>

                        {/* Minecraft & Discord Row */}
                        <div className="bg-[#0b0e16] p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Minecraft:</span>
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://mc-heads.net/avatar/${encodeURIComponent(app.minecraft_username)}/20`}
                                alt="Skin"
                                className="w-5 h-5 rounded bg-slate-800"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                              <strong className="text-white">{app.minecraft_username}</strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                            <span className="text-slate-400">Discord:</span>
                            <span className="text-slate-200">{app.discord_username}</span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                            <span className="text-slate-400">Enviada:</span>
                            <span className="text-slate-300 font-medium">{formatDate(app.created_at)}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="pt-1 flex items-center justify-between">
                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-wider shadow-sm">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            <span>🟡 EN REVISIÓN</span>
                          </div>
                          <span className="text-[11px] text-amber-300/80 font-medium">
                            En espera de resolución
                          </span>
                        </div>
                      </div>

                      {/* Action: Ver Postulación */}
                      <button
                        id={`btn-view-pending-${app.id}`}
                        onClick={() => setSelectedApplication(app)}
                        className="w-full py-2.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:bg-amber-500/20 group-hover:text-amber-300 group-hover:border-amber-500/40 border border-transparent"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver postulación</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* 2. SECCIÓN: HISTORIAL DE POSTULACIONES (ACEPTADAS / RECHAZADAS) */}
          {/* ========================================================================= */}
          <section id="seccion-historial" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                  Historial de postulaciones
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
                  {history.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Ordenado desde la más reciente a la más antigua
              </span>
            </div>

            {history.length === 0 ? (
              /* Empty state: No history yet */
              <div className="bg-[#121620]/60 border border-[#1e2638] rounded-2xl p-6 sm:p-8 text-center space-y-2">
                <p className="text-base font-bold text-slate-300">
                  Todavía no tienes postulaciones anteriores.
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Aquí aparecerán todas las postulaciones que hayan sido aceptadas o rechazadas tras la revisión del Staff.
                </p>
              </div>
            ) : (
              /* History Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {history.map((app) => {
                  const isAccepted = app.status === 'ACEPTADA';
                  const isBld = app.role === 'BUILDER';
                  return (
                    <div
                      key={app.id}
                      className={`bg-[#121620] border-2 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl space-y-5 transition-all group ${
                        isAccepted 
                          ? 'border-emerald-500/40 hover:border-emerald-500/80 hover:shadow-emerald-500/10' 
                          : 'border-rose-500/40 hover:border-rose-500/80 hover:shadow-rose-500/10'
                      }`}
                    >
                      <div className="space-y-3.5">
                        {/* Header: ID + Role */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-base font-black text-white">
                            Postulación #{app.id}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isBld 
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                              : 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                          }`}>
                            {isBld ? <Hammer className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {isBld ? 'BUILDER' : 'STAFF'}
                          </span>
                        </div>

                        {/* Minecraft & Dates Details */}
                        <div className="bg-[#0b0e16] p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Minecraft:</span>
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://mc-heads.net/avatar/${encodeURIComponent(app.minecraft_username)}/20`}
                                alt="Skin"
                                className="w-5 h-5 rounded bg-slate-800"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                              <strong className="text-white">{app.minecraft_username}</strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                            <span className="text-slate-400">Enviada el:</span>
                            <span className="text-slate-300 font-medium">{formatDate(app.created_at)}</span>
                          </div>

                          {app.reviewed_at && (
                            <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                              <span className="text-slate-400">Respondida el:</span>
                              <span className={isAccepted ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>
                                {formatDate(app.reviewed_at)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="pt-1 flex items-center justify-between">
                          {isAccepted ? (
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>🟢 ACEPTADA</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-black uppercase tracking-wider shadow-sm">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>🔴 RECHAZADA</span>
                            </div>
                          )}

                          <span className="text-[11px] text-slate-400">
                            {isAccepted ? 'Fase 1 Aprobada' : 'Evaluación finalizada'}
                          </span>
                        </div>
                      </div>

                      {/* Action: Ver Detalles */}
                      <button
                        id={`btn-view-history-${app.id}`}
                        onClick={() => setSelectedApplication(app)}
                        className={`w-full py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                          isAccepted
                            ? 'bg-emerald-950/40 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-300 border-rose-500/30'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver detalles</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      )}

      {/* Selected Application Modal */}
      {selectedApplication && (
        <MyApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}

    </div>
  );
};
