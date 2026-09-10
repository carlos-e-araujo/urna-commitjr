"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, KeyRound, ShieldAlert, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Por favor, digite a senha mestra.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Senha incorreta. Acesso negado.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      const redirectPath = searchParams.get("from") || "/admin";
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 500);
    } catch (err) {
      setError("Erro ao conectar ao servidor de autenticação.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 select-none relative overflow-hidden">
      {/* Background glow elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-8 z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-16 h-16 mb-4 flex items-center justify-center bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-inner">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Urna Eletrônica • Commit Jr.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Senha Mestra do Mesário / Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading || success}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-base disabled:opacity-50"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-sm animate-shake">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Autenticado com sucesso! Redirecionando...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success || !password}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer text-sm tracking-wide uppercase"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : success ? (
              <span>Acessando...</span>
            ) : (
              <>
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500">
            Acesso restrito à Comissão Eleitoral da Commit Jr.
          </p>
        </div>
      </div>
    </div>
  );
}
