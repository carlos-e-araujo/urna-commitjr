"use client";

import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ElectionControls } from "@/components/admin/ElectionControls";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Users,
  Vote,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  Shield,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const {
    election,
    stats,
    loading,
    actionLoading,
    fetchElectionData,
    updateElectionStatus,
    resetElection,
  } = useAdmin();

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Painel de Controle Eleitoral
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Visão geral e operações da eleição ativa
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchElectionData()}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Atualizar Dados</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card: Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status da Urna
              </span>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white tracking-tight">
                {election?.status === "OPEN"
                  ? "Aberta"
                  : election?.status === "CLOSED"
                  ? "Encerrada"
                  : "Rascunho"}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {election?.status === "OPEN"
                  ? "Recebendo votos ativamente"
                  : election?.status === "CLOSED"
                  ? "Votação finalizada"
                  : "Aguardando abertura"}
              </p>
            </div>
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 ${
                election?.status === "OPEN"
                  ? "bg-emerald-500"
                  : election?.status === "CLOSED"
                  ? "bg-red-500"
                  : "bg-amber-500"
              }`}
            />
          </div>

          {/* Card: Votantes / Eleitores */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Eleitores Votantes
              </span>
              <Vote className="w-5 h-5 text-blue-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white tracking-tight">
                {stats.totalVoters}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Presenças únicas registradas
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
          </div>

          {/* Card: Total de Votos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total de Votos
              </span>
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white tracking-tight">
                {stats.totalVotes}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Votos individuais computados
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
          </div>

          {/* Card: Candidatos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Candidatos
              </span>
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white tracking-tight">
                {stats.totalCandidates}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Candidatos ativos na eleição
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
          </div>
        </div>

        {/* Election Controls Section */}
        <ElectionControls
          election={election}
          loading={loading}
          actionLoading={actionLoading}
          onStatusChange={updateElectionStatus}
          onReset={resetElection}
          onRefresh={fetchElectionData}
        />

        {/* Quick Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/candidatos"
            className="group p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 group-hover:bg-emerald-500/10 rounded-xl text-slate-300 group-hover:text-emerald-400 transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                  Gerenciar Candidatos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adicionar, editar cargos, números e fotos
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>

          <Link
            href="/admin/apuracao"
            className="group p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 group-hover:bg-blue-500/10 rounded-xl text-slate-300 group-hover:text-blue-400 transition-colors">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                  Apuração & Resultados
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acompanhar contagem em tempo real e emitir relatório
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
