"use client";

import React, { useState } from "react";
import {
  Search,
  Edit2,
  Trash2,
  Filter,
  User,
  AlertTriangle,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { Candidate } from "@/types/database";

interface CandidateTableProps {
  candidates: Candidate[];
  loading: boolean;
  onEdit: (candidate: Candidate) => void;
  onDelete: (candidateId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onAddNew: () => void;
}

export function CandidateTable({
  candidates,
  loading,
  onEdit,
  onDelete,
  onAddNew,
}: CandidateTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Extrai lista única de cargos existentes
  const uniqueRoles = Array.from(new Set(candidates.map((c) => c.role)));

  // Filtra candidatos
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.number.includes(searchTerm);
    const matchesRole =
      selectedRoleFilter === "ALL" || c.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDeleteConfirm = async () => {
    if (!candidateToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);

    const result = await onDelete(candidateToDelete.id);
    setDeleteLoading(false);

    if (result.success) {
      setCandidateToDelete(null);
    } else {
      setDeleteError(result.error || "Falha ao remover candidato.");
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Filters & Actions Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou número..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="relative sm:w-56">
            <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="ALL">Todos os Cargos ({candidates.length})</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={onAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Candidato</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Candidato</th>
              <th className="py-3.5 px-4 text-center">Número</th>
              <th className="py-3.5 px-4">Cargo</th>
              <th className="py-3.5 px-4 hidden md:table-cell">Cadastrado em</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                  <span>Carregando lista de candidatos...</span>
                </td>
              </tr>
            ) : filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">Nenhum candidato encontrado</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchTerm || selectedRoleFilter !== "ALL"
                      ? "Tente ajustar os filtros de busca."
                      : "Clique em 'Novo Candidato' para cadastrar."}
                  </p>
                </td>
              </tr>
            ) : (
              filteredCandidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  {/* Foto e Nome */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {candidate.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={candidate.photoUrl}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/assets/images/brasao.png";
                            }}
                          />
                        ) : (
                          <User className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-white block">
                          {candidate.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ID: {candidate.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Número */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-3 py-1 bg-slate-950 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-sm rounded-lg">
                      {candidate.number}
                    </span>
                  </td>

                  {/* Cargo */}
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium rounded-lg">
                      {candidate.role}
                    </span>
                  </td>

                  {/* Data de Cadastro */}
                  <td className="py-3.5 px-4 text-xs text-slate-400 hidden md:table-cell">
                    {formatDate(candidate.createdAt)}
                  </td>

                  {/* Ações */}
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(candidate)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar Candidato"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCandidateToDelete(candidate)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Excluir Candidato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-800/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-950 border border-red-800 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Excluir Candidato</h4>
                  <p className="text-xs text-red-400">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <button
                onClick={() => setCandidateToDelete(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={candidateToDelete.photoUrl}
                  alt={candidateToDelete.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{candidateToDelete.name}</p>
                <p className="text-xs text-slate-400">
                  Nº {candidateToDelete.number} • {candidateToDelete.role}
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="text-xs text-red-400 font-medium">{deleteError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Confirmar Exclusão</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
