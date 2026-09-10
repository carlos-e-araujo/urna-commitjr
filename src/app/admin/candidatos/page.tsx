"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CandidateTable } from "@/components/admin/CandidateTable";
import { CandidateFormModal } from "@/components/admin/CandidateFormModal";
import { Candidate } from "@/types/database";
import { Users, Briefcase, Plus, RefreshCw, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

export default function CandidatesAdminPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/candidates?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error("Erro ao carregar candidatos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleAddNew = () => {
    setCandidateToEdit(null);
    setModalOpen(true);
  };

  const handleEdit = (candidate: Candidate) => {
    setCandidateToEdit(candidate);
    setModalOpen(true);
  };

  const handleDelete = async (candidateId: string) => {
    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Erro ao remover candidato." };
      }
      setFeedback({ type: "success", message: data.message || "Candidato removido com sucesso." });
      await fetchCandidates();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Erro de conexão." };
    }
  };

  const handleRestoreOfficial = async () => {
    if (!window.confirm("Deseja restaurar os 3 candidatos oficiais (André Guilherme, Arthur Cordeiro e João Vitor)? Todos os candidatos atuais desta eleição serão substituídos pelos 3 oficiais.")) {
      return;
    }
    try {
      setSeeding(true);
      const res = await fetch("/api/admin/candidates/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: "error", message: data.error || "Erro ao restaurar candidatos padrão." });
      } else {
        setFeedback({ type: "success", message: "3 Candidatos Oficiais restaurados com sucesso!" });
        await fetchCandidates();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Erro de conexão ao restaurar candidatos." });
    } finally {
      setSeeding(false);
    }
  };

  const handleDeduplicate = async () => {
    try {
      setSeeding(true);
      const res = await fetch("/api/admin/candidates/deduplicate", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: "error", message: data.error || "Erro ao deduplicar candidatos." });
      } else {
        setFeedback({
          type: "success",
          message: data.removedCount > 0
            ? `Limpeza concluída! ${data.removedCount} candidato(s) duplicado(s) removido(s).`
            : "Nenhum candidato duplicado encontrado na eleição.",
        });
        await fetchCandidates();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Erro ao remover duplicatas." });
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveSuccess = () => {
    setFeedback({
      type: "success",
      message: candidateToEdit
        ? "Candidato atualizado com sucesso!"
        : "Novo candidato cadastrado com sucesso!",
    });
    fetchCandidates();
  };

  const distinctRoles = Array.from(new Set(candidates.map((c) => c.role)));

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Gestão de Candidatos
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Cadastre, edite e organize os candidatos por cargo eleitoral
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDeduplicate}
              disabled={loading || seeding}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Remove registros duplicados de candidatos"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
              <span>Limpar Duplicados</span>
            </button>

            <button
              onClick={handleRestoreOfficial}
              disabled={loading || seeding}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Restaura os candidatos oficiais (André, Arthur e João Vitor)"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
              <span>Restaurar Padrões</span>
            </button>

            <button
              onClick={() => fetchCandidates()}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Candidato</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm animate-in fade-in duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                : "bg-red-950/40 border-red-800/60 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Total de Candidatos
              </span>
              <span className="text-2xl font-bold text-white block mt-0.5">
                {candidates.length}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Cargos em Disputa
              </span>
              <span className="text-2xl font-bold text-white block mt-0.5">
                {distinctRoles.length}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Média por Cargo
              </span>
              <span className="text-2xl font-bold text-white block mt-0.5">
                {distinctRoles.length > 0
                  ? (candidates.length / distinctRoles.length).toFixed(1)
                  : "0"}
              </span>
            </div>
          </div>
        </div>

        {/* Candidates Table Component */}
        <CandidateTable
          candidates={candidates}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddNew={handleAddNew}
        />

        {/* Candidate Form Modal (Create / Edit) */}
        <CandidateFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveSuccess}
          candidateToEdit={candidateToEdit}
        />
      </div>
    </AdminLayout>
  );
}
