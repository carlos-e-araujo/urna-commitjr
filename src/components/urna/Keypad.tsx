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
    <div className="flex flex-col justify-between bg-zinc-900 border-4 border-zinc-800 rounded-sm p-3 sm:p-4 md:p-5 select-none h-full shadow-inner">
      {/* Keypad Header with Coat of Arms */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-700">
        <div className="flex items-center space-x-2">
          <div className="relative w-6 h-6 sm:w-8 sm:h-8">
            <Image
              src="/assets/images/brasao.png"
              alt="Brasão"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-black tracking-widest text-zinc-100 uppercase block">
              JUSTIÇA ELEITORAL
            </span>
            <span className="text-[8px] sm:text-[9px] font-semibold text-zinc-400 block tracking-wider">
              COMMIT JR. ELEIÇÕES
            </span>
          </div>
        </div>
      </div>

      {/* Numeric Keypad (1-9, 0) */}
      <div className="flex-1 flex flex-col justify-center my-1 sm:my-2">
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[280px] sm:max-w-[320px] mx-auto w-full">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <KeyButton
              key={num}
              label={num}
              variant="digit"
              onClick={() => onNumber(num)}
              disabled={disabled}
              className="h-10 sm:h-12 md:h-14"
            />
          ))}
          {/* Row 4: Empty, 0, Empty */}
          <div />
          <KeyButton
            label="0"
            variant="digit"
            onClick={() => onNumber("0")}
            disabled={disabled}
            className="h-10 sm:h-12 md:h-14"
          />
          <div />
        </div>
      </div>

      {/* Action Buttons: BRANCO, CORRIGE, CONFIRMA */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 border-t border-zinc-700 max-w-[340px] mx-auto w-full items-end">
        <KeyButton
          label="BRANCO"
          variant="branco"
          onClick={onBranco}
          disabled={disabled}
          className="h-10 sm:h-12 md:h-14"
        />
        <KeyButton
          label="CORRIGE"
          variant="corrige"
          onClick={onCorrige}
          disabled={disabled}
          className="h-10 sm:h-12 md:h-14"
        />
        <KeyButton
          label="CONFIRMA"
          variant="confirma"
          onClick={onConfirma}
          disabled={disabled}
          className="h-12 sm:h-14 md:h-16"
        />
      </div>
    </div>
  );
};
