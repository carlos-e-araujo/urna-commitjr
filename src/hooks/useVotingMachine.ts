"use client";

import { useState, useCallback, useMemo } from "react";
import { soundEffects } from "@/lib/audio/soundEffects";
import seedCandidates from "@/data/seed-candidatos.json";

export interface CandidateVoteData {
  id?: string;
  name: string;
  number: string;
  role: string;
  photoUrl: string;
}

export interface VoteRecord {
  role: string;
  candidateId?: string | null;
  candidateNumber?: string | null;
  candidateName?: string | null;
  isBlank: boolean;
  isNull: boolean;
}

export interface UseVotingMachineOptions {
  candidates?: CandidateVoteData[];
  roles?: string[];
  digitsPerRole?: number;
  onFinish?: (votes: VoteRecord[]) => Promise<boolean | void> | boolean | void;
}

const DEFAULT_ROLES = [
  "Presidente",
  "Vice-Presidente",
  "Diretor de Gestão e Gente",
];

const DEFAULT_CANDIDATES: CandidateVoteData[] = seedCandidates.map((c) => ({
  name: c.nome,
  number: c.numero,
  role: c.cargo,
  photoUrl: c.foto_url,
}));

export function useVotingMachine(options: UseVotingMachineOptions = {}) {
  const roles = options.roles && options.roles.length > 0 ? options.roles : DEFAULT_ROLES;
  const candidates = options.candidates || DEFAULT_CANDIDATES;
  const digitsRequired = options.digitsPerRole || 2;

  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [digits, setDigits] = useState<string>("");
  const [isBlank, setIsBlank] = useState<boolean>(false);
  const [isFinal, setIsFinal] = useState<boolean>(false);
  const [recordedVotes, setRecordedVotes] = useState<VoteRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentRole = roles[currentRoleIndex] || roles[0];

  // Find candidate for current typed number and current role
  const candidate = useMemo<CandidateVoteData | null>(() => {
    if (isBlank || digits.length !== digitsRequired) return null;
    return (
      candidates.find(
        (c) =>
          c.role.toLowerCase() === currentRole.toLowerCase() &&
          c.number === digits
      ) || null
    );
  }, [candidates, currentRole, digits, isBlank, digitsRequired]);

  // Is null when all digits are filled but no candidate matches
  const isNull = useMemo<boolean>(() => {
    return !isBlank && digits.length === digitsRequired && candidate === null;
  }, [isBlank, digits, digitsRequired, candidate]);

  // Handle number input (0-9)
  const handleNumber = useCallback(
    (digit: string) => {
      if (isFinal) return;
      if (isBlank) {
        setIsBlank(false);
        setDigits(digit);
        return;
      }
      if (digits.length < digitsRequired) {
        setDigits((prev) => prev + digit);
      }
    },
    [isFinal, isBlank, digits.length, digitsRequired]
  );

  // Handle Branco
  const handleBranco = useCallback(() => {
    if (isFinal) return;
    setDigits("");
    setIsBlank(true);
  }, [isFinal]);

  // Handle Corrige
  const handleCorrige = useCallback(() => {
    if (isFinal) return;
    setDigits("");
    setIsBlank(false);
  }, [isFinal]);

  // Handle Confirma
  const handleConfirma = useCallback(async () => {
    if (isFinal) return;

    // Confirma only allowed if blank or all required digits filled
    const canConfirm = isBlank || digits.length === digitsRequired;
    if (!canConfirm) return;

    const newVote: VoteRecord = {
      role: currentRole,
      candidateId: candidate?.id || null,
      candidateNumber: candidate?.number || (!isBlank ? digits : null),
      candidateName: candidate?.name || null,
      isBlank: isBlank,
      isNull: isNull,
    };

    const updatedVotes = [...recordedVotes, newVote];
    setRecordedVotes(updatedVotes);

    if (currentRoleIndex < roles.length - 1) {
      // Advance to next role
      setCurrentRoleIndex((prev) => prev + 1);
      setDigits("");
      setIsBlank(false);
    } else {
      // Last role confirmed -> Finalize voting
      if (options.onFinish) {
        setIsSubmitting(true);
        try {
          const result = await options.onFinish(updatedVotes);
          if (result !== false) {
            setIsFinal(true);
            soundEffects.playEndSound();
          }
        } catch {
          // Handled by consumer
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setIsFinal(true);
        soundEffects.playEndSound();
      }
    }
  }, [
    isFinal,
    isBlank,
    digits,
    digitsRequired,
    currentRole,
    candidate,
    isNull,
    recordedVotes,
    currentRoleIndex,
    roles.length,
    options,
  ]);

  // Reset entire machine for next voter
  const resetVoting = useCallback(() => {
    setCurrentRoleIndex(0);
    setDigits("");
    setIsBlank(false);
    setIsFinal(false);
    setRecordedVotes([]);
    setIsSubmitting(false);
  }, []);

  return {
    roles,
    currentRole,
    currentRoleIndex,
    totalRoles: roles.length,
    digits,
    digitsRequired,
    candidate,
    isBlank,
    isNull,
    isFinal,
    recordedVotes,
    isSubmitting,
    handleNumber,
    handleBranco,
    handleCorrige,
    handleConfirma,
    resetVoting,
  };
}
