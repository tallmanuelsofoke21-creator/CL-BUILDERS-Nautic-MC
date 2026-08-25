import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, ArrowLeft, AlertCircle, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, username: string) => void;
  onBackToHome: () => void;
}

const REQUIRED_STAFF_PIN = '211516';

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToHome,
}) => {
  // Step 1: PIN verification gate, Step 2: Staff Username & Password
  const [pinVerified, setPinVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('nautic_staff_pin_verified') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Step 2 Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (pinInput.trim() === REQUIRED_STAFF_PIN) {
      sessionStorage.setItem('nautic_staff_pin_verified', 'true');
      setPinVerified(true);
      setPinError(null);
    } else {
      setPinError('PIN de seguridad incorrecto. Acceso restringido.');
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Por favor ingresa tu usuario y contraseña de administrador.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Credenciales inválidas.');
      } else {
        localStorage.setItem('nautic_admin_token', data.token);
        localStorage.setItem('nautic_admin_user', data.username);
        onLoginSuccess(data.token, data.username);
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 max-w-md mx-auto px-4 sm:px-6">
      {/* Back Button */}
      <button
        id="admin-login-back-btn"
        onClick={onBackToHome}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Volver a la página principal</span>
      </button>

      {!pinVerified ? (
        /* STEP 1: SECURITY PIN GATE */
        <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400 mb-3 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Verificación de Seguridad
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Ingresa el PIN de seguridad para acceder al panel de identificación del Staff.
            </p>
          </div>

          {pinError && (
            <div
              id="admin-pin-error"
              className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                PIN de Acceso (6 dígitos)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="admin-security-pin-input"
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPinInput(val);
                    if (pinError) setPinError(null);
                  }}
                  placeholder="••••••"
                  className="w-full bg-[#0b0e16] border border-[#222c3f] rounded-xl pl-10 pr-11 py-3 text-white placeholder-slate-600 text-center font-mono tracking-widest text-lg focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="admin-pin-submit-btn"
              type="submit"
              disabled={pinInput.length < 6}
              className="w-full mt-2 py-3.5 px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>DESBLOQUEAR ACCESO</span>
            </button>
          </form>
        </div>
      ) : (
        /* STEP 2: STAFF LOGIN (USERNAME & PASSWORD) */
        <div className="bg-[#121620] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 mb-3 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Acceso Panel de Staff
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              CL | BUILDERS Nautic MC • Área Administrativa Privada
            </p>
          </div>

          {error && (
            <div
              id="admin-login-error"
              className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Usuario Administrador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username-input"
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuario"
                  className="w-full bg-[#0b0e16] border border-[#222c3f] rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full bg-[#0b0e16] border border-[#222c3f] rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>INICIAR SESIÓN</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

