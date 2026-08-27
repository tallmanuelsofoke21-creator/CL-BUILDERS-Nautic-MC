import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  MessageSquare, 
  Shield, 
  ExternalLink,
  Save,
  AlertTriangle,
  Hammer,
  FileText,
  Lock
} from 'lucide-react';
import { ApplicationItem, ApplicationStatus, StaffApplication, BuilderApplication } from '../../types';
import { DecisionConfirmModal } from './DecisionConfirmModal';

interface ApplicationDetailModalProps {
  application: ApplicationItem;
  adminToken: string;
  onClose: () => void;
  onStatusUpdated: (updatedApp: ApplicationItem) => void;
  onDelete: (id: string) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  adminToken,
  onClose,
  onStatusUpdated,
}) => {
  const [currentApp, setCurrentApp] = useState<ApplicationItem>(application);
  const [notes, setNotes] = useState(application.admin_notes || '');
  const [notifyDiscord, setNotifyDiscord] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string; discordInfo?: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  
  // Pending decision modal state (for mandatory reasons & staff credentials)
  const [decisionModalTarget, setDecisionModalTarget] = useState<'ACEPTADA' | 'RECHAZADA' | null>(null);

  useEffect(() => {
    setCurrentApp(application);
    setNotes(application.admin_notes || '');
  }, [application]);

  // Auto-hide feedback after 4.5 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const handleExecuteDecision = async ({
    status: targetStatus,
    reason,
    reviewer_minecraft,
    reviewer_discord,
  }: {
    status: ApplicationStatus;
    reason: string;
    reviewer_minecraft: string;
    reviewer_discord: string;
  }) => {
    setIsUpdatingStatus(true);
    setFeedbackMessage(null);

    try {
      const response = await fetch(`/api/admin/applications/${currentApp.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: targetStatus,
          admin_notes: reason,
          reviewer_minecraft,
          reviewer_discord,
          notify_discord: notifyDiscord,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedbackMessage({
          type: 'error',
          text: data.error || 'Error al actualizar el estado.',
        });
      } else {
        const updated = data.application as ApplicationItem;
        setCurrentApp(updated);
        setNotes(updated.admin_notes || reason);
        onStatusUpdated(updated);
        setDecisionModalTarget(null);
        
        let discordMsg = '';
        if (data.discord?.sent) {
          discordMsg = '💬 Notificación enviada a Discord';
        } else if (data.discord?.message && notifyDiscord) {
          discordMsg = '⚠️ ' + data.discord.message;
        }

        setFeedbackMessage({
          type: 'success',
          text: `¡Postulación ${updated.id} guardada como ${targetStatus}!`,
          discordInfo: discordMsg,
        });
      }
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'Error de conexión con el servidor.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkPending = async () => {
    setIsUpdatingStatus(true);
    setFeedbackMessage(null);

    try {
      const response = await fetch(`/api/admin/applications/${currentApp.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'PENDIENTE',
          admin_notes: notes,
          notify_discord: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const updated = data.application as ApplicationItem;
        setCurrentApp(updated);
        onStatusUpdated(updated);
        setFeedbackMessage({
          type: 'success',
          text: `Postulación ${updated.id} reestablecida a PENDIENTE.`,
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || 'Error al actualizar a PENDIENTE.',
        });
      }
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'Error de conexión con el servidor.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotesOnly = async () => {
    setIsSavingNotes(true);
    setFeedbackMessage(null);

    try {
      const response = await fetch(`/api/admin/applications/${currentApp.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: currentApp.status,
          admin_notes: notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentApp(data.application);
        onStatusUpdated(data.application);
        setFeedbackMessage({
          type: 'success',
          text: 'Notas internas guardadas correctamente.',
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || 'No se pudieron guardar las notas.',
        });
      }
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'Error de conexión.',
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  const isBuilder = currentApp.role === 'BUILDER';
  const builderApp = currentApp as BuilderApplication;
  const staffApp = currentApp as StaffApplication;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#10141e] border border-[#222c3f] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 bg-[#121722] border-b border-[#1e2638] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={`https://mc-heads.net/avatar/${currentApp.minecraft_username}/48`}
              alt="Avatar"
              className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 shadow-md flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base sm:text-lg font-extrabold text-white">
                  {currentApp.id}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentApp.id);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white text-xs"
                  title="Copiar ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* Role badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isBuilder 
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                }`}>
                  {isBuilder ? <Hammer className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                  {isBuilder ? 'BUILDER' : 'STAFF'}
                </span>

                {/* Status badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  currentApp.status === 'ACEPTADA'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : currentApp.status === 'RECHAZADA'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                }`}>
                  {currentApp.status === 'ACEPTADA' ? '✓ ACEPTADA' : currentApp.status === 'RECHAZADA' ? '✕ RECHAZADA' : '⏳ PENDIENTE'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                <span>Minecraft: <strong className="text-white">{currentApp.minecraft_username}</strong></span>
                <span>•</span>
                <span>Discord: <strong className="text-white">{currentApp.discord_username}</strong></span>
                <span>•</span>
                <span>Edad: <strong className="text-white">{currentApp.age} años</strong></span>
                <span>•</span>
                <span>Enviado: {formatDate(currentApp.created_at)}</span>
              </div>
            </div>
          </div>

          <button
            id="modal-close-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK TOAST BANNER */}
        {feedbackMessage && (
          <div className={`px-5 py-3 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/90 border-b border-emerald-600/50 text-emerald-200'
              : 'bg-rose-950/90 border-b border-rose-600/50 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            {feedbackMessage.discordInfo && (
              <span className="text-xs bg-black/40 px-2.5 py-1 rounded-md text-slate-300 font-mono">
                {feedbackMessage.discordInfo}
              </span>
            )}
          </div>
        )}

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#0d1017]">
          
          {/* AUDIT / REVIEW RECORD BANNER (Si ya fue evaluada) */}
          {currentApp.status !== 'PENDIENTE' && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              currentApp.status === 'ACEPTADA'
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
            }`}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Shield className="w-4 h-4" />
                  <span>
                    Postulación {currentApp.status === 'ACEPTADA' ? 'Aceptada' : 'Rechazada'}
                  </span>
                  {currentApp.discord_notified && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Notificada en Discord ✓ (1 solo envío)
                    </span>
                  )}
                </div>
                
                <div className="text-slate-300 space-y-1">
                  {currentApp.reviewer_minecraft && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400">🛡️ Staff Evaluador registrado:</span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 font-mono font-bold text-white">
                        MC: {currentApp.reviewer_minecraft}
                      </span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 font-mono text-slate-300">
                        Discord: {currentApp.reviewer_discord || 'No registrado'}
                      </span>
                      <span className="text-amber-400 text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Privado en la web (Oculto en Discord)
                      </span>
                    </div>
                  )}
                  {currentApp.admin_notes && (
                    <p>
                      📝 <strong className="text-white">Motivo / Razón:</strong> {currentApp.admin_notes}
                    </p>
                  )}
                  {currentApp.reviewed_at && (
                    <p className="text-slate-400 text-[11px]">
                      🕒 Fecha de revisión: {formatDate(currentApp.reviewed_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Contact & Discord Actions Box */}
          <div className="bg-[#121622] border border-[#1e2638] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block">ID Discord del Postulante:</span>
                <span className="font-mono text-sm text-white font-bold">{currentApp.discord_id}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentApp.discord_id);
                  setCopiedDiscord(true);
                  setTimeout(() => setCopiedDiscord(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                {copiedDiscord ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDiscord ? 'ID Copiado' : 'Copiar Discord ID'}</span>
              </button>

              <a
                href={`https://namemc.com/profile/${currentApp.minecraft_username}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <span>NameMC</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* QUESTIONS & ANSWERS LIST */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>
                {isBuilder
                  ? 'Respuestas del Formulario de Builder (14 Preguntas)'
                  : 'Respuestas del Formulario de Staff (13 Preguntas)'}
              </span>
            </h3>

            {isBuilder ? (
              /* ================= BUILDER 14 QUESTIONS ================= */
              <div className="space-y-3.5">
                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">1. ¿Cuál es tu nombre de Minecraft/Discord?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.minecraft_discord_name || builderApp.minecraft_username}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">2. ¿Cuánto tiempo llevas jugando Minecraft?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.time_playing_mc}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">3. ¿Cuánto tiempo llevas construyendo en Minecraft?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.time_building_mc}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">4. ¿Qué nivel de construcción consideras que tienes?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.building_level}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">5. ¿Qué estilos de construcción sabes hacer?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.building_styles}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">6. ¿Has sido Builder en algún otro servidor?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.previous_builder_exp}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">7. ¿Tienes experiencia trabajando en equipo?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.teamwork_exp}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">8. ¿Cuánto tiempo puedes dedicar al servidor semanalmente?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.weekly_time}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">9. ¿Qué programas o herramientas de construcción utilizas?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.tools_programs}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">10. ¿Por qué quieres formar parte del equipo de Builders?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.why_join_builders}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">11. ¿Qué aportarías al equipo de construcción?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.contributions}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">12. ¿Cómo reaccionarías si un Staff te pide modificar una construcción?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.staff_modify_reaction}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">13. ¿Te comprometes a respetar las normas del servidor y del equipo?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.rules_commitment}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">14. ¿Hay algo más que quieras añadir sobre ti?</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{builderApp.additional_info || 'Ninguna información adicional.'}</p>
                </div>
              </div>
            ) : (
              /* ================= STAFF 13 QUESTIONS ================= */
              <div className="space-y-3.5">
                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">1. ¿Por qué quieres ser Staff?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{staffApp.why_apply}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">2. ¿Cuánto tiempo tienes disponible para el servidor al día?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{staffApp.available_time}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">3. ¿Cómo te consideras como persona?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{staffApp.about_user}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">4. ¿Has tenido experiencia como Staff en otros servidores?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{staffApp.server_experience}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">5. En caso de haber tenido experiencia, ¿por qué lo dejaste?</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{staffApp.why_left || 'No especificado / Sin experiencia previa.'}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">10. ¿Por qué te deberíamos de escoger a ti y no a otra persona?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{staffApp.why_choose_me}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">11. ¿Eres bueno trabajando en equipo?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{staffApp.teamwork}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">12. Si hay dos usuarios peleando en el chat, ¿cómo actuarías?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{staffApp.chat_conflict}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">13. Si sospechas que un Staff está siendo corrupto, ¿cómo actuarías?*</span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{staffApp.corrupt_staff}</p>
                </div>
              </div>
            )}
          </div>

          {/* ADMIN INTERNAL NOTES SECTION */}
          <div className="bg-[#121622] border border-[#1e2638] rounded-xl p-4 space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Notas y Observaciones Internas del Staff</span>
              {(currentApp.status === 'ACEPTADA' || currentApp.status === 'RECHAZADA') && (
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  <Lock className="w-3 h-3 text-slate-400" /> Resolución definitiva (Bloqueada)
                </span>
              )}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={currentApp.status === 'ACEPTADA' || currentApp.status === 'RECHAZADA'}
              placeholder="Escribe comentarios privados sobre esta postulación..."
              className={`w-full bg-[#0b0e16] border border-[#222c3f] rounded-lg p-3 text-white text-xs placeholder-slate-500 ${
                currentApp.status === 'ACEPTADA' || currentApp.status === 'RECHAZADA'
                  ? 'opacity-75 cursor-not-allowed'
                  : 'focus:border-blue-500'
              }`}
            />
            {currentApp.status === 'PENDIENTE' && (
              <div className="flex justify-end">
                <button
                  id="save-notes-btn"
                  onClick={handleSaveNotesOnly}
                  disabled={isSavingNotes}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? 'Guardando...' : 'Guardar Solo Notas'}</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* MODAL FOOTER: DIRECT DECISION BUTTONS & IMMUTABILITY BANNER */}
        <div className="p-4 sm:p-5 bg-[#121722] border-t border-[#1e2638]">
          {currentApp.status === 'ACEPTADA' || currentApp.status === 'RECHAZADA' ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  currentApp.status === 'ACEPTADA' 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black uppercase tracking-wider ${
                      currentApp.status === 'ACEPTADA' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      Resolución Definitiva ({currentApp.status})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Esta postulación ya fue finalizada{currentApp.reviewed_at ? ` el ${formatDate(currentApp.reviewed_at)}` : ''} y no puede ser modificada.
                  </p>
                </div>
              </div>

              <button
                id="btn-close-finalized-modal"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 transition-colors text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Estado:</span>
                  <strong className="px-2.5 py-1 rounded font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30">
                    🟡 PENDIENTE
                  </strong>
                </div>

                {/* Discord Notification Checkbox */}
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 bg-[#0c0f17] px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer select-none hover:border-[#5865F2]/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={notifyDiscord}
                    onChange={(e) => setNotifyDiscord(e.target.checked)}
                    className="w-4 h-4 rounded text-[#5865F2] focus:ring-[#5865F2] bg-slate-900 border-slate-700"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#5865F2]"></span>
                    <span>Notificar en Discord (<strong className="text-slate-200">@{currentApp.discord_username}</strong>)</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap justify-end">
                {/* REJECT BUTTON */}
                <button
                  id="btn-reject-app"
                  onClick={() => setDecisionModalTarget('RECHAZADA')}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border cursor-pointer bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>RECHAZAR</span>
                </button>

                {/* ACCEPT BUTTON */}
                <button
                  id="btn-accept-app"
                  onClick={() => setDecisionModalTarget('ACEPTADA')}
                  disabled={isUpdatingStatus}
                  className="px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>ACEPTAR POSTULACIÓN</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* REASON & AUDIT CONFIRMATION MODAL */}
      {decisionModalTarget && (
        <DecisionConfirmModal
          application={currentApp}
          targetStatus={decisionModalTarget}
          notifyDiscord={notifyDiscord}
          isLoading={isUpdatingStatus}
          onClose={() => setDecisionModalTarget(null)}
          onConfirm={handleExecuteDecision}
        />
      )}

    </div>
  );
};
