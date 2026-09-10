"use client";

import { useEffect, useState, useCallback } from "react";
import { soundEffects } from "@/lib/audio/soundEffects";

export function useAudio() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    soundEffects.preload().then(() => {
      setIsReady(true);
    });
  }, []);

  const playKeySound = useCallback(() => {
    soundEffects.playKeySound();
  }, []);

  const playEndSound = useCallback(() => {
    soundEffects.playEndSound();
  }, []);

  const unlockAudio = useCallback(() => {
    soundEffects.unlock();
  }, []);

  return {
    playKeySound,
    playEndSound,
    unlockAudio,
    isReady,
  };
}
