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
    <div className="relative flex flex-col justify-between w-full h-full bg-[#f8fafc] text-zinc-900 border-4 border-zinc-800 rounded-sm p-3 sm:p-4 md:p-5 select-none font-sans lcd-screen-shadow overflow-hidden">
      {/* Top Header */}
      <div>
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-zinc-600 font-semibold block">
          Seu voto para
        </span>
        <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-zinc-900 mt-0.5 sm:mt-1">
          {role}
        </h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center my-2 sm:my-3">
        {isBlank ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-800 tracking-wider animate-pulse">
              VOTO EM BRANCO
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* Left Column: Number boxes & Candidate Info */}
            <div className="md:col-span-8 flex flex-col justify-center space-y-3">
              {/* Number Boxes */}
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm md:text-base font-bold text-zinc-700 mr-1">
                  Número:
                </span>
                <div className="flex space-x-1.5 sm:space-x-2">
                  {digitsArray.map((_, index) => {
                    const digit = digits[index];
                    const isActive = index === digits.length && !isFilled;

                    return (
                      <div
                        key={index}
                        className={`w-9 h-12 sm:w-11 sm:h-14 md:w-12 md:h-16 border-2 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-mono font-black ${
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
                <div className="space-y-1 sm:space-y-1.5 pt-1 border-t border-zinc-300">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xs sm:text-sm font-bold text-zinc-600">
                      Nome:
                    </span>
                    <span className="text-sm sm:text-base md:text-lg font-bold uppercase text-zinc-900 truncate">
                      {candidate.name}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xs sm:text-sm font-bold text-zinc-600">
                      Partido:
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-800">
                      Commit Jr.
                    </span>
                  </div>
                </div>
              )}

              {/* Null Vote indicator */}
              {isFilled && isNull && !candidate && (
                <div className="space-y-1 pt-1 border-t border-zinc-300">
                  <span className="text-xs sm:text-sm font-bold text-red-600 block">
                    NÚMERO ERRADO
                  </span>
                  <span className="text-lg sm:text-xl md:text-2xl font-black text-zinc-800 tracking-wide block animate-pulse">
                    VOTO NULO
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Candidate Photo */}
            <div className="md:col-span-4 flex justify-end md:justify-center items-center">
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
      <div className="border-t-2 border-zinc-400 pt-2 text-[10px] sm:text-xs text-zinc-700">
        <p className="font-semibold mb-0.5 text-zinc-800">Aperte a tecla:</p>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
          <p className="font-medium text-emerald-800">
            <span className="font-bold text-emerald-900">VERDE</span> para CONFIRMAR este voto
          </p>
          <p className="font-medium text-orange-800">
            <span className="font-bold text-orange-900">LARANJA</span> para REINICIAR este voto
          </p>
        </div>
      </div>
    </div>
  );
};
