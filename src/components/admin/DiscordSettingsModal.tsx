import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Save, 
  HelpCircle,
  Lock,
  Unlock,
  KeyRound,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface DiscordSettingsModalProps {
  adminToken: string;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export const DiscordSettingsModal: React.FC<DiscordSettingsModalProps> = ({
  adminToken,
  onClose,
  onSettingsSaved,
}) => {
  // Lock / Unlock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterUsernameInput, setMasterUsernameInput] = useState('');
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingMaster, setVerifyingMaster] = useState(false);

  // Settings State
  const [webhookUrl, setWebhookUrl] = useState('');
  const [maskedUrl, setMaskedUrl] = useState('');
  const [hasWebhook, setHasWebhook] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password Section State
  const [showChangePass, setShowChangePass] = useState(false);
  const [newMasterUsername, setNewMasterUsername] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    fetchInitialSettings();
  }, []);

  const fetchInitialSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMaskedUrl(data.masked_url || '');
        setHasWebhook(data.has_webhook || false);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterUsernameInput.trim() || !masterPasswordInput.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Debes ingresar el usuario y la contraseña especial del Dueño/Owner.',
      });
      return;
    }

    setVerifyingMaster(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/settings/verify-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          master_username: masterUsernameInput.trim(),
          master_password: masterPasswordInput.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setWebhookUrl(data.discord_webhook_url || '');
        setIsUnlocked(true);
        setStatusMessage({
          type: 'success',
          text: `🔓 ¡Bienvenido ${data.owner_username || 'Cristofer'}! Acceso de Dueño concedido.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Credenciales de Dueño incorrectas. Acceso restringido.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Error al verificar credenciales con el servidor.',
      });
    } finally {
      setVerifyingMaster(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    if (showChangePass && newMasterPassword) {
      if (newMasterPassword.length < 4) {
        setStatusMessage({
          type: 'error',
          text: 'La nueva contraseña especial debe tener al menos 4 caracteres.',
        });
        setSaving(false);
        return;
      }
      if (newMasterPassword !== confirmNewPassword) {
        setStatusMessage({
          type: 'error',
          text: 'Las dos contraseñas nuevas no coinciden.',
        });
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          master_username: masterUsernameInput.trim(),
          master_password: masterPasswordInput.trim(),
          discord_webhook_url: webhookUrl.trim(),
          new_master_username: showChangePass && newMasterUsername ? newMasterUsername.trim() : undefined,
          new_master_password: showChangePass && newMasterPassword ? newMasterPassword.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setHasWebhook(data.settings?.has_webhook || false);
        if (showChangePass) {
          if (newMasterUsername) setMasterUsernameInput(newMasterUsername.trim());
          if (newMasterPassword) setMasterPasswordInput(newMasterPassword.trim());
          setNewMasterUsername('');
          setNewMasterPassword('');
          setConfirmNewPassword('');
          setShowChangePass(false);
        }
        setStatusMessage({
          type: 'success',
          text: '✅ ¡Configuración del Webhook guardada exitosamente!',
        });
        if (onSettingsSaved) onSettingsSaved();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Error al guardar la configuración.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Error de conexión con el servidor.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Ingresa una URL de Webhook antes de enviar una prueba.',
      });
      return;
    }

    setTesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/webhook/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          master_username: masterUsernameInput.trim(),
          master_password: masterPasswordInput.trim(),
          webhook_url: webhookUrl.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: '🚀 ¡Prueba enviada con éxito! Revisa tu canal de Discord.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Error al enviar mensaje de prueba a Discord.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Error al comunicarse con el servidor.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRelock = () => {
    setIsUnlocked(false);
    setMasterUsernameInput('');
    setMasterPasswordInput('');
    setWebhookUrl('');
    setShowChangePass(false);
    setStatusMessage(null);
    fetchInitialSettings();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#0f131d] border-2 border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-6">
        
        {/* MODAL HEADER */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between transition-colors ${
          isUnlocked 
            ? 'bg-emerald-950/40 border-emerald-500/30' 
            : 'bg-[#131724] border-slate-800'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-md ${
              isUnlocked 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {isUnlocked ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  Webhook Discord • Área de Dueño
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                {isUnlocked 
                  ? 'Acceso desbloqueado como Dueño (Cristofer)' 
                  : 'Protegido con credenciales maestras contra modificaciones de terceros'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                onClick={handleRelock}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                title="Bloquear y salir del modo dueño"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STATUS MESSAGE BANNER */}
        {statusMessage && (
          <div className={`px-5 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 border-b border-emerald-600/50 text-emerald-200'
              : 'bg-rose-950/90 border-b border-rose-600/50 text-rose-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 space-y-5">

          {/* ========================================================================= */}
          {/* VIEW 1: LOCKED STATE (SOLO CRISTOFER CON SU CONTRASEÑA PUEDE ENTRAR) */}
          {/* ========================================================================= */}
          {!isUnlocked ? (
            <div className="space-y-5">
              
              {/* Security Alert Card */}
              <div className="bg-[#0b0e17] border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <span>Autenticación Exclusiva del Dueño</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para evitar filtraciones o cambios indebidos del Webhook por parte de otros miembros del staff o moderadores, esta sección solo puede ser abierta por <strong className="text-white">Cristofer</strong> con la clave maestra configurada.
                </p>
                <div className="pt-1 flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Estado actual del Webhook:</span>
                  {hasWebhook ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      ✓ Configurado ({maskedUrl})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                      Sin Webhook configurado
                    </span>
                  )}
                </div>
              </div>

              {/* Credentials Input Form */}
              <form onSubmit={handleUnlock} className="space-y-4">
                
                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>Usuario del Dueño</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={masterUsernameInput}
                    onChange={(e) => setMasterUsernameInput(e.target.value)}
                    placeholder="Usuario del Dueño"
                    className="w-full bg-[#070910] border border-[#263147] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 outline-none transition-all"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Contraseña Especial de Seguridad</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={masterPasswordInput}
                      onChange={(e) => setMasterPasswordInput(e.target.value)}
                      placeholder="Contraseña de Seguridad"
                      className="w-full bg-[#070910] border border-[#263147] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 outline-none pr-11 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>

                  <button
                    type="submit"
                    disabled={verifyingMaster || !masterUsernameInput.trim() || !masterPasswordInput.trim()}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>{verifyingMaster ? 'Verificando...' : 'Desbloquear Webhook'}</span>
                  </button>
                </div>
              </form>

            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: UNLOCKED STATE (PANEL COMPLETO DE GESTIÓN DE CRISTOFER) */
            /* ========================================================================= */
            <div className="space-y-6">

              {/* Verified Owner Banner */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-200">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Dueño Identificado: {masterUsernameInput || 'Cristofer'} • Edición Autorizada</span>
                </div>
                <button
                  onClick={handleRelock}
                  className="text-xs text-slate-300 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Bloquear de nuevo
                </button>
              </div>

              {/* Main Form */}
              <form onSubmit={handleSave} className="space-y-4">
                
                {/* Webhook Input Field */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-[#5865F2]" />
                      <span>URL del Webhook de Discord</span>
                    </span>
                    <span className="text-[11px] text-[#5865F2] font-bold">Canal de Resoluciones</span>
                  </label>
                  
                  <input
                    type="url"
                    required
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="URL del Webhook de Discord"
                    className="w-full bg-[#070a10] border border-[#232c3f] focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] rounded-xl px-4 py-3 text-white text-xs placeholder:text-slate-600 outline-none transition-colors font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    Aquí se enviarán las resoluciones de postulaciones con mención a los aspirantes sin revelar sus datos reales.
                  </p>
                </div>

                {/* Optional Change Master Credentials Accordion */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0a0d15]">
                  <button
                    type="button"
                    onClick={() => setShowChangePass(!showChangePass)}
                    className="w-full p-3 text-left text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between bg-[#0e121d] hover:bg-[#131826] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>{showChangePass ? 'Ocultar cambio de credenciales' : 'Cambiar Usuario o Contraseña del Dueño'}</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      {showChangePass ? '▲ Cerrar' : '▼ Modificar'}
                    </span>
                  </button>

                  {showChangePass && (
                    <div className="p-4 space-y-3 border-t border-slate-800">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-300">
                          Nuevo Nombre de Usuario del Dueño (Opcional)
                        </label>
                        <input
                          type="text"
                          value={newMasterUsername}
                          onChange={(e) => setNewMasterUsername(e.target.value)}
                          placeholder="Nuevo Usuario"
                          className="w-full bg-[#070910] border border-[#232c3f] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-300">
                          Nueva Contraseña Especial
                        </label>
                        <input
                          type="password"
                          value={newMasterPassword}
                          onChange={(e) => setNewMasterPassword(e.target.value)}
                          placeholder="Nueva Contraseña"
                          className="w-full bg-[#070910] border border-[#232c3f] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-300">
                          Confirmar Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirmar Contraseña"
                          className="w-full bg-[#070910] border border-[#232c3f] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={testing || !webhookUrl.trim()}
                    className="px-4 py-2.5 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 disabled:opacity-50 text-[#8a95ff] hover:text-white border border-[#5865F2]/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testing ? 'Probando en Discord...' : 'Enviar Mensaje de Prueba'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={saving || !webhookUrl.trim()}
                    className="px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#5865F2]/25 cursor-pointer uppercase tracking-wider"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
                  </button>
                </div>

              </form>

              {/* Guide Accordion */}
              <div className="bg-[#0b0e16] border border-[#1e2638] rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <HelpCircle className="w-4 h-4 text-[#5865F2]" />
                  <span>Instrucciones para Discord:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed text-[11px]">
                  <li>En Discord, ve a <strong className="text-slate-200">Ajustes del Canal</strong> donde quieres que salgan las resoluciones.</li>
                  <li>Entra en <strong className="text-slate-200">Integraciones → Webhooks → Crear Webhook</strong>.</li>
                  <li>Copia la URL del Webhook generada y pégala arriba.</li>
                </ol>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
