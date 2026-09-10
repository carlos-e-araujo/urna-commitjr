"use client";

import React from "react";
import { UrnaContainer } from "@/components/urna/UrnaContainer";
import { DisplayLCD } from "@/components/urna/DisplayLCD";
import { Keypad } from "@/components/urna/Keypad";
import { TelaFim } from "@/components/urna/TelaFim";
import { useVotingMachine } from "@/hooks/useVotingMachine";
import { usePhysicalKeyboard } from "@/hooks/usePhysicalKeyboard";
import { useAudio } from "@/hooks/useAudio";

export default function HomePage() {
  // Initialize audio engine
  useAudio();

  const {
    currentRole,
    digits,
    digitsRequired,
    candidate,
    isBlank,
    isNull,
    isFinal,
    handleNumber,
    handleBranco,
    handleCorrige,
    handleConfirma,
    resetVoting,
  } = useVotingMachine();

  // Listen for physical keyboard input
  usePhysicalKeyboard({
    onNumber: handleNumber,
    onBranco: handleBranco,
    onCorrige: handleCorrige,
    onConfirma: handleConfirma,
    disabled: isFinal,
  });

  return (
    <UrnaContainer headerTitle="JUSTIÇA ELEITORAL">
      {/* Left / Top Side: LCD Screen or Final Screen */}
      <div className="lg:col-span-7 h-full flex flex-col min-h-0">
        {isFinal ? (
          <TelaFim onRestart={resetVoting} autoRestartDelaySeconds={8} />
        ) : (
          <DisplayLCD
            role={currentRole}
            digitsRequired={digitsRequired}
            digits={digits}
            candidate={candidate}
            isBlank={isBlank}
            isNull={isNull}
          />
        )}
      </div>

      {/* Right / Bottom Side: Keypad */}
      <div className="lg:col-span-5 h-full flex flex-col min-h-0">
        <Keypad
          onNumber={handleNumber}
          onBranco={handleBranco}
          onCorrige={handleCorrige}
          onConfirma={handleConfirma}
          disabled={isFinal}
        />
      </div>
    </UrnaContainer>
  );
}
