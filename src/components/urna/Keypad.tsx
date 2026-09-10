"use client";

import React from "react";
import Image from "next/image";
import { KeyButton } from "./KeyButton";

interface KeypadProps {
  onNumber: (digit: string) => void;
  onBranco: () => void;
  onCorrige: () => void;
  onConfirma: () => void;
  disabled?: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({
  onNumber,
  onBranco,
  onCorrige,
  onConfirma,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col justify-between bg-zinc-900 border-2 sm:border-4 border-zinc-800 rounded-sm p-1.5 sm:p-4 md:p-5 select-none h-full shadow-inner overflow-hidden">
      {/* Keypad Header with Coat of Arms */}
      <div className="flex items-center justify-between pb-1 mb-1 sm:pb-2 sm:mb-2 border-b border-zinc-700 shrink-0">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <div className="relative w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 shrink-0">
            <Image
              src="/assets/images/brasao.png"
              alt="Brasão"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="text-[9px] sm:text-xs font-black tracking-widest text-zinc-100 uppercase block leading-tight">
              JUSTIÇA ELEITORAL
            </span>
            <span className="text-[7.5px] sm:text-[9px] font-semibold text-zinc-400 block tracking-wider leading-tight">
              COMMIT JR. ELEIÇÕES
            </span>
          </div>
        </div>
      </div>

      {/* Numeric Keypad (1-9, 0) */}
      <div className="flex-1 flex flex-col justify-center my-0.5 sm:my-2 min-h-0">
        <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-2.5 max-w-[210px] sm:max-w-[280px] md:max-w-[320px] mx-auto w-full">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <KeyButton
              key={num}
              label={num}
              variant="digit"
              onClick={() => onNumber(num)}
              disabled={disabled}
              className="h-7 sm:h-10 md:h-12 lg:h-14"
            />
          ))}
          {/* Row 4: Empty, 0, Empty */}
          <div />
          <KeyButton
            label="0"
            variant="digit"
            onClick={() => onNumber("0")}
            disabled={disabled}
            className="h-7 sm:h-10 md:h-12 lg:h-14"
          />
          <div />
        </div>
      </div>

      {/* Action Buttons: BRANCO, CORRIGE, CONFIRMA */}
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-2 pt-1 sm:pt-2 border-t border-zinc-700 max-w-[250px] sm:max-w-[340px] mx-auto w-full items-end shrink-0">
        <KeyButton
          label="BRANCO"
          variant="branco"
          onClick={onBranco}
          disabled={disabled}
          className="h-7 sm:h-10 md:h-12 lg:h-14"
        />
        <KeyButton
          label="CORRIGE"
          variant="corrige"
          onClick={onCorrige}
          disabled={disabled}
          className="h-7 sm:h-10 md:h-12 lg:h-14"
        />
        <KeyButton
          label="CONFIRMA"
          variant="confirma"
          onClick={onConfirma}
          disabled={disabled}
          className="h-8 sm:h-12 md:h-14 lg:h-16"
        />
      </div>
    </div>
  );
};
