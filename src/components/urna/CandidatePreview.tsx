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
      <div className="w-24 sm:w-32 md:w-36 h-32 sm:h-40 md:h-44 border-2 border-dashed border-zinc-400/60 bg-zinc-200/50 flex flex-col items-center justify-center p-2 text-center rounded-sm">
        <span className="text-[10px] sm:text-xs text-zinc-400 uppercase font-mono">
          Sem foto
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-white border-2 border-zinc-800 shadow-sm p-1">
      <div className="relative w-24 sm:w-32 md:w-36 h-28 sm:h-36 md:h-40 overflow-hidden bg-zinc-100">
        <Image
          src={photoUrl}
          alt={name || "Candidato"}
          fill
          sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 144px"
          className="object-cover object-top"
          priority
        />
      </div>
      {roleLabel && (
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-700 mt-1">
          {roleLabel}
        </span>
      )}
    </div>
  );
};
