"use client";

import React from "react";
import Image from "next/image";

interface CandidatePreviewProps {
  photoUrl?: string | null;
  name?: string | null;
  roleLabel?: string | null;
  isVisible: boolean;
}

export const CandidatePreview: React.FC<CandidatePreviewProps> = ({
  photoUrl,
  name,
  roleLabel,
  isVisible,
}) => {
  if (!isVisible || !photoUrl) {
    return (
      <div className="w-16 sm:w-24 md:w-32 lg:w-36 h-20 sm:h-28 md:h-36 lg:h-44 border sm:border-2 border-dashed border-zinc-400/60 bg-zinc-200/50 flex flex-col items-center justify-center p-1 text-center rounded-sm shrink-0">
        <span className="text-[8px] sm:text-[10px] md:text-xs text-zinc-400 uppercase font-mono">
          Sem foto
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-white border sm:border-2 border-zinc-800 shadow-xs p-0.5 sm:p-1 shrink-0">
      <div className="relative w-16 sm:w-24 md:w-32 lg:w-36 h-16 sm:h-24 md:h-32 lg:h-38 overflow-hidden bg-zinc-100">
        <Image
          src={photoUrl}
          alt={name || "Candidato"}
          fill
          sizes="(max-width: 640px) 64px, (max-width: 768px) 96px, 144px"
          className="object-cover object-top"
          priority
        />
      </div>
      {roleLabel && (
        <span className="text-[7px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-zinc-700 mt-0.5 sm:mt-1 truncate max-w-[64px] sm:max-w-none">
          {roleLabel}
        </span>
      )}
    </div>
  );
};
