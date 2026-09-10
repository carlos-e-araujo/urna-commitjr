"use client";

import React, { useEffect, useState, useCallback } from "react";
import { UrnaContainer } from "@/components/urna/UrnaContainer";
import { DisplayLCD } from "@/components/urna/DisplayLCD";
import { Keypad } from "@/components/urna/Keypad";
import { TelaFim } from "@/components/urna/TelaFim";
import { useVotingMachine, CandidateVoteData, VoteRecord } from "@/hooks/useVotingMachine";
import { usePhysicalKeyboard } from "@/hooks/usePhysicalKeyboard";
import { useAudio } from "@/hooks/useAudio";
import {
  getClientVoterSignature,
  hasLocallyVoted,
  markLocalVoted,
} from "@/lib/fingerprint/clientFingerprint";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";

interface ElectionInfo {
  id: string;
  title: string;
  status: "OPEN" | "DRAFT" | "CLOSED";
  roles: string[];
}

export default function HomePage() {
  // Inicializa engine de áudio Web Audio API
  useAudio();

  const [loading, setLoading] = useState<boolean>(true);
  const [election, setElection] = useState<ElectionInfo | null>(null);
  const [candidatesList, setCandidatesList] = useState<CandidateVoteData[]>([]);
  const [canVote, setCanVote] = useState<boolean>(false);
  const [blockReason, setBlockReason] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Carrega status da eleição e permissão do eleitor
  const checkStatus = useCallback(async () => {
    setLoading(true);
    setSubmitError(null);

    try {
      const voterSig = getClientVoterSignature();

      // 1. Busca verificação antecipada de voto e status da eleição
      const checkRes = await fetch(`/api/vote/check?voterSignature=${encodeURIComponent(voterSig)}`, {
        cache: "no-store",
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok || !checkData.electionId) {
        setCanVote(false);
        setBlockReason(checkData.reason || "Nenhuma eleição aberta no momento.");
        setElection(null);
        setLoading(false);
        return;
      }

      const electionId = checkData.electionId;

      // 2. Verifica se eleição não está aberta
      if (checkData.electionStatus !== "OPEN") {
        setCanVote(false);
        setBlockReason(
          checkData.reason ||
            (checkData.electionStatus === "DRAFT"
              ? "A eleição ainda não foi iniciada pela comissão eleitoral."
              : "A eleição foi encerrada.")
        );
        setElection({
          id: electionId,
          title: checkData.title || "Eleição Commit Jr.",
          status: checkData.electionStatus,
          roles: [],
        });
        setLoading(false);
        return;
      }

      // 3. Verifica se eleitor já votou localmente ou via servidor
      if (checkData.hasVoted || hasLocallyVoted(electionId)) {
        setCanVote(false);
        setBlockReason(
          checkData.reason ||
            "Seu voto já foi registrado para esta eleição. Obrigado pela participação!"
        );
        setElection({
          id: electionId,
          title: checkData.title || "Eleição Commit Jr.",
          status: "OPEN",
          roles: [],
        });
        setLoading(false);
        return;
      }

      // 4. Busca dados detalhados da eleição e lista de candidatos
      const activeRes = await fetch(`/api/election/active?_t=${Date.now()}`, { cache: "no-store" });
      const activeData = await activeRes.json();

      const candRes = await fetch(`/api/candidates?electionId=${electionId}&_t=${Date.now()}`, {
        cache: "no-store",
      });
      const candData = await candRes.json();

      const loadedRoles: string[] = Array.isArray(activeData.roles) ? activeData.roles : [];

      const loadedCandidates: CandidateVoteData[] =
        candData.candidates && Array.isArray(candData.candidates)
          ? candData.candidates.map((c: any) => ({
              id: c.id,
              name: c.name,
              number: c.number,
              role: c.role,
              photoUrl: c.photoUrl,
            }))
          : [];

      if (loadedCandidates.length === 0 || loadedRoles.length === 0) {
        setCanVote(false);
        setBlockReason("Nenhum candidato cadastrado para esta eleição.");
        setElection({
          id: electionId,
          title: activeData.title || checkData.title || "Eleição Commit Jr.",
          status: "OPEN",
          roles: [],
        });
        setCandidatesList([]);
        setLoading(false);
        return;
      }

      setElection({
        id: electionId,
        title: activeData.title || checkData.title || "Eleição Commit Jr.",
        status: "OPEN",
        roles: loadedRoles,
      });
      setCandidatesList(loadedCandidates);
      setCanVote(true);
      setBlockReason("");
    } catch (err) {
      console.error("Erro ao verificar status da urna:", err);
      setCanVote(false);
      setBlockReason("Erro de conexão ao comunicar com o servidor da eleição.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Callback ao finalizar a votação no último cargo
  const handleFinishVoting = useCallback(
    async (votes: VoteRecord[]) => {
      if (!election?.id) return false;
      setSubmitError(null);

      try {
        const voterSig = getClientVoterSignature();
        const payload = {
          electionId: election.id,
          voterSignature: voterSig,
          votes: votes.map((v) => ({
            role: v.role,
            candidateId: v.candidateId || null,
            candidateNumber: v.candidateNumber || null,
            isBlank: v.isBlank,
            isNull: v.isNull,
          })),
        };

        const res = await fetch("/api/vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setSubmitError(data.error || "Não foi possível registrar o seu voto.");
          return false;
        }

        // Marca no localStorage que já votou nesta eleição
        markLocalVoted(election.id);
        return true;
      } catch (err) {
        console.error("Erro ao submeter votos:", err);
        setSubmitError("Falha de rede ao gravar votos. Verifique a conexão.");
        return false;
      }
    },
    [election?.id]
  );

  const {
    currentRole,
    digits,
    digitsRequired,
    candidate,
    isBlank,
    isNull,
    isFinal,
    isSubmitting,
    handleNumber,
    handleBranco,
    handleCorrige,
    handleConfirma,
    resetVoting,
  } = useVotingMachine({
    roles: election?.roles,
    candidates: candidatesList,
    digitsPerRole: 2,
    onFinish: handleFinishVoting,
  });

  // Captura teclado físico
  usePhysicalKeyboard({
    onNumber: handleNumber,
    onBranco: handleBranco,
    onCorrige: handleCorrige,
    onConfirma: handleConfirma,
    disabled: !canVote || isFinal || isSubmitting || loading,
  });

  return (
    <UrnaContainer headerTitle={election?.title || "JUSTIÇA ELEITORAL"}>
      {/* Estado: Carregando */}
      {loading && (
        <div className="lg:col-span-12 h-full flex flex-col items-center justify-center bg-[#f8fafc] border-4 border-zinc-800 rounded-sm p-6 text-center select-none min-h-0">
          <Loader2 className="w-12 h-12 text-zinc-700 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-tight">
            Inicializando Terminal Eleitoral...
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            Conectando ao sistema de votação da Commit Jr.
          </p>
        </div>
      )}

      {/* Estado: Bloqueado (Já Votou, Eleição Não Aberta ou Erro) */}
      {!loading && !canVote && (
        <div className="lg:col-span-12 h-full flex flex-col justify-between bg-[#f8fafc] border-4 border-zinc-800 rounded-sm p-6 sm:p-8 select-none min-h-0">
          <div className="flex justify-between items-center text-xs font-mono text-zinc-500 border-b border-zinc-300 pb-2">
            <span>COMMIT JR. • SISTEMA ELEITORAL</span>
            <span className="font-bold text-zinc-700 uppercase">
              {election?.status || "TERMINAL BLOQUEADO"}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center my-4">
            {blockReason.includes("já foi registrado") || blockReason.includes("já registrou") ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 uppercase tracking-tight">
                  Voto Já Computado
                </h2>
                <p className="text-sm sm:text-base text-zinc-700 max-w-md mt-2 leading-relaxed">
                  {blockReason}
                </p>
                <div className="mt-4 px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded">
                  Participação Confirmada
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  {election?.status === "DRAFT" ? (
                    <Clock className="w-10 h-10" />
                  ) : (
                    <Lock className="w-10 h-10" />
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 uppercase tracking-tight">
                  Votação Indisponível
                </h2>
                <p className="text-sm sm:text-base text-zinc-700 max-w-md mt-2 leading-relaxed">
                  {blockReason}
                </p>
              </>
            )}
          </div>

          <div className="border-t border-zinc-300 pt-3 flex justify-between items-center text-xs text-zinc-600">
            <span>Eleição: {election?.title || "Commit Jr."}</span>
            <button
              type="button"
              onClick={checkStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verificar Novamente</span>
            </button>
          </div>
        </div>
      )}

      {/* Estado: Eleitor Permitido & Eleição Aberta */}
      {!loading && canVote && (
        <>
          {/* Lado Esquerdo / Superior: Display LCD ou Tela Fim */}
          <div className="lg:col-span-7 h-full flex flex-col min-h-0">
            {isFinal ? (
              <TelaFim
                onRestart={() => {
                  resetVoting();
                  checkStatus();
                }}
                autoRestartDelaySeconds={8}
              />
            ) : (
              <div className="relative h-full flex flex-col min-h-0">
                <DisplayLCD
                  role={currentRole}
                  digitsRequired={digitsRequired}
                  digits={digits}
                  candidate={candidate}
                  isBlank={isBlank}
                  isNull={isNull}
                />

                {/* Feedback de Submissão ou Erro */}
                {isSubmitting && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-sm text-white z-20">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-2" />
                    <span className="text-sm font-bold tracking-wider uppercase">
                      Gravando voto com segurança...
                    </span>
                  </div>
                )}

                {submitError && (
                  <div className="absolute top-2 left-2 right-2 bg-red-600 text-white p-2 rounded shadow-lg text-xs flex items-center justify-between z-30 animate-shake">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{submitError}</span>
                    </div>
                    <button
                      onClick={() => setSubmitError(null)}
                      className="text-xs underline ml-2 font-bold hover:text-red-200"
                    >
                      Fechar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lado Direito / Inferior: Teclado da Urna */}
          <div className="lg:col-span-5 h-full flex flex-col min-h-0">
            <Keypad
              onNumber={handleNumber}
              onBranco={handleBranco}
              onCorrige={handleCorrige}
              onConfirma={handleConfirma}
              disabled={isFinal || isSubmitting}
            />
          </div>
        </>
      )}
    </UrnaContainer>
  );
}
