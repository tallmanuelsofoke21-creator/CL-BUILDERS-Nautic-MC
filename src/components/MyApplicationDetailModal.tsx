import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  Shield, 
  Hammer, 
  FileText, 
  Calendar, 
  User, 
  Sparkles
} from 'lucide-react';
import { ApplicationItem, BuilderApplication, StaffApplication, ApplicationStatus } from '../types';

interface MyApplicationDetailModalProps {
  application: ApplicationItem;
  onClose: () => void;
}

export const MyApplicationDetailModal: React.FC<MyApplicationDetailModalProps> = ({
  application,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  const isBuilder = application.role === 'BUILDER';
  const builderApp = application as BuilderApplication;
  const staffApp = application as StaffApplication;

  const formatDate = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'ACEPTADA':
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>🟢 ACEPTADA</span>
          </div>
        );
      case 'RECHAZADA':
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-rose-500/10">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>🔴 RECHAZADA</span>
          </div>
        );
      case 'PENDIENTE':
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/10">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>🟡 EN REVISIÓN</span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#10141e] border border-[#222c3f] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#121722] border-b border-[#1e2638] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={`https://mc-heads.net/avatar/${encodeURIComponent(application.minecraft_username)}/48`}
              alt="Avatar"
              className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 shadow-md flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-lg sm:text-xl font-extrabold text-white">
                  Postulación #{application.id}
                </span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(application.id);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                  title="Copiar ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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

              <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                <span>Minecraft: <strong className="text-white">{application.minecraft_username}</strong></span>
                <span>•</span>
                <span>Discord: <strong className="text-white">{application.discord_username}</strong></span>
                <span>•</span>
                <span>Edad: <strong className="text-white">{application.age} años</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#0d1017]">
          
          {/* Top Status & Dates Banner */}
          <div className="bg-[#121622] border border-[#1e2638] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Estado actual de la postulación:</span>
              <div className="pt-0.5">{getStatusBadge(application.status)}</div>
            </div>

            <div className="text-xs text-slate-300 space-y-1.5 sm:text-right border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
              <p className="flex sm:justify-end items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Enviada el: <strong className="text-slate-200">{formatDate(application.created_at)}</strong></span>
              </p>
              {application.reviewed_at && (
                <p className="flex sm:justify-end items-center gap-1.5 text-emerald-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Respondida el: <strong className="text-emerald-300">{formatDate(application.reviewed_at)}</strong></span>
                </p>
              )}
            </div>
          </div>

          {/* Status Specific Notice */}
          {application.status === 'PENDIENTE' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs sm:text-sm space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-300">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                Tu postulación está siendo evaluada
              </p>
              <p className="text-amber-300/80 leading-relaxed">
                El equipo administrativo de <strong>CL | BUILDERS Nautic MC</strong> revisará tus respuestas minuciosamente. Cuando el estado cambie a Aceptada o Rechazada, se moverá automáticamente a tu <strong>Historial de postulaciones</strong>.
              </p>
            </div>
          )}

          {application.status === 'ACEPTADA' && (
            <div className="p-4 sm:p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm space-y-2.5 shadow-lg shadow-emerald-950/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-emerald-300 text-sm sm:text-base">¡Felicidades! Has superado la fase de formulario</span>
              </div>
              <p className="text-emerald-300/90 leading-relaxed">
                {isBuilder 
                  ? 'Has sido pre-seleccionado para la prueba de construcción en el servidor creativo. La directiva te contactará por Discord para coordinar la parcela y temática de evaluación.'
                  : 'Has sido seleccionado para la fase de entrevista por voz en Discord. Revisa que tu micrófono esté listo y mantén tus mensajes directos abiertos.'}
              </p>
              {application.admin_notes && (
                <div className="p-3 bg-emerald-950/60 rounded-lg border border-emerald-500/30 text-emerald-200 text-xs">
                  <strong className="text-emerald-300 block mb-0.5">📝 Observaciones de la Directiva:</strong>
                  {application.admin_notes}
                </div>
              )}
            </div>
          )}

          {application.status === 'RECHAZADA' && (
            <div className="p-4 sm:p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs sm:text-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-rose-300 text-sm sm:text-base">Postulación no aprobada</span>
              </div>
              <p className="text-rose-300/90 leading-relaxed">
                Agradecemos tu interés en unirte al equipo de CL | BUILDERS Nautic MC. En esta oportunidad tu perfil no fue seleccionado, pero te animamos a seguir activo en la comunidad y volver a intentarlo en futuras convocatorias.
              </p>
              {application.admin_notes && (
                <div className="p-3 bg-rose-950/60 rounded-lg border border-rose-500/30 text-rose-200 text-xs">
                  <strong className="text-rose-300 block mb-0.5">📝 Motivo de la Directiva:</strong>
                  {application.admin_notes}
                </div>
              )}
            </div>
          )}

          {/* User Data Card */}
          <div className="bg-[#121622] border border-[#1e2638] rounded-xl p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <span>Datos de Identificación</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0b0e16] rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Usuario de Discord:</span>
                <span className="font-semibold text-white text-sm">{application.discord_username}</span>
              </div>

              <div className="p-3 bg-[#0b0e16] rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Discord ID:</span>
                  <span className="font-mono font-semibold text-slate-200">{application.discord_id}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(application.discord_id);
                    setCopiedDiscord(true);
                    setTimeout(() => setCopiedDiscord(false), 2000);
                  }}
                  className="text-xs text-slate-400 hover:text-white p-1 rounded bg-slate-800 cursor-pointer"
                  title="Copiar Discord ID"
                >
                  {copiedDiscord ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3 bg-[#0b0e16] rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Nick de Minecraft:</span>
                <span className="font-semibold text-white text-sm">{application.minecraft_username}</span>
              </div>

              <div className="p-3 bg-[#0b0e16] rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Edad registrada:</span>
                <span className="font-semibold text-white text-sm">{application.age} años</span>
              </div>
            </div>
          </div>

          {/* Form Questions & Answers List */}
          <div className="space-y-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>
                {isBuilder 
                  ? 'Respuestas Enviadas para Builder (14 Preguntas)'
                  : 'Respuestas Enviadas para Staff (13 Preguntas)'}
              </span>
            </h3>

            {isBuilder ? (
              /* Builder Questions */
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">1. ¿Cuál es tu nombre de Minecraft/Discord?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.minecraft_discord_name || builderApp.minecraft_username}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">2. ¿Cuánto tiempo llevas jugando Minecraft?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.time_playing_mc}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">3. ¿Cuánto tiempo llevas construyendo en Minecraft?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.time_building_mc}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">4. ¿Qué nivel de construcción consideras que tienes?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.building_level}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">5. ¿Qué estilos de construcción sabes hacer?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.building_styles}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">6. ¿Has sido Builder en algún otro servidor?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.previous_builder_exp}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">7. ¿Tienes experiencia trabajando en equipo?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.teamwork_exp}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">8. ¿Cuánto tiempo puedes dedicar al servidor semanalmente?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.weekly_time}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">9. ¿Qué programas o herramientas de construcción utilizas?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.tools_programs}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">10. ¿Por qué quieres formar parte del equipo de Builders?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.why_join_builders}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">11. ¿Qué aportarías al equipo de construcción?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.contributions}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">12. ¿Cómo reaccionarías si un Staff te pide modificar una construcción?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.staff_modify_reaction}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">13. ¿Te comprometes a respetar las normas del servidor y del equipo?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.rules_commitment}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-amber-400">14. ¿Hay algo más que quieras añadir sobre ti?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{builderApp.additional_info || 'Ninguno.'}</p>
                </div>
              </div>
            ) : (
              /* Staff Questions */
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">1. ¿Por qué quieres ser Staff?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{staffApp.why_apply}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">2. ¿Cuánto tiempo tienes disponible para el servidor al día?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{staffApp.available_time}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">3. ¿Cómo te consideras como persona?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{staffApp.about_user}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">4. ¿Has tenido experiencia como Staff en otros servidores?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{staffApp.server_experience}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">5. En caso de haber tenido experiencia, ¿por qué lo dejaste?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{staffApp.why_left || 'Sin experiencia previa / No especificado.'}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">10. ¿Por qué te deberíamos de escoger a ti y no a otra persona?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{staffApp.why_choose_me}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">11. ¿Eres bueno trabajando en equipo?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{staffApp.teamwork}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">12. Si hay dos usuarios peleando en el chat, ¿cómo actuarías?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{staffApp.chat_conflict}</p>
                </div>

                <div className="bg-[#121622] p-4 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-xs font-bold text-blue-400">13. Si sospechas que un Staff está siendo corrupto, ¿cómo actuarías?</span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{staffApp.corrupt_staff}</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[#121722] border-t border-[#1e2638] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cerrar Detalles
          </button>
        </div>

      </div>
    </div>
  );
};
