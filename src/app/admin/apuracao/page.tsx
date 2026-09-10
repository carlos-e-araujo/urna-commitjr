"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TallyChart } from "@/components/admin/TallyChart";
import { ElectionResults } from "@/types/database";
import {
  BarChart3,
  Printer,
  RefreshCw,
  Trophy,
  Users,
  Vote,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Radio,
} from "lucide-react";

interface ExtendedResults extends ElectionResults {
  generatedAt: string;
}

export default function ApuracaoAdminPage() {
  const [data, setData] = useState<ExtendedResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTally = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/tally");
      const resJson = await res.json();

      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || "Falha ao carregar dados de apuração.");
      }

      setData(resJson.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Erro ao conectar à API de apuração.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTally();
  }, [fetchTally]);

  // Polling automático a cada 5 segundos se ativado e a eleição estiver aberta
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTally();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTally]);

  const handlePrint = () => {
    window.print();
  };

  const election = data?.election;
  const isClosed = election?.status === "CLOSED";
  const isOpen = election?.status === "OPEN";
  const roles = data?.resultsByRole ? Object.values(data.resultsByRole) : [];

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "--";
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Contagem total de votos somando todos os cargos
  const totalVotesAcrossAllRoles = roles.reduce((acc, r) => acc + r.totalVotes, 0);
  const totalCandidatesCount = roles.reduce((acc, r) => acc + r.candidates.length, 0);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full print:p-0 print:m-0 print:max-w-none">
        {/* Printable Header (visible on print only) */}
        <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-black uppercase tracking-wider">
            Boletim de Urna (B.U.) - Relatório Oficial de Apuração
          </h1>
          <p className="text-sm font-semibold mt-1">
            Commit Jr. • Empresa Júnior de Computação
          </p>
          <div className="text-xs mt-2 flex justify-between border-t border-slate-300 pt-2">
            <span>Eleição: <strong>{election?.title}</strong></span>
            <span>Status: <strong>{election?.status}</strong></span>
            <span>Emissão: <strong>{lastUpdated ? formatDate(lastUpdated) : "--"}</strong></span>
          </div>
        </div>

        {/* Top Header Controls (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-emerald-400" />
              <span>Apuração & Resultados</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Contagem em tempo real de todos os candidatos e consolidação de votos por cargo
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Realtime Live toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                autoRefresh
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse text-emerald-400" : ""}`} />
              <span>{autoRefresh ? "Ao Vivo (5s)" : "Pausado"}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchTally()}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </button>

            {/* Print / Export Boletim de Urna */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-950/40 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Emitir Boletim de Urna</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Status Summary Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl print:bg-slate-50 print:border-slate-300 print:shadow-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Status */}
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block print:text-slate-600">
                Estado da Eleição
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isOpen ? "bg-emerald-400 animate-ping" : isClosed ? "bg-red-400" : "bg-amber-400"
                  }`}
                />
                <span className="text-lg font-bold text-white print:text-black">
                  {isOpen ? "Em Andamento" : isClosed ? "Encerrada (Final)" : "Rascunho / Não Aberta"}
                </span>
              </div>
            </div>

            {/* Total de Eleitores */}
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block print:text-slate-600">
                Eleitores Votantes (Quórum)
              </span>
              <span className="text-2xl font-bold text-emerald-400 print:text-emerald-800 block mt-0.5">
                {data?.totalVoters ?? 0}
              </span>
            </div>

            {/* Total de Candidatos */}
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block print:text-slate-600">
                Candidatos Apurados
              </span>
              <span className="text-2xl font-bold text-purple-400 print:text-purple-800 block mt-0.5">
                {totalCandidatesCount}
              </span>
            </div>

            {/* Total de Votos Computados */}
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block print:text-slate-600">
                Total de Votos Apurados
              </span>
              <span className="text-2xl font-bold text-blue-400 print:text-blue-800 block mt-0.5">
                {totalVotesAcrossAllRoles}
              </span>
            </div>

            {/* Última Atualização */}
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block print:text-slate-600">
                Última Leitura
              </span>
              <span className="text-xs font-mono text-slate-300 print:text-slate-700 block mt-1.5">
                {lastUpdated ? lastUpdated.toLocaleTimeString("pt-BR") : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Proclamation of Winners Banner (If Election is Closed) */}
        {isClosed && (
          <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 border border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-4 print:bg-white print:border-amber-600">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white print:text-black">
                  Proclamação dos Resultados Oficiais
                </h2>
                <p className="text-xs text-amber-300/80 print:text-amber-800">
                  Eleição finalizada. Candidatos eleitos por maioria simples dos votos:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {roles.map((r) => {
                const winner = r.candidates.length > 0 && r.candidates[0].votes > 0 ? r.candidates[0] : null;
                return (
                  <div
                    key={r.role}
                    className="p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-center gap-3 print:bg-slate-50"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                      {winner?.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={winner.photoUrl} alt={winner.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-full h-full p-2 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block truncate">
                        {r.role}
                      </span>
                      <span className="font-bold text-white text-sm block truncate print:text-black">
                        {winner ? winner.name : "Nenhum voto computado"}
                      </span>
                      {winner && (
                        <span className="text-xs text-slate-400 print:text-slate-600 font-medium">
                          {winner.votes} votos ({winner.percentage}%)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Roles Tally Charts Grid */}
        <div className="space-y-6">
          {roles.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="font-bold text-white text-base">Nenhum voto registrado ainda</p>
              <p className="text-xs text-slate-500 mt-1">
                Quando a eleição for aberta e os eleitores votarem, a contagem aparecerá aqui automaticamente.
              </p>
            </div>
          ) : (
            roles.map((roleData) => (
              <TallyChart
                key={roleData.role}
                roleData={roleData}
                isElectionClosed={isClosed}
              />
            ))
          )}
        </div>

        {/* Official Footer for Printing */}
        <div className="hidden print:block pt-8 mt-12 border-t-2 border-black text-center text-xs space-y-8">
          <p className="font-mono">
            Relatório gerado automaticamente pelo Sistema de Urna Eletrônica Commit Jr.
          </p>
          <div className="grid grid-cols-2 gap-12 pt-8">
            <div className="border-t border-black pt-2">
              <p className="font-bold">Presidente da Comissão Eleitoral</p>
            </div>
            <div className="border-t border-black pt-2">
              <p className="font-bold">Mesário Responsável</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
