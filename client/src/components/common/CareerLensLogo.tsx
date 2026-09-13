import React from 'react';

export const CareerLensLogo: React.FC<{ className?: string; size?: number }> = ({ className = "h-9 w-auto", size = 36 }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Left side glowing logo badge icon matching exact screenshot gradient */}
      <div className="relative flex items-center justify-center rounded-[14px] p-[2px] bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 shadow-[0_0_15px_rgba(6,182,212,0.45)] group-hover:scale-105 transition-transform duration-300">
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#070b14] text-cyan-400 p-1">
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]"
          >
            {/* Outer Target Lens Reticle */}
            <path d="M5 8V6a2 2 0 0 1 2-2h2" className="stroke-cyan-300" />
            <path d="M19 8V6a2 2 0 0 0-2-2h-2" className="stroke-cyan-300" />
            <path d="M5 16v2a2 2 0 0 0 2 2h2" className="stroke-cyan-300" />
            <path d="M19 16v2a2 2 0 0 1-2 2h-2" className="stroke-cyan-300" />
            {/* Inner Lens Circle */}
            <circle cx="12" cy="12" r="4.5" className="stroke-cyan-300" />
            <circle cx="12" cy="12" r="1.8" className="fill-cyan-200 stroke-none" />
            <line x1="12" y1="3" x2="12" y2="5" className="stroke-cyan-400" />
            <line x1="12" y1="19" x2="12" y2="21" className="stroke-cyan-400" />
            <line x1="3" y1="12" x2="5" y2="12" className="stroke-cyan-400" />
            <line x1="19" y1="12" x2="21" y2="12" className="stroke-cyan-400" />
          </svg>
        </div>
      </div>

      {/* Right side text matching screenshot colors */}
      <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white transition-colors duration-200">
        CareerLens <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent font-extrabold ml-0.5">AI</span>
      </span>
    </div>
  );
};
