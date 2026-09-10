import { NextRequest, NextResponse } from "next/server";
import { db, elections, candidates, votes, voterRecords } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { ElectionResults } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let electionId = searchParams.get("electionId");

    // Se electionId não fornecido, pega a eleição mais recente
    let currentElection;
    if (electionId) {
      const elecList = await db
        .select()
        .from(elections)
        .where(eq(elections.id, electionId))
        .limit(1);
      currentElection = elecList[0];
    } else {
      const elecList = await db
        .select()
        .from(elections)
        .orderBy(desc(elections.createdAt))
        .limit(1);
      currentElection = elecList[0];
    }

    if (!currentElection) {
      return NextResponse.json(
        { success: false, error: "Nenhuma eleição encontrada." },
        { status: 404 }
      );
    }

    const targetElectionId = currentElection.id;

    // Total de eleitores que assinaram/votaram
    const [voterCountRes] = await db
      .select({ count: count() })
      .from(voterRecords)
      .where(eq(voterRecords.electionId, targetElectionId));
    const totalVoters = Number(voterCountRes?.count || 0);

    // Todos os candidatos da eleição
    const allCandidates = await db
      .select()
      .from(candidates)
      .where(eq(candidates.electionId, targetElectionId));

    // Todos os votos registrados para a eleição
    const allVotes = await db
      .select()
      .from(votes)
      .where(eq(votes.electionId, targetElectionId));

    // Identificar todos os cargos distintos
    const candidateRoles = allCandidates.map((c) => c.role);
    const voteRoles = allVotes.map((v) => v.role);
    const distinctRoles = Array.from(new Set([...candidateRoles, ...voteRoles]));

    const resultsByRole: ElectionResults["resultsByRole"] = {};

    for (const role of distinctRoles) {
      const roleVotes = allVotes.filter((v) => v.role === role);
      const totalRoleVotes = roleVotes.length;

      const blankVotes = roleVotes.filter((v) => v.isBlank).length;
      const nullVotes = roleVotes.filter((v) => v.isNull).length;
      const validVotes = totalRoleVotes - (blankVotes + nullVotes);

      const blankPercentage = totalRoleVotes > 0 ? Number(((blankVotes / totalRoleVotes) * 100).toFixed(2)) : 0;
      const nullPercentage = totalRoleVotes > 0 ? Number(((nullVotes / totalRoleVotes) * 100).toFixed(2)) : 0;

      // Agrupa candidatos deste cargo
      const roleCandidates = allCandidates.filter((c) => c.role === role);

      const candidateResults = roleCandidates.map((c) => {
        const cVotes = roleVotes.filter((v) => v.candidateId === c.id && !v.isBlank && !v.isNull).length;
        // Percentual sobre o total de votos do cargo
        const percentage = totalRoleVotes > 0 ? Number(((cVotes / totalRoleVotes) * 100).toFixed(2)) : 0;
        // Percentual sobre votos válidos
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

      // Ordena por mais votados
      candidateResults.sort((a, b) => b.votes - a.votes);

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
