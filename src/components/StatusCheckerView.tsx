import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Copy, 
  Check, 
  Shield, 
  AlertCircle, 
  ExternalLink,
  MessageSquare,
  Hammer
} from 'lucide-react';
import { PublicStatusResponse, ApplicationStatus } from '../types';

interface StatusCheckerViewProps {
  initialIdentifier?: string;
  onBackToHome: () => void;
  onApplyNew: () => void;
}

export const StatusCheckerView: React.FC<StatusCheckerViewProps> = ({
  initialIdentifier = '',
  onBackToHome,
  onApplyNew,
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialIdentifier && initialIdentifier.trim()) {
      handleSearch(initialIdentifier.trim());
    }
  }, [initialIdentifier]);

  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : identifier).trim();
    if (!q) {
      setError('Por favor ingresa un identificador, tu Discord ID o tu usuario de Minecraft.');
      setResult(null);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/applications/status/${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se encontró ninguna postulación con este identificador.');
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Error al consultar el servidor. Verifica tu conexión e inténtalo de nuevo.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'ACEPTADA':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>ACEPTADA</span>
          </div>
        );
      case 'RECHAZADA':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold uppercase tracking-wider">
            <XCircle className="w-5 h-5 text-rose-400" />
            <span>RECHAZADA</span>
          </div>
        );
      case 'PENDIENTE':
      default:
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold uppercase tracking-wider">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>PENDIENTE DE REVISIÓN</span>
          </div>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const isBuilder = result?.role === 'BUILDER';

  return (
    <div className="py-8 sm:py-12 max-w-3xl mx-auto px-4 sm:px-6">
      {/* Back Button */}
      <button
        id="status-back-btn"
        onClick={onBackToHome}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Volver al Inicio</span>
      </button>

      {/* Main Card */}
      <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Search className="w-3.5 h-3.5" />
            Seguimiento de Postulaciones
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Consultar Estado de tu Postulación
          </h1>
          <p className="text-slate-400 text-sm">
            Ingresa tu <strong className="text-slate-200">ID de Postulación</strong> (ej: <span className="font-mono text-amber-400">CL-BLD-92140</span> o <span className="font-mono text-blue-400">CL-STF-84921</span>), tu <strong className="text-slate-200">ID de Discord</strong> o tu <strong className="text-slate-200">nick de Minecraft</strong>.
          </p>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              id="status-search-input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ID de Postulación, Discord ID o Nick de Minecraft"
              className="w-full bg-[#0b0e16] border border-[#222c3f] rounded-xl pl-4 pr-10 py-3.5 text-white placeholder-slate-500 text-sm font-mono focus:border-blue-500 transition-colors"
            />
            {identifier && (
              <button
                type="button"
                onClick={() => {
                  setIdentifier('');
                  setResult(null);
                  setError(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            id="status-search-submit-btn"
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </>
            )}
          </button>
        </form>

        {/* Error Alert */}
        {error && (
          <div
            id="status-error-alert"
            className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-200 flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div
            id="status-result-card"
            className="border border-[#1e2638] bg-[#0b0e16] rounded-xl p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-medium">Postulación:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-lg sm:text-xl font-bold text-white">
                    {result.id}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.id);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-xs text-slate-400 hover:text-white p-1 rounded bg-slate-800"
                    title="Copiar ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                    isBuilder 
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                  }`}>
                    {isBuilder ? <Hammer className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {isBuilder ? 'BUILDER' : 'STAFF'}
                  </span>
                </div>
              </div>

              <div>{getStatusBadge(result.status)}</div>
            </div>

            {/* Applicant Meta Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-[#121622] p-3.5 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400">Usuario Discord:</span>
                <p className="font-semibold text-white">{result.discord_username}</p>
              </div>

              <div className="bg-[#121622] p-3.5 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400">Usuario Minecraft:</span>
                <div className="flex items-center gap-2">
                  <img
                    src={`https://mc-heads.net/avatar/${result.minecraft_username}/20`}
                    alt="Skin"
                    className="w-5 h-5 rounded bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="font-semibold text-white">{result.minecraft_username}</span>
                </div>
              </div>

              <div className="bg-[#121622] p-3.5 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400">Fecha de Envío:</span>
                <p className="font-medium text-slate-200">{formatDate(result.created_at)}</p>
              </div>

              <div className="bg-[#121622] p-3.5 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400">
                  {result.reviewed_at ? 'Respondida el:' : 'Última Actualización:'}
                </span>
                <p className={`font-medium ${result.reviewed_at ? (result.status === 'ACEPTADA' ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold') : 'text-slate-200'}`}>
                  {formatDate(result.reviewed_at || result.updated_at)}
                </p>
              </div>
            </div>

            {/* Custom Information Message based on status & role */}
            {result.status === 'PENDIENTE' && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Tu solicitud está en cola de revisión
                </p>
                <p className="text-xs sm:text-sm text-amber-300/80">
                  El equipo directivo de CL | BUILDERS Nautic MC evalúa las postulaciones semanalmente. Te recomendamos permanecer en el servidor de Discord con los mensajes directos habilitados.
                </p>
              </div>
            )}

            {result.status === 'ACEPTADA' && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ¡Fase de formulario aprobada!
                </p>
                <p className="text-xs sm:text-sm text-emerald-300/80">
                  {isBuilder 
                    ? `Has sido seleccionado para la siguiente fase de prueba de construcción. La administración se pondrá en contacto contigo a través de Discord (${result.discord_username}) para coordinar tu acceso al servidor creativo de pruebas.`
                    : `Has sido seleccionado para la siguiente etapa de entrevistas. Un Administrador se pondrá en contacto contigo a través de Discord (${result.discord_username}) para coordinar la entrevista de voz.`
                  }
                </p>
              </div>
            )}

            {result.status === 'RECHAZADA' && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Postulación no seleccionada
                </p>
                <p className="text-xs sm:text-sm text-rose-300/80">
                  En esta ocasión tu solicitud no ha sido aceptada por no cumplir con todos los estándares requeridos. Puedes continuar activo en la comunidad y volver a postularte en próximas convocatorias.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bottom Helper Box */}
        <div className="border-t border-[#1e2638] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>¿Aún no has enviado tu postulación?</span>
          <button
            id="status-go-apply-btn"
            onClick={onApplyNew}
            className="text-blue-400 hover:text-blue-300 font-semibold underline"
          >
            Llenar formulario de Builder o Staff
          </button>
        </div>
      </div>
    </div>
  );
};
