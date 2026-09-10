"use client";

import React from "react";
import { FileText, User } from "lucide-react";
import { CandidateVoteData } from "@/hooks/useVotingMachine";

interface ColinhaEleitorProps {
  currentRole: string;
  candidates: CandidateVoteData[];
}

export const ColinhaEleitor: React.FC<ColinhaEleitorProps> = ({
  currentRole,
  candidates,
}) => {
  // Filtra candidatos cadastrados para o cargo atual
  const roleCandidates = candidates.filter(
    (c) => c.role.trim().toLowerCase() === currentRole.trim().toLowerCase()
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 text-xs">
      {/* Label da Colinha */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="p-1 bg-zinc-800 text-zinc-200 rounded">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-[11px] sm:text-xs text-zinc-800 uppercase tracking-wide">
            Colinha do Eleitor:
          </span>
          <span className="font-bold text-[10px] sm:text-[11px] text-zinc-600 uppercase">
            ({currentRole})
          </span>
        </div>
      </div>

      {/* Lista de Candidatos para o Cargo Atual */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 scrollbar-none">
        {roleCandidates.length > 0 ? (
          roleCandidates.map((cand) => (
            <div
              key={cand.id || `${cand.role}-${cand.number}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-400 rounded shadow-xs text-zinc-900 shrink-0"
            >
              <span className="font-mono font-black text-xs sm:text-sm text-emerald-800 bg-emerald-100 border border-emerald-300/80 px-1.5 py-0.2 rounded shadow-2xs">
                {cand.number}
              </span>
              <span className="font-bold text-xs text-zinc-800 truncate max-w-[130px] sm:max-w-[200px]">
                {cand.name}
              </span>
            </div>
          ))
        ) : (
          <span className="text-[11px] text-zinc-500 italic">
            Nenhum candidato registrado para este cargo.
          </span>
        )}
      </div>
    </div>
  );
};
