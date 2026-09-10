import { NextRequest, NextResponse } from "next/server";
import { db, candidates, votes, voterRecords } from "@/lib/db";
import { eq, count, asc } from "drizzle-orm";
import { ElectionResults } from "@/types/database";
import { hasNeonDatabaseUrl, readLocalDb } from "@/lib/db/localStore";
import { sortRoles, getPrimaryElection } from "@/lib/services/candidateService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const electionId = searchParams.get("electionId") || undefined;

    const currentElection = await getPrimaryElection(electionId);
    if (!currentElection) {
      return NextResponse.json({ success: false, error: "Nenhuma eleição encontrada." }, { status: 404 });
    }

    const targetId = currentElection.id;
    let rawCandidates: any[] = [];
    let allVotes: any[] = [];
    let totalVoters = 0;

    if (!hasNeonDatabaseUrl()) {
      const local = readLocalDb();
      rawCandidates = local.candidates.filter((c) => c.electionId === targetId);
      allVotes = local.votes.filter((v) => v.electionId === targetId);
      totalVoters = local.voterRecords.filter((r) => r.electionId === targetId).length;
    } else {
      const [voterCountRes] = await db
        .select({ count: count() })
        .from(voterRecords)
        .where(eq(voterRecords.electionId, targetId));
      totalVoters = Number(voterCountRes?.count || 0);

      rawCandidates = await db
        .select()
        .from(candidates)
        .where(eq(candidates.electionId, targetId))
        .orderBy(asc(candidates.role), asc(candidates.number));

      allVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.electionId, targetId));
    }

    // Deduplicação em memória por ID caso haja registros corrompidos no banco
    const seenIds = new Set<string>();
    const allCandidates: any[] = [];
    for (const c of rawCandidates) {
      if (!seenIds.has(c.id)) {
        seenIds.add(c.id);
        allCandidates.push({
          ...c,
          role: (c.role || "").trim(),
        });
      }
    }

    // Identifica todos os cargos únicos presentes nos candidatos cadastrados e votos
    const candidateRoles = allCandidates.map((c) => c.role.trim());
    const voteRoles = allVotes.map((v) => (v.role || "").trim());
    const rawRoles = Array.from(new Set([...candidateRoles, ...voteRoles].filter(Boolean)));
    const distinctRoles = sortRoles(rawRoles);

    const resultsByRole: ElectionResults["resultsByRole"] = {};

    for (const role of distinctRoles) {
      const roleVotes = allVotes.filter(
        (v) => (v.role || "").trim().toLowerCase() === role.toLowerCase()
      );
      const totalRoleVotes = roleVotes.length;

      const blankVotes = roleVotes.filter((v) => v.isBlank).length;
      const nullVotes = roleVotes.filter((v) => v.isNull).length;
      const validVotes = totalRoleVotes - (blankVotes + nullVotes);

      const blankPercentage = totalRoleVotes > 0 ? Number(((blankVotes / totalRoleVotes) * 100).toFixed(2)) : 0;
      const nullPercentage = totalRoleVotes > 0 ? Number(((nullVotes / totalRoleVotes) * 100).toFixed(2)) : 0;

      // Todos os candidatos cadastrados para este cargo
      const roleCandidates = allCandidates.filter(
        (c) => c.role.toLowerCase() === role.toLowerCase()
      );

      const candidateResults = roleCandidates.map((c) => {
        const cVotes = roleVotes.filter(
          (v) =>
            !v.isBlank &&
            !v.isNull &&
            (v.candidateId === c.id || (v.candidateNumber && v.candidateNumber === c.number))
        ).length;

        const percentage = totalRoleVotes > 0 ? Number(((cVotes / totalRoleVotes) * 100).toFixed(2)) : 0;
        const validPercentage = validVotes > 0 ? Number(((cVotes / validVotes) * 100).toFixed(2)) : 0;

        return {
          candidateId: c.id,
          name: c.name,
          number: c.number,
          photoUrl: c.photoUrl,
          votes: cVotes,
          percentage,
          validPercentage,
        };
      });

      // Ordena por maior número de votos e depois número da urna
      candidateResults.sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        return a.number.localeCompare(b.number);
      });

      resultsByRole[role] = {
        role,
        totalVotes: totalRoleVotes,
        validVotes,
        candidates: candidateResults,
        blankVotes,
        blankPercentage,
        nullVotes,
        nullPercentage,
      } as any;
    }

    const payload: ElectionResults & { generatedAt: string } = {
      election: {
        id: currentElection.id,
        title: currentElection.title,
        status: currentElection.status,
        createdAt: new Date(currentElection.createdAt),
        openedAt: currentElection.openedAt ? new Date(currentElection.openedAt) : null,
        closedAt: currentElection.closedAt ? new Date(currentElection.closedAt) : null,
      },
      totalVoters,
      resultsByRole,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error: any) {
    console.error("Erro ao apurar votos:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao processar apuração." },
      { status: 500 }
    );
  }
}
