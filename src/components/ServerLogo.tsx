import React from 'react';

interface ServerLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const ServerLogo: React.FC<ServerLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`${sizeMap[size]} relative flex-shrink-0 rounded-full bg-gradient-to-b from-[#1e293b] to-[#0f172a] p-0.5 shadow-lg shadow-blue-950/40 ring-2 ring-blue-500/30 overflow-hidden group`}
      >
        {/* Outer subtle glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-blue-500/20 to-cyan-400/20 opacity-80" />
        
        {/* Custom SVG recreation of CL BUILDER logo */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-full relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#fba36e" />
            </linearGradient>
            <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle cx="50" cy="50" r="48" fill="url(#bgGrad)" stroke="#3b82f6" strokeWidth="2" />
          
          {/* City skyline silhouettes */}
          <path
            d="M15 65 H22 V50 H30 V65 H36 V42 H46 V65 H54 V46 H64 V65 H72 V52 H80 V65 H85 V75 H15 Z"
            fill="#334155"
            opacity="0.6"
          />
          {/* Building windows */}
          <circle cx="26" cy="55" r="1" fill="#fbbf24" opacity="0.8" />
          <circle cx="41" cy="48" r="1" fill="#38bdf8" opacity="0.8" />
          <circle cx="41" cy="54" r="1" fill="#fbbf24" opacity="0.8" />
          <circle cx="59" cy="52" r="1" fill="#38bdf8" opacity="0.8" />
          <circle cx="76" cy="58" r="1" fill="#fbbf24" opacity="0.8" />

          {/* Minecraft / Chibi Builder Character */}
          {/* Body/Shirt */}
          <path d="M36 62 L44 56 L56 56 L64 62 L60 76 L40 76 Z" fill="#1e3a8a" />
          {/* Orange reflective safety vest */}
          <path d="M42 56 L50 63 L58 56 L56 74 L44 74 Z" fill="#ea580c" />
          <line x1="44" y1="65" x2="56" y2="65" stroke="#fef08a" strokeWidth="2" />
          <line x1="45" y1="70" x2="55" y2="70" stroke="#fef08a" strokeWidth="2" />

          {/* Face */}
          <rect x="39" y="32" width="22" height="20" rx="3" fill="url(#skinGrad)" />
          {/* Eyes */}
          <rect x="42" y="38" width="4" height="4" rx="1" fill="#1e293b" />
          <rect x="54" y="38" width="4" height="4" rx="1" fill="#1e293b" />
          <circle cx="43" cy="39" r="0.8" fill="#ffffff" />
          <circle cx="55" cy="39" r="0.8" fill="#ffffff" />
          {/* Smile */}
          <path d="M47 46 Q50 49 53 46" stroke="#c2410c" strokeWidth="1.5" strokeLinecap="round" />

          {/* Yellow Construction Hard Hat */}
          <path
            d="M34 32 C34 22 42 16 50 16 C58 16 66 22 66 32 Z"
            fill="url(#goldGrad)"
          />
          {/* Hard Hat Rim */}
          <rect x="32" y="30" width="36" height="4.5" rx="2" fill="#ca8a04" />
          <line x1="50" y1="18" x2="50" y2="30" stroke="#fef08a" strokeWidth="2" />

          {/* Blueprint in hand / Tools */}
          <rect x="26" y="52" width="10" height="14" rx="1" transform="rotate(-15 26 52)" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
          <line x1="28" y1="56" x2="34" y2="54" stroke="#ffffff" strokeWidth="0.8" />
          <line x1="29" y1="60" x2="35" y2="58" stroke="#ffffff" strokeWidth="0.8" />

          {/* Wrench / Hammer on right */}
          <rect x="66" y="50" width="3" height="15" rx="1" transform="rotate(20 66 50)" fill="#94a3b8" />
          <circle cx="69" cy="49" r="3.5" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />

          {/* Banner bottom: "CL BUILDER" */}
          <rect x="18" y="74" width="64" height="17" rx="3.5" fill="#0b0f19" stroke="#eab308" strokeWidth="1.5" />
          <text
            x="50"
            y="85.5"
            textAnchor="middle"
            fill="url(#goldGrad)"
            fontSize="9.5"
            fontWeight="900"
            fontFamily="'Rajdhani', sans-serif"
            letterSpacing="0.05em"
          >
            CL BUILDER
          </text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-brand font-bold text-lg md:text-xl text-white tracking-wider">
              CL <span className="text-blue-500">|</span> BUILDERS
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
              Nautic MC
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Servidor Oficial de Minecraft & Discord
          </span>
        </div>
      )}
    </div>
  );
};
