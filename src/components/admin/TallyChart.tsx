"use client";

import React from "react";
import { Trophy, User, CircleDot, Ban, Award } from "lucide-react";

interface CandidateResult {
  candidateId: string | null;
  name: string;
  number: string;
  photoUrl: string;
  votes: number;
  percentage: number;
  validPercentage?: number;
}

interface RoleTallyData {
  role: string;
  totalVotes: number;
  validVotes?: number;
  candidates: CandidateResult[];
  blankVotes: number;
  blankPercentage: number;
  nullVotes: number;
  nullPercentage: number;
}

interface TallyChartProps {
  roleData: RoleTallyData;
  isElectionClosed?: boolean;
}

export function TallyChart({ roleData, isElectionClosed }: TallyChartProps) {
  const {
    role,
    totalVotes,
    candidates,
    blankVotes,
    blankPercentage,
    nullVotes,
    nullPercentage,
  } = roleData;

  const validVotes = roleData.validVotes ?? (totalVotes - (blankVotes + nullVotes));
  const maxVotes = Math.max(...candidates.map((c) => c.votes), blankVotes, nullVotes, 1);
  const leadingCandidate = candidates.length > 0 && candidates[0].votes > 0 ? candidates[0] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 print:border-slate-300 print:bg-white print:text-black print:shadow-none">
      {/* Role Title and Total Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 print:border-slate-300">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
            <Award className="w-5 h-5 text-emerald-400 print:text-emerald-700" />
            <span>{role}</span>
          </h3>
          <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
            Total de {totalVotes} {totalVotes === 1 ? "voto apurado" : "votos apurados"} ({validVotes} válidos)
          </p>
        </div>

        {/* Status Badge */}
        {isElectionClosed && leadingCandidate && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full text-xs font-semibold print:border-amber-600 print:text-amber-800">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Eleito(a): {leadingCandidate.name}</span>
          </div>
        )}
      </div>

      {/* Candidates Progress Bars List */}
      <div className="space-y-4">
        {candidates.map((cand, idx) => {
          const isWinner = idx === 0 && cand.votes > 0;
          const barWidthPercent = totalVotes > 0 ? (cand.votes / totalVotes) * 100 : 0;

          return (
            <div
              key={cand.candidateId || `${cand.number}-${cand.name}-${idx}`}
              className={`p-3.5 rounded-xl border transition-all ${
                isWinner
                  ? "bg-slate-950/70 border-emerald-500/40 shadow-sm print:bg-slate-50"
                  : "bg-slate-950/40 border-slate-800/80 print:bg-white print:border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                {/* Candidate Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center">
                    {cand.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cand.photoUrl}
                        alt={cand.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/assets/images/brasao.png";
                        }}
                      />
                    ) : (
                      <User className="w-5 h-5 text-slate-500" />
                    )}
                    {isWinner && (
                      <div className="absolute top-0 right-0 bg-amber-500 p-0.5 rounded-bl shadow">
                        <Trophy className="w-3 h-3 text-slate-950" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate print:text-black">
                        {cand.name}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-xs font-bold rounded print:bg-slate-200 print:text-slate-800">
                        Nº {cand.number}
                      </span>
                    </div>
                    {isWinner && (
                      <span className="text-[11px] text-emerald-400 font-medium print:text-emerald-700">
                        {isElectionClosed ? "1º Lugar (Eleito)" : "1º Lugar (Liderando)"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Vote Numbers */}
                <div className="text-right flex-shrink-0">
                  <span className="text-base font-bold text-white block print:text-black">
                    {cand.votes} <span className="text-xs text-slate-400 font-normal">{cand.votes === 1 ? "voto" : "votos"}</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 print:text-emerald-700">
                    {cand.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden print:bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isWinner
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500"
                  }`}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Blank and Null Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Brancos */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs print:bg-white print:border-slate-200">
            <div className="flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-medium print:text-slate-800">Votos em Branco</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-white print:text-black">{blankVotes} ({blankPercentage}%)</span>
            </div>
          </div>

          {/* Nulos */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between text-xs print:bg-white print:border-slate-200">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-400" />
              <span className="text-slate-300 font-medium print:text-slate-800">Votos Nulos</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-white print:text-black">{nullVotes} ({nullPercentage}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
