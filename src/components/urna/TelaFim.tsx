"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

interface TelaFimProps {
  onRestart?: () => void;
  autoRestartDelaySeconds?: number;
}

export const TelaFim: React.FC<TelaFimProps> = ({
  onRestart,
  autoRestartDelaySeconds = 8,
}) => {
  const [countdown, setCountdown] = useState(autoRestartDelaySeconds);

  useEffect(() => {
    if (countdown <= 0) {
      if (onRestart) onRestart();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onRestart]);

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full bg-[#f8fafc] text-zinc-900 border-4 border-zinc-800 rounded-sm p-4 sm:p-6 select-none font-sans lcd-screen-shadow overflow-hidden">
      {/* Top indicator */}
      <div className="w-full flex justify-between items-center text-zinc-500 text-xs font-mono">
        <span>VOTAÇÃO ENCERRADA</span>
        <span className="flex items-center gap-1 text-emerald-600 font-bold">
          <CheckCircle2 className="w-4 h-4" /> VOTO GRAVADO
        </span>
      </div>

      {/* Big FIM Typography */}
      <div className="flex-1 flex flex-col items-center justify-center my-4">
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-widest text-zinc-950 animate-pulse select-none">
          FIM
        </h1>
        <div className="mt-2 sm:mt-4 px-4 py-1 bg-emerald-600 text-white text-xs sm:text-sm font-bold uppercase tracking-widest rounded-sm shadow-sm">
          VOTOU
        </div>
      </div>

      {/* Footer Info & Reset */}
      <div className="w-full border-t-2 border-zinc-300 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-600">
        <p className="text-center sm:text-left">
          Obrigado por votar nas eleições da <strong className="text-zinc-800">Commit Jr.</strong>
        </p>

        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Próximo Votante ({countdown}s)</span>
          </button>
        )}
      </div>
    </div>
  );
};
