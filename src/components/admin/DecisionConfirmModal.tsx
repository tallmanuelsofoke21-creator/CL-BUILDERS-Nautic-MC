import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  Radio, 
  Gamepad2, 
  MessageSquare,
  Lock
} from 'lucide-react';
import { ApplicationItem, ApplicationStatus } from '../../types';

interface DecisionConfirmModalProps {
  application: ApplicationItem;
  targetStatus: 'ACEPTADA' | 'RECHAZADA';
  notifyDiscord: boolean;
  onClose: () => void;
  onConfirm: (data: {
    status: ApplicationStatus;
    reason: string;
    reviewer_minecraft: string;
    reviewer_discord: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export const DecisionConfirmModal: React.FC<DecisionConfirmModalProps> = ({
  application,
  targetStatus,
  notifyDiscord,
  onClose,
  onConfirm,
  isLoading,
}) => {
  // Try to pre-fill staff credentials from localStorage if stored previously
  const savedStaffMc = localStorage.getItem('staff_reviewer_mc') || '';
  const savedStaffDc = localStorage.getItem('staff_reviewer_dc') || '';

  const [reason, setReason] = useState(application.admin_notes || '');
  const [reviewerMc, setReviewerMc] = useState(savedStaffMc);
  const [reviewerDc, setReviewerDc] = useState(savedStaffDc);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAccepting = targetStatus === 'ACEPTADA';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const defaultReason = isAccepting
      ? 'Postulación Aceptada por la directiva de CL | BUILDERS Nautic MC.'
      : 'Postulación Rechazada tras la evaluación de la directiva.';

    const finalReason = reason.trim() || defaultReason;
    const finalMc = reviewerMc.trim() || 'Staff Directivo';
    const finalDc = reviewerDc.trim() || 'Staff Directivo';

    // Save staff credentials in localStorage for convenience in subsequent reviews
    if (reviewerMc.trim()) localStorage.setItem('staff_reviewer_mc', reviewerMc.trim());
    if (reviewerDc.trim()) localStorage.setItem('staff_reviewer_dc', reviewerDc.trim());

    await onConfirm({
      status: targetStatus,
      reason: finalReason,
      reviewer_minecraft: finalMc,
      reviewer_discord: finalDc,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#10141e] border-2 border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6">
        
        {/* Modal Top Banner */}
        <div className={`p-5 flex items-center justify-between border-b ${
          isAccepting 
            ? 'bg-emerald-950/70 border-emerald-500/30' 
            : 'bg-rose-950/70 border-rose-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isAccepting ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {isAccepting ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                {isAccepting ? 'Aceptar Postulación' : 'Rechazar Postulación'}
              </h3>
              <p className="text-xs text-slate-300">
                Postulante: <strong className="text-white">{application.minecraft_username}</strong> ({application.role})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="px-5 py-3 bg-rose-950/90 border-b border-rose-600/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {/* Privacy Note Badge */}
          <div className="bg-[#0b0e16] border border-slate-800 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              Tus datos de Staff (<strong className="text-slate-200">Nick MC y Discord</strong>) quedarán guardados <strong className="text-slate-200">exclusivamente en la página interna</strong> para saber quién tomó la decisión. <strong className="text-amber-400">No serán publicados en Discord.</strong>
            </span>
          </div>

          {/* 1. Motivo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
              <span>{isAccepting ? 'Motivo de Aceptación' : 'Razón de Rechazo'}</span>
              <span className="text-[11px] text-slate-400 font-normal">(Opcional / Por defecto)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={
                isAccepting
                  ? 'Motivo de aceptación (ej: Cumple con todos los requisitos y experiencia comprobable)...'
                  : 'Razón del rechazo (ej: No cumple con la edad mínima o falta de experiencia)...'
              }
              className="w-full bg-[#080a10] border border-[#232c3f] focus:border-blue-500 rounded-xl p-3 text-white text-xs placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* 2. Staff Evaluator Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Nick MC del Staff */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tu Nick de Minecraft</span>
              </label>
              <input
                type="text"
                value={reviewerMc}
                onChange={(e) => setReviewerMc(e.target.value)}
                placeholder="Tu Nick de Minecraft (Staff)"
                className="w-full bg-[#080a10] border border-[#232c3f] focus:border-blue-500 rounded-xl px-3 py-2.5 text-white text-xs placeholder-slate-500 outline-none"
              />
            </div>

            {/* Usuario de Discord del Staff */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
                <span>Tu Discord</span>
              </label>
              <input
                type="text"
                value={reviewerDc}
                onChange={(e) => setReviewerDc(e.target.value)}
                placeholder="Tu Usuario de Discord"
                className="w-full bg-[#080a10] border border-[#232c3f] focus:border-[#5865F2] rounded-xl px-3 py-2.5 text-white text-xs placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Discord Notice indicator */}
          <div className="bg-[#0b0e16] border border-[#1e2638] rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Radio className="w-4 h-4 text-[#5865F2]" />
              <span>Notificación a Discord:</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              notifyDiscord 
                ? 'bg-emerald-500/20 text-emerald-300' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {notifyDiscord ? 'Activada (Se enviará mención y embed)' : 'Desactivada'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                isAccepting
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              }`}
            >
              {isAccepting ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>
                {isLoading 
                  ? 'Procesando...' 
                  : isAccepting 
                    ? 'Confirmar Aceptación' 
                    : 'Confirmar Rechazo'}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
