"use client";

import { useEffect } from "react";
import { soundEffects } from "@/lib/audio/soundEffects";

interface PhysicalKeyboardHandlers {
  onNumber: (digit: string) => void;
  onBranco: () => void;
  onCorrige: () => void;
  onConfirma: () => void;
  disabled?: boolean;
}

export function usePhysicalKeyboard({
  onNumber,
  onBranco,
  onCorrige,
  onConfirma,
  disabled = false,
}: PhysicalKeyboardHandlers) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore keystrokes when typing inside inputs or textareas
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key;

      if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        soundEffects.playKeySound();
        onNumber(key);
      } else if (key === "Backspace" || key === "Escape" || key === "Delete") {
        event.preventDefault();
        soundEffects.playKeySound();
        onCorrige();
      } else if (key === "Enter") {
        event.preventDefault();
        soundEffects.playKeySound();
        onConfirma();
      } else if (key === "b" || key === "B") {
        event.preventDefault();
        soundEffects.playKeySound();
        onBranco();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onNumber, onBranco, onCorrige, onConfirma, disabled]);
}
