"use client";

import React, { useState, useEffect } from "react";
import { X, User, Hash, Briefcase, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Candidate } from "@/types/database";

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  candidateToEdit?: Candidate | null;
  electionId?: string;
}

const COMMON_ROLES = [
  "Diretor Presidente",
  "Diretor de Projetos",
  "Diretor Administrativo-Financeiro",
  "Diretor de Marketing",
  "Diretor de Recursos Humanos",
  "Conselheiro Fiscal",
];

const PRESET_PHOTOS = [
  { label: "André Guilherme", url: "/assets/candidates/andre_guilherme.jpeg" },
  { label: "Arthur Cordeiro", url: "/assets/candidates/arhur_cordeiro.jpeg" },
  { label: "João Vitor", url: "/assets/candidates/joao_vitor.jpeg" },
  { label: "Brasão Commit", url: "/assets/images/brasao.png" },
];

export function CandidateFormModal({
  isOpen,
  onClose,
  onSave,
  candidateToEdit,
  electionId,
}: CandidateFormModalProps) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [role, setRole] = useState(COMMON_ROLES[0]);
  const [photoUrl, setPhotoUrl] = useState("/assets/candidates/andre_guilherme.jpeg");
  const [customRole, setCustomRole] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(candidateToEdit);

  useEffect(() => {
    if (candidateToEdit) {
      setName(candidateToEdit.name);
      setNumber(candidateToEdit.number);
      setPhotoUrl(candidateToEdit.photoUrl || "");

      if (COMMON_ROLES.includes(candidateToEdit.role)) {
        setRole(candidateToEdit.role);
        setIsCustomRole(false);
        setCustomRole("");
      } else {
        setIsCustomRole(true);
        setCustomRole(candidateToEdit.role);
      }
    } else {
      setName("");
      setNumber("");
      setRole(COMMON_ROLES[0]);
      setIsCustomRole(false);
      setCustomRole("");
      setPhotoUrl("/assets/candidates/andre_guilherme.jpeg");
    }
    setError(null);
  }, [candidateToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalRole = isCustomRole ? customRole.trim() : role;

    if (!name.trim()) {
      setError("O nome do candidato é obrigatório.");
      return;
    }

    if (!/^\d{2,5}$/.test(number.trim())) {
      setError("O número deve ter entre 2 e 5 dígitos numéricos.");
      return;
    }

    if (!finalRole) {
      setError("Informe o cargo do candidato.");
      return;
    }

    if (!photoUrl.trim()) {
      setError("A URL da foto é obrigatória.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        number: number.trim(),
        role: finalRole,
        photoUrl: photoUrl.trim(),
        electionId,
      };

      const url = isEditing
        ? `/api/admin/candidates/${candidateToEdit!.id}`
        : `/api/admin/candidates`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Erro ao salvar candidato.");
        setLoading(false);
        return;
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isEditing ? "Editar Candidato" : "Cadastrar Novo Candidato"}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? "Atualize as informações do candidato" : "Preencha os dados e escolha a foto"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1 & 2: Form Inputs */}
            <div className="md:col-span-2 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: André Guilherme"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Número e Cargo em Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Número */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Número (2 a 5 dígitos)
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      maxLength={5}
                      value={number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setNumber(val);
                      }}
                      placeholder="Ex: 10"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Cargo
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <select
                      value={isCustomRole ? "CUSTOM" : role}
                      onChange={(e) => {
                        if (e.target.value === "CUSTOM") {
                          setIsCustomRole(true);
                        } else {
                          setIsCustomRole(false);
                          setRole(e.target.value);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {COMMON_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Outro Cargo Personalizado...</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Input de Cargo Personalizado se selecionado */}
              {isCustomRole && (
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                    Nome do Cargo Personalizado
                  </label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Ex: Diretor de Inovação"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-emerald-600 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              )}

              {/* URL da Foto */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  URL da Foto
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="/assets/candidates/... ou URL externa"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* Preset Photo Buttons */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1 self-center">Fotos padrão:</span>
                  {PRESET_PHOTOS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setPhotoUrl(p.url)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        photoUrl === p.url
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Live Preview Card */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Prévia na Urna
              </span>
              <div className="w-28 h-36 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 relative shadow-inner flex items-center justify-center">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={name || "Prévia"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/assets/images/brasao.png";
                    }}
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-600" />
                )}
              </div>
              <div className="text-center mt-3 w-full">
                <span className="block font-bold text-white text-sm truncate">
                  {name || "Nome do Candidato"}
                </span>
                <span className="inline-block mt-1 font-mono font-bold text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
                  {number ? `Nº ${number}` : "Nº --"}
                </span>
                <span className="block text-[11px] text-slate-400 truncate mt-1">
                  {isCustomRole ? customRole || "Cargo" : role}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{isEditing ? "Salvar Alterações" : "Cadastrar Candidato"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
