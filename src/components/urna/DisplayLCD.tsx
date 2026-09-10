"use client";

import React from "react";
import { CandidatePreview } from "./CandidatePreview";

export interface DisplayCandidate {
  id?: string;
  name: string;
  number: string;
  role: string;
  photoUrl: string;
}

interface DisplayLCDProps {
  role: string;
  digitsRequired?: number;
  digits: string;
  candidate: DisplayCandidate | null;
  isBlank: boolean;
  isNull: boolean;
}

export const DisplayLCD: React.FC<DisplayLCDProps> = ({
  role,
  digitsRequired = 2,
  digits,
  candidate,
  isBlank,
  isNull,
}) => {
  const digitsArray = Array.from({ length: digitsRequired });
  const isFilled = digits.length >= digitsRequired;

  return (
    <div className="relative flex flex-col justify-between w-full h-full bg-[#f8fafc] text-zinc-900 border-2 sm:border-4 border-zinc-800 rounded-sm p-2 sm:p-4 md:p-5 select-none font-sans lcd-screen-shadow overflow-hidden">
      {/* Top Header */}
      <div className="shrink-0">
        <span className="text-[9px] sm:text-xs uppercase tracking-widest text-zinc-600 font-semibold block">
          Seu voto para
        </span>
        <h2 className="text-base sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
          {role}
        </h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center my-1 sm:my-2 min-h-0">
        {isBlank ? (
          <div className="flex flex-col items-center justify-center py-3 sm:py-6">
            <span className="text-xl sm:text-3xl md:text-4xl font-black text-zinc-800 tracking-wider animate-pulse">
              VOTO EM BRANCO
            </span>
          </div>
        ) : (
          <div className="flex flex-row justify-between items-center gap-2 sm:gap-4">
            {/* Left Column: Number boxes & Candidate Info */}
            <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-3">
              {/* Number Boxes */}
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-[11px] sm:text-sm md:text-base font-bold text-zinc-700 mr-0.5 sm:mr-1 shrink-0">
                  Número:
                </span>
                <div className="flex space-x-1 sm:space-x-2">
                  {digitsArray.map((_, index) => {
                    const digit = digits[index];
                    const isActive = index === digits.length && !isFilled;

                    return (
                      <div
                        key={index}
                        className={`w-7 h-9 sm:w-10 sm:h-13 md:w-12 md:h-16 border sm:border-2 flex items-center justify-center text-lg sm:text-2xl md:text-3xl font-mono font-black ${
                          isActive
                            ? "border-zinc-900 bg-zinc-100 animate-lcd-cursor"
                            : digit
                            ? "border-zinc-800 bg-white"
                            : "border-zinc-400 bg-zinc-50"
                        }`}
                      >
                        {digit || ""}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Candidate Info or Null Info */}
              {isFilled && candidate && (
                <div className="space-y-0.5 sm:space-y-1 pt-1 border-t border-zinc-300">
                  <div className="flex items-baseline space-x-1.5 sm:space-x-2 truncate">
                    <span className="text-[10px] sm:text-sm font-bold text-zinc-600 shrink-0">
                      Nome:
                    </span>
                    <span className="text-xs sm:text-base md:text-lg font-black uppercase text-zinc-900 truncate">
                      {candidate.name}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-1.5 sm:space-x-2">
                    <span className="text-[10px] sm:text-sm font-bold text-zinc-600 shrink-0">
                      Partido:
                    </span>
                    <span className="text-[10px] sm:text-sm font-semibold text-zinc-800">
                      Commit Jr.
                    </span>
                  </div>
                </div>
              )}

              {/* Null Vote indicator */}
              {isFilled && isNull && !candidate && (
                <div className="space-y-0.5 pt-1 border-t border-zinc-300">
                  <span className="text-[10px] sm:text-sm font-bold text-red-600 block">
                    NÚMERO ERRADO
                  </span>
                  <span className="text-sm sm:text-xl md:text-2xl font-black text-zinc-800 tracking-wide block animate-pulse">
                    VOTO NULO
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Candidate Photo (Positioned correctly on the right) */}
            <div className="shrink-0 flex justify-end items-center">
              <CandidatePreview
                photoUrl={candidate?.photoUrl}
                name={candidate?.name}
                roleLabel={role}
                isVisible={isFilled && !isNull && !!candidate}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Instructions */}
      <div className="border-t sm:border-t-2 border-zinc-400 pt-1 sm:pt-2 text-[8px] sm:text-xs text-zinc-700 shrink-0">
        <p className="font-bold mb-0.5 text-zinc-800 hidden sm:block">Aperte a tecla:</p>
        <div className="flex flex-row justify-between gap-1 sm:gap-2 text-[7.5px] sm:text-xs font-medium">
          <p className="text-emerald-800 truncate">
            <span className="font-bold text-emerald-900">VERDE</span> para CONFIRMAR
          </p>
          <p className="text-orange-800 truncate">
            <span className="font-bold text-orange-900">LARANJA</span> para REINICIAR
          </p>
        </div>
      </div>
    </div>
  );
};
