import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  User, 
  HelpCircle, 
  Copy, 
  Check, 
  ArrowLeft, 
  Clock, 
  ShieldAlert, 
  Sparkles,
  Search,
  Gamepad2,
  Hammer,
  Shield,
  Wrench,
  Info
} from 'lucide-react';
import { ApplicationRole, StaffSubmissionData, BuilderSubmissionData } from '../types';

interface ApplicationFormProps {
  initialRole?: ApplicationRole;
  onBackToHome: () => void;
  onCheckStatus: (id?: string) => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  initialRole = 'BUILDER',
  onBackToHome,
  onCheckStatus,
}) => {
  const [role, setRole] = useState<ApplicationRole>(initialRole);

  // --- STAFF STATE ---
  const [staffData, setStaffData] = useState<StaffSubmissionData>({
    role: 'STAFF',
    discord_username: '',
    discord_id: '',
    minecraft_username: '',
    age: 16,
    why_apply: '',
    available_time: '',
    about_user: '',
    server_experience: '',
    why_left: '',
    why_choose_me: '',
    teamwork: '',
    chat_conflict: '',
    corrupt_staff: '',
  });

  // --- BUILDER STATE ---
  const [builderData, setBuilderData] = useState<BuilderSubmissionData>({
    role: 'BUILDER',
    discord_username: '',
    discord_id: '',
    minecraft_username: '',
    age: 14,
    minecraft_discord_name: '',
    time_playing_mc: '',
    time_building_mc: '',
    building_level: '',
    building_styles: '',
    previous_builder_exp: '',
    teamwork_exp: '',
    weekly_time: '',
    tools_programs: '',
    why_join_builders: '',
    contributions: '',
    staff_modify_reaction: '',
    rules_commitment: '',
    additional_info: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    id: string;
    role: ApplicationRole;
    discord_username: string;
    minecraft_username: string;
    created_at: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState(false);
  const [showDiscordIdHelp, setShowDiscordIdHelp] = useState(false);

  // Handle staff inputs
  const handleStaffChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setStaffData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value === '' ? '' : parseInt(value, 10)) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (serverError) setServerError(null);
  };

  // Handle builder inputs
  const handleBuilderChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBuilderData((prev) => {
      const next = {
        ...prev,
        [name]: name === 'age' ? (value === '' ? '' : parseInt(value, 10)) : value,
      };
      // Keep discord_username and minecraft_username synced with question 1 if user writes in question 1
      return next;
    });

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (serverError) setServerError(null);
  };

  const validateStaff = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!staffData.discord_username.trim()) {
      newErrors.discord_username = 'Por favor ingresa tu usuario de Discord.';
    }
    if (!staffData.discord_id.trim()) {
      newErrors.discord_id = 'El ID de Discord es obligatorio.';
    } else if (!/^\d{16,20}$/.test(staffData.discord_id.trim())) {
      newErrors.discord_id = 'El ID de Discord suele ser un número de 17 a 19 dígitos (Ej: 492019384729103841).';
    }

    if (!staffData.minecraft_username.trim()) {
      newErrors.minecraft_username = 'Ingresa tu nick exacto de Minecraft Premium.';
    }

    if (staffData.age === undefined || staffData.age === null || isNaN(Number(staffData.age))) {
      newErrors.age = 'Por favor ingresa tu edad.';
    } else if (Number(staffData.age) < 16) {
      newErrors.age = 'Debes tener 16 años o más para postularte como Staff.';
    }

    if (!staffData.why_apply.trim() || staffData.why_apply.trim().length < 15) {
      newErrors.why_apply = 'Por favor explica en detalle por qué deseas postularte (mínimo 15 caracteres).';
    }
    if (!staffData.available_time.trim()) {
      newErrors.available_time = 'Indica el tiempo que le puedes dedicar al servidor.';
    }
    if (!staffData.about_user.trim() || staffData.about_user.trim().length < 15) {
      newErrors.about_user = 'Cuéntanos un poco sobre cómo eres (mínimo 15 caracteres).';
    }
    if (!staffData.server_experience.trim()) {
      newErrors.server_experience = 'Indica si tienes experiencia en otros servidores.';
    }
    if (!staffData.why_choose_me.trim() || staffData.why_choose_me.trim().length < 15) {
      newErrors.why_choose_me = 'Explica por qué deberíamos escogerte a ti.';
    }
    if (!staffData.teamwork.trim()) {
      newErrors.teamwork = 'Indica si eres bueno trabajando en equipo.';
    }
    if (!staffData.chat_conflict.trim() || staffData.chat_conflict.trim().length < 15) {
      newErrors.chat_conflict = 'Explica cómo actuarías si dos usuarios están peleando en el chat.';
    }
    if (!staffData.corrupt_staff.trim() || staffData.corrupt_staff.trim().length < 15) {
      newErrors.corrupt_staff = 'Explica cómo actuarías si sospechas que un Staff es corrupto.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBuilder = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. ¿Cuál es tu nombre de Minecraft/Discord?*
    if (!builderData.minecraft_discord_name.trim()) {
      newErrors.minecraft_discord_name = 'Por favor ingresa tu nombre de Minecraft y tu usuario de Discord.';
    }

    // Discord ID for anti-spam & lookup
    if (!builderData.discord_id.trim()) {
      newErrors.discord_id = 'El ID numérico de Discord es necesario para el seguimiento de tu postulación.';
    } else if (!/^\d{16,20}$/.test(builderData.discord_id.trim())) {
      newErrors.discord_id = 'El ID de Discord suele ser un número de 17 a 19 dígitos (Ej: 492019384729103841).';
    }

    // Minecraft Nick for skin rendering
    if (!builderData.minecraft_username.trim()) {
      newErrors.minecraft_username = 'Ingresa tu nick de Minecraft.';
    }

    // Age
    if (builderData.age === undefined || builderData.age === null || isNaN(Number(builderData.age))) {
      newErrors.age = 'Por favor ingresa tu edad.';
    } else if (Number(builderData.age) < 12) {
      newErrors.age = 'Debes tener una edad igual o mayor a 12 años para el equipo de Builders.';
    }

    // 2. ¿Cuánto tiempo llevas jugando Minecraft?*
    if (!builderData.time_playing_mc.trim()) {
      newErrors.time_playing_mc = 'Indica cuánto tiempo llevas jugando Minecraft.';
    }

    // 3. ¿Cuánto tiempo llevas construyendo en Minecraft?*
    if (!builderData.time_building_mc.trim()) {
      newErrors.time_building_mc = 'Indica cuánto tiempo llevas construyendo.';
    }

    // 4. ¿Qué nivel de construcción consideras que tienes?*
    if (!builderData.building_level.trim()) {
      newErrors.building_level = 'Describe qué nivel de construcción consideras que tienes.';
    }

    // 5. ¿Qué estilos de construcción sabes hacer?*
    if (!builderData.building_styles.trim()) {
      newErrors.building_styles = 'Indica qué estilos dominas (ej: medieval, moderno, orgánicos, etc.).';
    }

    // 6. ¿Has sido Builder en algún otro servidor?*
    if (!builderData.previous_builder_exp.trim()) {
      newErrors.previous_builder_exp = 'Indica si has sido Builder en otros servidores y cuáles.';
    }

    // 7. ¿Tienes experiencia trabajando en equipo?*
    if (!builderData.teamwork_exp.trim()) {
      newErrors.teamwork_exp = 'Cuéntanos tu experiencia trabajando en equipo.';
    }

    // 8. ¿Cuánto tiempo puedes dedicar al servidor semanalmente?*
    if (!builderData.weekly_time.trim()) {
      newErrors.weekly_time = 'Indica las horas que puedes dedicar al servidor semanalmente.';
    }

    // 9. ¿Qué programas o herramientas de construcción utilizas?*
    if (!builderData.tools_programs.trim()) {
      newErrors.tools_programs = 'Menciona las herramientas que usas (ej: WorldEdit, Axiom, VoxelSniper, goPaint, etc.).';
    }

    // 10. ¿Por qué quieres formar parte del equipo de Builders?*
    if (!builderData.why_join_builders.trim() || builderData.why_join_builders.trim().length < 15) {
      newErrors.why_join_builders = 'Explica tus motivos para unirte al equipo de Builders (mínimo 15 caracteres).';
    }

    // 11. ¿Qué aportarías al equipo de construcción?*
    if (!builderData.contributions.trim() || builderData.contributions.trim().length < 15) {
      newErrors.contributions = 'Explica qué aportarías al equipo de construcción.';
    }

    // 12. ¿Cómo reaccionarías si un Staff te pide modificar una construcción?*
    if (!builderData.staff_modify_reaction.trim() || builderData.staff_modify_reaction.trim().length < 10) {
      newErrors.staff_modify_reaction = 'Explica cómo reaccionarías ante sugerencias o cambios en una construcción.';
    }

    // 13. ¿Te comprometes a respetar las normas del servidor y del equipo?*
    if (!builderData.rules_commitment.trim()) {
      newErrors.rules_commitment = 'Por favor confirma tu compromiso con las normas del servidor.';
    }

    // 14. ¿Hay algo más que quieras añadir sobre ti?*
    if (!builderData.additional_info?.trim()) {
      newErrors.additional_info = 'Por favor responde este campo (o pon "Ninguno").';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const isValid = role === 'BUILDER' ? validateBuilder() : validateStaff();
    if (!isValid) {
      window.scrollTo({ top: 250, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = role === 'BUILDER' 
        ? {
            ...builderData,
            discord_username: builderData.discord_username.trim() || builderData.minecraft_discord_name.trim(),
          }
        : staffData;

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setServerError(data.error || 'Ya tienes una postulación pendiente. Debes esperar a que el equipo la revise.');
        } else {
          setServerError(data.error || 'Hubo un error al procesar tu postulación. Por favor verifica los datos.');
        }
        setIsSubmitting(false);
        return;
      }

      setSuccessData(data.application);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: role === 'BUILDER' ? ['#f59e0b', '#fbbf24', '#3b82f6', '#10b981'] : ['#3b82f6', '#60a5fa', '#f59e0b', '#10b981'],
        });
      } catch (err) {
        // silent
      }
    } catch (err) {
      setIsSubmitting(false);
      setServerError('No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.');
    }
  };

  const copyApplicationId = () => {
    if (successData?.id) {
      navigator.clipboard.writeText(successData.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // --- SUCCESS VIEW ---
  if (successData) {
    return (
      <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-6 sm:p-10 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            successData.role === 'BUILDER' ? 'bg-amber-500/10 border-2 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400'
          }`}>
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ¡Postulación para {successData.role === 'BUILDER' ? 'Builder' : 'Staff'} enviada!
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-lg mx-auto">
              Tu postulación ha sido recibida correctamente. El equipo de <strong className="text-blue-400">CL | BUILDERS Nautic MC</strong> evaluará tu perfil.
            </p>
          </div>

          {/* Application Unique ID Card */}
          <div className="bg-[#0b0f19] border border-blue-500/30 rounded-xl p-5 max-w-md mx-auto space-y-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Identificador Único de Postulación
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className={`font-mono text-xl sm:text-2xl font-bold tracking-wider ${
                successData.role === 'BUILDER' ? 'text-amber-400' : 'text-blue-400'
              }`}>
                {successData.id}
              </span>
              <button
                id="copy-id-btn"
                onClick={copyApplicationId}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs"
                title="Copiar ID"
              >
                {copiedId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Guarda este código para consultar el estado en cualquier momento.
            </p>
          </div>

          {/* Summary Box */}
          <div className="bg-[#161c2b] border border-slate-800 rounded-xl p-4 max-w-md mx-auto text-left text-sm text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Puesto:</span>
              <span className="font-bold text-white">{successData.role === 'BUILDER' ? 'Builder (Construcción)' : 'Staff (Moderación)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Minecraft Nick:</span>
              <span className="font-medium text-white">{successData.minecraft_username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estado inicial:</span>
              <span className="font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-xs">
                PENDIENTE
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="success-back-home-btn"
              onClick={onBackToHome}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm uppercase tracking-wider"
            >
              VOLVER AL INICIO
            </button>

            <button
              id="success-check-status-btn"
              onClick={() => onCheckStatus(successData.id)}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#1a2334] hover:bg-[#232f46] text-slate-200 hover:text-white font-semibold rounded-xl border border-slate-700 transition-all text-sm flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Ver Estado de mi Postulación</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="py-8 sm:py-12 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Top Breadcrumb & Return */}
      <button
        id="form-back-btn"
        onClick={onBackToHome}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Volver a Inicio</span>
      </button>

      {/* Prominent Role Selector Card */}
      <div className="mb-8 bg-[#121620] border border-[#1e2638] rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            Puesto seleccionado para postularte:
          </span>
          <span className="text-xs text-slate-400">
            Puedes cambiar de formulario haciendo clic en las pestañas:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* BUILDER Tab Button */}
          <button
            type="button"
            id="form-tab-builder"
            onClick={() => {
              setRole('BUILDER');
              setErrors({});
              setServerError(null);
            }}
            className={`p-3.5 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
              role === 'BUILDER'
                ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/50 shadow-md shadow-amber-500/10'
                : 'bg-[#0b0e16] border-[#222c3f] text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base ${
                role === 'BUILDER' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
              }`}>
                🛠️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className={`text-sm font-extrabold ${role === 'BUILDER' ? 'text-amber-400' : 'text-white'}`}>
                    BUILDER Form
                  </strong>
                  {role === 'BUILDER' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase">
                      Activo
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 block">
                  Construcción • 14 Preguntas (12+ años)
                </span>
              </div>
            </div>
          </button>

          {/* STAFF Tab Button */}
          <button
            type="button"
            id="form-tab-staff"
            onClick={() => {
              setRole('STAFF');
              setErrors({});
              setServerError(null);
            }}
            className={`p-3.5 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
              role === 'STAFF'
                ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/50 shadow-md shadow-blue-600/10'
                : 'bg-[#0b0e16] border-[#222c3f] text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base ${
                role === 'STAFF' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className={`text-sm font-extrabold ${role === 'STAFF' ? 'text-blue-400' : 'text-white'}`}>
                    STAFF Form
                  </strong>
                  {role === 'STAFF' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white uppercase">
                      Activo
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 block">
                  Moderación • 13 Preguntas (16+ años)
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="mb-8 space-y-2">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
          role === 'BUILDER' 
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
        }`}>
          {role === 'BUILDER' ? <Hammer className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          Convocatoria {role === 'BUILDER' ? 'Equipo de Construcción (BUILDER)' : 'Equipo de Moderación (STAFF)'}
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase">
          {role === 'BUILDER' ? 'POSTULACIONES PARA BUILDER' : 'POSTULACIONES PARA STAFF'}
        </h1>
        <p className="text-slate-300 text-sm sm:text-base">
          {role === 'BUILDER'
            ? 'Estamos en busca de nuevos miembros para el equipo de construccion. Si eres responsable, comprometido y te apasiona ayudar a la comunidad, esta es tu oportunidad.'
            : 'Estamos en busca de nuevos miembros para el equipo de moderación. Si eres responsable, comprometido y te apasiona ayudar a la comunidad, esta es tu oportunidad.'}
        </p>

        {/* Requirements Box */}
        <div className="mt-4 p-4 rounded-xl bg-[#121620] border border-[#1e2638] text-xs sm:text-sm text-slate-300 flex flex-col sm:flex-row sm:items-center gap-4">
          <strong className="text-white flex items-center gap-1.5 whitespace-nowrap">
            <CheckCircle2 className={`w-4 h-4 ${role === 'BUILDER' ? 'text-amber-400' : 'text-blue-400'}`} />
            Requisitos Oficiales:
          </strong>
          {role === 'BUILDER' ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-300">
              <span>• Tener una edad <strong className="text-white">igual o mayor a 12 años</strong></span>
              <span>• Tener <strong className="text-white">micrófono funcional</strong></span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-300">
              <span>• Tener una edad <strong className="text-white">igual o mayor a 16 años</strong></span>
              <span>• No haber sido sancionado</span>
              <span>• Minecraft Premium Oficial</span>
              <span>• Tener <strong className="text-white">micrófono funcional</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Global Server Error Banner */}
      {serverError && (
        <div
          id="form-server-error-banner"
          className="mb-8 p-4 rounded-xl bg-rose-950/40 border border-rose-600/50 text-rose-200 flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm font-semibold text-rose-300">
              No se pudo enviar la postulación
            </strong>
            <p className="text-sm">{serverError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {role === 'BUILDER' ? (
          /* =========================================================================
             FORMULARIO PARA BUILDER (14 PREGUNTAS EXACTAS)
             ========================================================================= */
          <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-[#1e2638] pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                  <Hammer className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wide">
                    FORMULARIO DE POSTULACIÓN PARA BUILDER
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Responde a las 14 preguntas de forma clara y detallada
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* 1. ¿Cuál es tu nombre de Minecraft/Discord?* */}
              <div id="field-minecraft_discord_name" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  1. ¿Cuál es tu nombre de Minecraft/Discord? <span className="text-amber-400">*</span>
                </label>
                <input
                  id="input-builder-q1"
                  type="text"
                  name="minecraft_discord_name"
                  value={builderData.minecraft_discord_name}
                  onChange={(e) => {
                    handleBuilderChange(e);
                    // Also auto-suggest minecraft_username if contains single word
                    const val = e.target.value.trim();
                    if (val && !builderData.minecraft_username) {
                      const firstWord = val.split(/[\/\s,]+/)[0];
                      setBuilderData((prev) => ({ ...prev, minecraft_username: firstWord }));
                    }
                  }}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.minecraft_discord_name ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.minecraft_discord_name && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.minecraft_discord_name}
                  </p>
                )}
              </div>

              {/* Extra identification fields for tracking and skin preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#090c13] p-4 rounded-xl border border-slate-800/80">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Nick de Minecraft (para avatar) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="minecraft_username"
                      value={builderData.minecraft_username}
                      onChange={handleBuilderChange}
                      placeholder="Nick de Minecraft"
                      className={`w-full bg-[#121620] border ${
                        errors.minecraft_username ? 'border-rose-500' : 'border-[#222c3f]'
                      } rounded-lg pl-3 pr-9 py-2 text-white text-xs focus:border-amber-500`}
                    />
                    {builderData.minecraft_username.trim().length >= 3 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <img
                          src={`https://mc-heads.net/avatar/${builderData.minecraft_username.trim()}/20`}
                          alt="Skin"
                          className="w-5 h-5 rounded"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {errors.minecraft_username && (
                    <p className="text-[11px] text-rose-400">{errors.minecraft_username}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      ID de Discord <span className="text-amber-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDiscordIdHelp(!showDiscordIdHelp)}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      ¿Ayuda?
                    </button>
                  </div>
                  <input
                    type="text"
                    name="discord_id"
                    value={builderData.discord_id}
                    onChange={handleBuilderChange}
                    placeholder="ID de Discord"
                    className={`w-full bg-[#121620] border ${
                      errors.discord_id ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-amber-500`}
                  />
                  {errors.discord_id && (
                    <p className="text-[11px] text-rose-400">{errors.discord_id}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Tu Edad (mínimo 12 años) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    min="1"
                    max="99"
                    value={builderData.age === '' ? '' : builderData.age}
                    onChange={handleBuilderChange}
                    placeholder="Edad"
                    className={`w-full bg-[#121620] border ${
                      errors.age ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-lg px-3 py-2 text-white text-xs focus:border-amber-500`}
                  />
                  {errors.age && (
                    <p className="text-[11px] text-rose-400">{errors.age}</p>
                  )}
                </div>

                {showDiscordIdHelp && (
                  <div className="col-span-full p-2.5 bg-[#151b29] rounded border border-amber-500/20 text-xs text-slate-300">
                    En Discord: Ajustes de Usuario &gt; Avanzado &gt; Activar <strong>Modo Desarrollador</strong> &gt; Clic derecho a tu propio usuario &gt; <strong>Copiar ID de usuario</strong>.
                  </div>
                )}
              </div>

              {/* 2. ¿Cuánto tiempo llevas jugando Minecraft?* */}
              <div id="field-time_playing_mc" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  2. ¿Cuánto tiempo llevas jugando Minecraft? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q2"
                  rows={2}
                  name="time_playing_mc"
                  value={builderData.time_playing_mc}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.time_playing_mc ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.time_playing_mc && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.time_playing_mc}
                  </p>
                )}
              </div>

              {/* 3. ¿Cuánto tiempo llevas construyendo en Minecraft?* */}
              <div id="field-time_building_mc" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  3. ¿Cuánto tiempo llevas construyendo en Minecraft? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q3"
                  rows={2}
                  name="time_building_mc"
                  value={builderData.time_building_mc}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.time_building_mc ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.time_building_mc && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.time_building_mc}
                  </p>
                )}
              </div>

              {/* 4. ¿Qué nivel de construcción consideras que tienes?* */}
              <div id="field-building_level" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  4. ¿Qué nivel de construcción consideras que tienes? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q4"
                  rows={2}
                  name="building_level"
                  value={builderData.building_level}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.building_level ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.building_level && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.building_level}
                  </p>
                )}
              </div>

              {/* 5. ¿Qué estilos de construcción sabes hacer?* */}
              <div id="field-building_styles" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  5. ¿Qué estilos de construcción sabes hacer? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q5"
                  rows={2}
                  name="building_styles"
                  value={builderData.building_styles}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.building_styles ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.building_styles && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.building_styles}
                  </p>
                )}
              </div>

              {/* 6. ¿Has sido Builder en algún otro servidor?* */}
              <div id="field-previous_builder_exp" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  6. ¿Has sido Builder en algún otro servidor? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q6"
                  rows={2}
                  name="previous_builder_exp"
                  value={builderData.previous_builder_exp}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.previous_builder_exp ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.previous_builder_exp && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.previous_builder_exp}
                  </p>
                )}
              </div>

              {/* 7. ¿Tienes experiencia trabajando en equipo?* */}
              <div id="field-teamwork_exp" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  7. ¿Tienes experiencia trabajando en equipo? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q7"
                  rows={2}
                  name="teamwork_exp"
                  value={builderData.teamwork_exp}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.teamwork_exp ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.teamwork_exp && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.teamwork_exp}
                  </p>
                )}
              </div>

              {/* 8. ¿Cuánto tiempo puedes dedicar al servidor semanalmente?* */}
              <div id="field-weekly_time" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  8. ¿Cuánto tiempo puedes dedicar al servidor semanalmente? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q8"
                  rows={2}
                  name="weekly_time"
                  value={builderData.weekly_time}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.weekly_time ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.weekly_time && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.weekly_time}
                  </p>
                )}
              </div>

              {/* 9. ¿Qué programas o herramientas de construcción utilizas?* */}
              <div id="field-tools_programs" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  9. ¿Qué programas o herramientas de construcción utilizas? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q9"
                  rows={2}
                  name="tools_programs"
                  value={builderData.tools_programs}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.tools_programs ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.tools_programs && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.tools_programs}
                  </p>
                )}
              </div>

              {/* 10. ¿Por qué quieres formar parte del equipo de Builders?* */}
              <div id="field-why_join_builders" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  10. ¿Por qué quieres formar parte del equipo de Builders? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q10"
                  rows={3}
                  name="why_join_builders"
                  value={builderData.why_join_builders}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.why_join_builders ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.why_join_builders && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.why_join_builders}
                  </p>
                )}
              </div>

              {/* 11. ¿Qué aportarías al equipo de construcción?* */}
              <div id="field-contributions" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  11. ¿Qué aportarías al equipo de construcción? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q11"
                  rows={3}
                  name="contributions"
                  value={builderData.contributions}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.contributions ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.contributions && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.contributions}
                  </p>
                )}
              </div>

              {/* 12. ¿Cómo reaccionarías si un Staff te pide modificar una construcción?* */}
              <div id="field-staff_modify_reaction" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  12. ¿Cómo reaccionarías si un Staff te pide modificar una construcción? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q12"
                  rows={3}
                  name="staff_modify_reaction"
                  value={builderData.staff_modify_reaction}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.staff_modify_reaction ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.staff_modify_reaction && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.staff_modify_reaction}
                  </p>
                )}
              </div>

              {/* 13. ¿Te comprometes a respetar las normas del servidor y del equipo?* */}
              <div id="field-rules_commitment" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  13. ¿Te comprometes a respetar las normas del servidor y del equipo? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q13"
                  rows={2}
                  name="rules_commitment"
                  value={builderData.rules_commitment}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.rules_commitment ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.rules_commitment && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.rules_commitment}
                  </p>
                )}
              </div>

              {/* 14. ¿Hay algo más que quieras añadir sobre ti?* */}
              <div id="field-additional_info" className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  14. ¿Hay algo más que quieras añadir sobre ti? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="input-builder-q14"
                  rows={3}
                  name="additional_info"
                  value={builderData.additional_info}
                  onChange={handleBuilderChange}
                  className={`w-full bg-[#0b0e16] border ${
                    errors.additional_info ? 'border-rose-500' : 'border-[#222c3f]'
                  } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-amber-500 transition-colors`}
                />
                {errors.additional_info && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.additional_info}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             FORMULARIO PARA STAFF (13 PREGUNTAS)
             ========================================================================= */
          <div className="space-y-8">
            {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
            <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-[#1e2638] pb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wide">
                    INFORMACIÓN PERSONAL
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Datos de contacto y verificación
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Discord Username */}
                <div id="field-staff-discord_username" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    1. ¿Cuál es tu usuario de Discord? <span className="text-blue-400">*</span>
                  </label>
                  <input
                    id="input-staff-discord_username"
                    type="text"
                    name="discord_username"
                    value={staffData.discord_username}
                    onChange={handleStaffChange}
                    placeholder="Usuario de Discord"
                    className={`w-full bg-[#0b0e16] border ${
                      errors.discord_username ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                  />
                  {errors.discord_username && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.discord_username}
                    </p>
                  )}
                </div>

                {/* 2. Discord ID */}
                <div id="field-staff-discord_id" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-200">
                      2. ¿Cuál es tu ID de Discord? <span className="text-blue-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDiscordIdHelp(!showDiscordIdHelp)}
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>¿Cómo obtener mi ID?</span>
                    </button>
                  </div>

                  <input
                    id="input-staff-discord_id"
                    type="text"
                    name="discord_id"
                    value={staffData.discord_id}
                    onChange={handleStaffChange}
                    placeholder="ID de Discord"
                    className={`w-full bg-[#0b0e16] border ${
                      errors.discord_id ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm font-mono focus:border-blue-500 transition-colors`}
                  />

                  {showDiscordIdHelp && (
                    <div className="p-3 bg-[#151b29] border border-blue-500/20 rounded-lg text-xs text-slate-300 space-y-1">
                      <p className="font-semibold text-blue-300">Cómo copiar tu ID de Discord:</p>
                      <p>1. Ajustes de Discord &gt; Avanzado &gt; Activar <strong>Modo Desarrollador</strong>.</p>
                      <p>2. Clic derecho a tu perfil &gt; <strong>Copiar ID de usuario</strong>.</p>
                    </div>
                  )}

                  {errors.discord_id && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.discord_id}
                    </p>
                  )}
                </div>

                {/* 3. Minecraft Username */}
                <div id="field-staff-minecraft_username" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    3. ¿Cuál es tu usuario de Minecraft? <span className="text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-staff-minecraft_username"
                      type="text"
                      name="minecraft_username"
                      value={staffData.minecraft_username}
                      onChange={handleStaffChange}
                      placeholder="Usuario de Minecraft"
                      className={`w-full bg-[#0b0e16] border ${
                        errors.minecraft_username ? 'border-rose-500' : 'border-[#222c3f]'
                      } rounded-xl pl-4 pr-12 py-3 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                    />
                    {staffData.minecraft_username.trim().length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <img
                          src={`https://mc-heads.net/avatar/${staffData.minecraft_username.trim()}/24`}
                          alt="MC Skin Head"
                          className="w-6 h-6 rounded bg-slate-800"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {errors.minecraft_username && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.minecraft_username}
                    </p>
                  )}
                </div>

                {/* 4. Age */}
                <div id="field-staff-age" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    4. ¿Cuántos años tienes? <span className="text-blue-400">*</span>
                  </label>
                  <input
                    id="input-staff-age"
                    type="number"
                    name="age"
                    min="1"
                    max="99"
                    value={staffData.age === '' ? '' : staffData.age}
                    onChange={handleStaffChange}
                    placeholder="Edad"
                    className={`w-full bg-[#0b0e16] border ${
                      errors.age ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                  />
                  <p className="text-[11px] text-slate-500">Requisito mínimo: 16 años.</p>
                  {errors.age && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.age}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: INFORMACIÓN SOBRE EL POSTULANTE */}
            <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-[#1e2638] pb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wide">
                    INFORMACIÓN SOBRE EL POSTULANTE
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Motivación, disponibilidad horaria y trayectoria
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* 5. Why apply */}
                <div id="field-staff-why_apply" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    5. ¿Por qué quieres postularte? <span className="text-blue-400">*</span>
                  </label>
                  <textarea
                    id="input-staff-why_apply"
                    name="why_apply"
                    rows={3}
                    value={staffData.why_apply}
                    onChange={handleStaffChange}
                    className={`w-full bg-[#0b0e16] border ${
                      errors.why_apply ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                  />
                  {errors.why_apply && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.why_apply}
                    </p>
                  )}
                </div>

                {/* 6. Available time */}
                <div id="field-staff-available_time" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    6. ¿Cuánto tiempo le puedes dedicar al servidor? <span className="text-blue-400">*</span>
                  </label>
                  <textarea
                    id="input-staff-available_time"
                    name="available_time"
                    rows={2}
                    value={staffData.available_time}
                    onChange={handleStaffChange}
                    className={`w-full bg-[#0b0e16] border ${
                      errors.available_time ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                  />
                  {errors.available_time && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.available_time}
                    </p>
                  )}
                </div>

                {/* 7. About user */}
                <div id="field-staff-about_user" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    7. Háblanos un poco de cómo eres <span className="text-blue-400">*</span>
                  </label>
                  <textarea
                    id="input-staff-about_user"
                    name="about_user"
                    rows={3}
                    value={staffData.about_user}
                    onChange={handleStaffChange}
                    className={`w-full bg-[#0b0e16] border ${
                      errors.about_user ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                  />
                  {errors.about_user && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.about_user}
                    </p>
                  )}
                </div>

                {/* 8. Server experience */}
                <div id="field-staff-server_experience" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    8. ¿Tienes experiencia en otros servidores? ¿Cuáles? <span className="text-blue-400">*</span>
                  </label>
                  <textarea
                    id="input-staff-server_experience"
                    name="server_experience"
                    rows={3}
                    value={staffData.server_experience}
                    onChange={handleStaffChange}
                    className={`w-full bg-[#0b0e16] border ${
                      errors.server_experience ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                  />
                  {errors.server_experience && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.server_experience}
                    </p>
                  )}
                </div>

                {/* 9. Why left */}
                <div id="field-staff-why_left" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    9. Si fuiste Staff en otros servidores, ¿por qué te fuiste?
                  </label>
                  <p className="text-xs text-slate-400 italic">
                    (Si en la anterior pusiste que no, no hace falta responder esta pregunta)
                  </p>
                  <textarea
                    id="input-staff-why_left"
                    name="why_left"
                    rows={2}
                    value={staffData.why_left}
                    onChange={handleStaffChange}
                    className="w-full bg-[#0b0e16] border border-[#222c3f] rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: PREGUNTAS DE STAFF */}
            <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-[#1e2638] pb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wide">
                    PREGUNTAS DE STAFF
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Criterio de moderación y situaciones
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* 10. Why choose me */}
                <div id="field-staff-why_choose_me" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    10. ¿Por qué te deberíamos de escoger a ti y no a otra persona? <span className="text-blue-400">*</span>
                  </label>
                  <textarea
                    id="input-staff-why_choose_me"
                    name="why_choose_me"
                    rows={3}
                    value={staffData.why_choose_me}
                    onChange={handleStaffChange}
                    className={`w-full bg-[#0b0e16] border ${
                      errors.why_choose_me ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                  />
                  {errors.why_choose_me && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.why_choose_me}
                    </p>
                  )}
                </div>

                {/* 11. Teamwork */}
                <div id="field-staff-teamwork" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    11. ¿Eres bueno trabajando en equipo? <span className="text-blue-400">*</span>
                  </label>
                  <textarea
                    id="input-staff-teamwork"
                    name="teamwork"
                    rows={3}
                    value={staffData.teamwork}
                    onChange={handleStaffChange}
                    className={`w-full bg-[#0b0e16] border ${
                      errors.teamwork ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                  />
                  {errors.teamwork && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.teamwork}
                    </p>
                  )}
                </div>

                {/* 12. Chat conflict */}
                <div id="field-staff-chat_conflict" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    12. Si hay dos usuarios peleando en el chat, ¿cómo actuarías? <span className="text-blue-400">*</span>
                  </label>
                  <textarea
                    id="input-staff-chat_conflict"
                    name="chat_conflict"
                    rows={3}
                    value={staffData.chat_conflict}
                    onChange={handleStaffChange}
                    className={`w-full bg-[#0b0e16] border ${
                      errors.chat_conflict ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                  />
                  {errors.chat_conflict && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.chat_conflict}
                    </p>
                  )}
                </div>

                {/* 13. Corrupt staff */}
                <div id="field-staff-corrupt_staff" className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-200">
                    13. Si sospechas que un Staff está siendo corrupto, ¿cómo actuarías? <span className="text-blue-400">*</span>
                  </label>
                  <textarea
                    id="input-staff-corrupt_staff"
                    name="corrupt_staff"
                    rows={3}
                    value={staffData.corrupt_staff}
                    onChange={handleStaffChange}
                    className={`w-full bg-[#0b0e16] border ${
                      errors.corrupt_staff ? 'border-rose-500' : 'border-[#222c3f]'
                    } rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors`}
                  />
                  {errors.corrupt_staff && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.corrupt_staff}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Section */}
        <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-400 max-w-md">
            Al hacer clic en enviar, confirmas que toda la información provista es real y te comprometes a respetar las normativas de CL | BUILDERS Nautic MC.
          </div>

          <button
            id="submit-application-btn"
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-8 py-4 font-extrabold text-base sm:text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer uppercase tracking-wider ${
              role === 'BUILDER'
                ? 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-amber-500/25'
                : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-600/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>ENVIANDO...</span>
              </>
            ) : (
              <>
                <span>ENVIAR POSTULACIÓN PARA {role}</span>
                <Send className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
