import { NextRequest, NextResponse } from "next/server";
import { db, elections, candidates, votes, voterRecords } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { ElectionResults } from "@/types/database";
import { hasNeonDatabaseUrl, readLocalDb } from "@/lib/db/localStore";
import { sortRoles, ensureOfficialCandidates } from "@/lib/services/candidateService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let electionId = searchParams.get("electionId");

    let currentElection: any;
    let allCandidates: any[] = [];
    let allVotes: any[] = [];
    let totalVoters = 0;

    if (!hasNeonDatabaseUrl()) {
      const local = readLocalDb();
      currentElection = local.elections.find((e) => (electionId ? e.id === electionId : true)) || local.elections[0];
      if (!currentElection) {
        return NextResponse.json({ success: false, error: "Nenhuma eleição encontrada." }, { status: 404 });
      }

      const targetId = currentElection.id;
      await ensureOfficialCandidates(targetId);

      const updatedLocal = readLocalDb();
      allCandidates = updatedLocal.candidates.filter((c) => c.electionId === targetId);
      allVotes = updatedLocal.votes.filter((v) => v.electionId === targetId);
      totalVoters = updatedLocal.voterRecords.filter((r) => r.electionId === targetId).length;
    } else {
      if (electionId) {
        const elecList = await db.select().from(elections).where(eq(elections.id, electionId)).limit(1);
        currentElection = elecList[0];
      } else {
        const elecList = await db.select().from(elections).orderBy(desc(elections.createdAt)).limit(1);
        currentElection = elecList[0];
      }

      if (!currentElection) {
        return NextResponse.json({ success: false, error: "Nenhuma eleição encontrada." }, { status: 404 });
      }

      const targetId = currentElection.id;
      await ensureOfficialCandidates(targetId);

      const [voterCountRes] = await db.select({ count: count() }).from(voterRecords).where(eq(voterRecords.electionId, targetId));
      totalVoters = Number(voterCountRes?.count || 0);

      allCandidates = await db.select().from(candidates).where(eq(candidates.electionId, targetId));
      allVotes = await db.select().from(votes).where(eq(votes.electionId, targetId));
    }

    const candidateRoles = allCandidates.map((c) => c.role);
    const voteRoles = allVotes.map((v) => v.role);
    const rawRoles = Array.from(new Set([...candidateRoles, ...voteRoles]));
    const distinctRoles = sortRoles(rawRoles);

    const resultsByRole: ElectionResults["resultsByRole"] = {};

    for (const role of distinctRoles) {
      const roleVotes = allVotes.filter((v) => v.role === role);
      const totalRoleVotes = roleVotes.length;

      const blankVotes = roleVotes.filter((v) => v.isBlank).length;
      const nullVotes = roleVotes.filter((v) => v.isNull).length;
      const validVotes = totalRoleVotes - (blankVotes + nullVotes);

      const blankPercentage = totalRoleVotes > 0 ? Number(((blankVotes / totalRoleVotes) * 100).toFixed(2)) : 0;
      const nullPercentage = totalRoleVotes > 0 ? Number(((nullVotes / totalRoleVotes) * 100).toFixed(2)) : 0;

      const roleCandidates = allCandidates.filter((c) => c.role === role);

      const candidateResults = roleCandidates.map((c) => {
        const cVotes = roleVotes.filter((v) => v.candidateId === c.id && !v.isBlank && !v.isNull).length;
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
      election: currentElection,
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
