"use client";

import { useState, useEffect, useCallback } from "react";
import { Election, Candidate } from "@/types/database";

export interface ElectionStats {
  totalCandidates: number;
  totalVotes: number;
  totalVoters: number;
}

export function useAdmin() {
  const [election, setElection] = useState<Election | null>(null);
  const [stats, setStats] = useState<ElectionStats>({
    totalCandidates: 0,
    totalVotes: 0,
    totalVoters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchElectionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/election?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao carregar dados da eleição.");
      }

      setElection(data.election);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchElectionData();
  }, [fetchElectionData]);

  const updateElectionStatus = async (status: "DRAFT" | "OPEN" | "CLOSED") => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/election", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, electionId: election?.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao alterar status da eleição.");
      }
      setElection(data.election);
      await fetchElectionData();
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  };

  const resetElection = async (confirmationText: string) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/election/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ electionId: election?.id, confirmationText }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao reiniciar eleição.");
      }
      setElection(data.election);
      await fetchElectionData();
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch (e) {
      window.location.href = "/admin/login";
    }
  };

  return {
    election,
    stats,
    loading,
    error,
    actionLoading,
    fetchElectionData,
    updateElectionStatus,
    resetElection,
    handleLogout,
  };
}
