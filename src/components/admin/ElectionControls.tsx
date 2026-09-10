"use client";

import React, { useState } from "react";
import {
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  Lock,
  Loader2,
  X,
} from "lucide-react";
import { Election } from "@/types/database";

interface ElectionControlsProps {
  election: Election | null;
  loading: boolean;
  actionLoading: boolean;
  onStatusChange: (status: "DRAFT" | "OPEN" | "CLOSED") => Promise<{ success: boolean; message?: string; error?: string }>;
  onReset: (confirmText: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onRefresh: () => void;
}

export function ElectionControls({
  election,
  loading,
  actionLoading,
  onStatusChange,
  onReset,
  onRefresh,
}: ElectionControlsProps) {
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const status = election?.status || "DRAFT";

  const handleStatusClick = async (newStatus: "DRAFT" | "OPEN" | "CLOSED") => {
    setFeedback(null);
    const result = await onStatusChange(newStatus);
    if (result.success) {
      setFeedback({ type: "success", text: result.message || "Status alterado com sucesso." });
    } else {
      setFeedback({ type: "error", text: result.error || "Erro ao alterar status." });
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmInput.trim() !== "ZERAR") {
      setResetError('Por favor digite exatamente a palavra "ZERAR".');
      return;
    }

    setResetError(null);
    const result = await onReset(confirmInput.trim());
    if (result.success) {
      setResetModalOpen(false);
      setConfirmInput("");
      setFeedback({ type: "success", text: result.message || "Eleição reiniciada com sucesso." });
    } else {
      setResetError(result.error || "Falha ao reiniciar eleição.");
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Não registrado";
    const d = new Date(date);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header with Title & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{election?.title || "Eleição Commit Jr."}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controle do ciclo de votação em tempo real
          </p>
        </div>

        <div className="flex items-center gap-3">
          {status === "OPEN" && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>ELEIÇÃO EM ANDAMENTO</span>
            </div>
          )}
          {status === "CLOSED" && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-red-500/15 border border-red-500/40 rounded-full text-red-400 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span>ELEIÇÃO ENCERRADA</span>
            </div>
          )}
          {status === "DRAFT" && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/40 rounded-full text-amber-400 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>NÃO INICIADA (RASCUNHO)</span>
            </div>
          )}
        </div>
      </div>

      {/* Status timestamps details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Criada em: <strong className="text-slate-200">{formatDate(election?.createdAt)}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span>Aberta em: <strong className="text-slate-200">{formatDate(election?.openedAt)}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Lock className="w-4 h-4 text-red-500" />
          <span>Fechada em: <strong className="text-slate-200">{formatDate(election?.closedAt)}</strong></span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              : "bg-red-950/40 border-red-800/60 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white text-xs underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Action Buttons Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Ações de Ciclo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Botão Abrir Eleição */}
          <button
            onClick={() => handleStatusClick("OPEN")}
            disabled={actionLoading || status === "OPEN"}
            className="flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer text-sm"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Abrir Eleição</span>
          </button>

          {/* Botão Fechar Eleição */}
          <button
            onClick={() => handleStatusClick("CLOSED")}
            disabled={actionLoading || status === "CLOSED"}
            className="flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-red-950/40 cursor-pointer text-sm"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-4 h-4 fill-current" />
            )}
            <span>Encerrar Eleição</span>
          </button>

          {/* Botão Reiniciar / Zerar Votos */}
          <button
            onClick={() => {
              setConfirmInput("");
              setResetError(null);
              setResetModalOpen(true);
            }}
            disabled={actionLoading}
            className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-800 hover:bg-amber-900/40 hover:text-amber-300 hover:border-amber-700/60 active:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all cursor-pointer text-sm disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Zerar Votos / Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Zerésima / Reset */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-800/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Zerar Eleição</h4>
                  <p className="text-xs text-red-400">Atenção: Ação irreversível!</p>
                </div>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-950/30 border border-red-900/40 p-3.5 rounded-xl text-xs text-red-300 space-y-2">
              <p>
                Esta ação apagará <strong>todos os votos registrados</strong> e todos os registros de presença de eleitores desta eleição.
              </p>
              <p>
                Os candidatos cadastrados permanecerão preservados. O status da eleição voltará para <strong>RASCUNHO</strong>.
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Para confirmar, digite <span className="text-red-400 font-mono font-bold">ZERAR</span> abaixo:
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => {
                    setConfirmInput(e.target.value);
                    if (resetError) setResetError(null);
                  }}
                  placeholder="ZERAR"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 uppercase"
                  autoFocus
                />
              </div>

              {resetError && (
                <p className="text-xs text-red-400 font-medium">{resetError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || confirmInput.trim() !== "ZERAR"}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirmar Zeramento</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
