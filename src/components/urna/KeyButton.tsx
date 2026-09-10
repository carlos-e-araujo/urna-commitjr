"use client";

import React, { useState } from "react";
import { soundEffects } from "@/lib/audio/soundEffects";

export type KeyButtonVariant = "digit" | "branco" | "corrige" | "confirma";

interface KeyButtonProps {
  label: string;
  variant?: KeyButtonVariant;
  subLabel?: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export const KeyButton: React.FC<KeyButtonProps> = ({
  label,
  variant = "digit",
  subLabel,
  onClick,
  className = "",
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    soundEffects.playKeySound();
    onClick();
  };

  const handlePointerDown = () => {
    if (!disabled) setIsPressed(true);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "branco":
        return "bg-slate-100 text-zinc-900 border-t border-zinc-200 hover:bg-white active:bg-slate-200 text-xs sm:text-sm font-bold uppercase";
      case "corrige":
        return "bg-orange-600 text-zinc-950 hover:bg-orange-500 active:bg-orange-700 text-xs sm:text-sm font-bold uppercase";
      case "confirma":
        return "bg-emerald-600 text-zinc-950 hover:bg-emerald-500 active:bg-emerald-700 text-xs sm:text-sm font-extrabold uppercase";
      case "digit":
      default:
        return "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-black text-xl sm:text-2xl md:text-3xl font-bold font-mono";
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      disabled={disabled}
      className={`urna-key-3d rounded-sm select-none transition-all flex flex-col items-center justify-center cursor-pointer ${
        isPressed ? "key-pressed" : ""
      } ${getVariantStyles()} ${className}`}
    >
      <span>{label}</span>
      {subLabel && (
        <span className="text-[9px] sm:text-[10px] opacity-70 font-sans tracking-tight">
          {subLabel}
        </span>
      )}
    </button>
  );
};
