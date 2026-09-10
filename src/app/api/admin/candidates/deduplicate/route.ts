import { NextRequest, NextResponse } from "next/server";
import { db, candidates } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { hasNeonDatabaseUrl, readLocalDb, writeLocalDb } from "@/lib/db/localStore";
import { getPrimaryElection } from "@/lib/services/candidateService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { electionId: customElectionId } = body;

    const currentElection = await getPrimaryElection(customElectionId);
    if (!currentElection) {
      return NextResponse.json({ success: false, error: "Nenhuma eleição encontrada." }, { status: 404 });
    }
    const electionId = currentElection.id;

    if (!hasNeonDatabaseUrl()) {
      const local = readLocalDb();
      const electionCandidates = local.candidates.filter((c) => c.electionId === electionId);
      const otherCandidates = local.candidates.filter((c) => c.electionId !== electionId);

      const seen = new Set<string>();
      const cleanList = [];
      let removedCount = 0;

      for (const c of electionCandidates) {
        const key = `${c.role.trim().toLowerCase()}:${c.number.trim()}`;
        if (seen.has(key)) {
          removedCount++;
        } else {
          seen.add(key);
          cleanList.push(c);
        }
      }

      local.candidates = [...otherCandidates, ...cleanList];
      writeLocalDb(local);

      return NextResponse.json({
        success: true,
        message: `${removedCount} candidato(s) duplicado(s) removido(s) com sucesso.`,
        removedCount,
        candidates: cleanList,
      });
    }

    // Neon DB
    const list = await db
      .select()
      .from(candidates)
      .where(eq(candidates.electionId, electionId))
      .orderBy(asc(candidates.createdAt));

    const seen = new Set<string>();
    const idsToDelete: string[] = [];

    for (const c of list) {
      const key = `${c.role.trim().toLowerCase()}:${c.number.trim()}`;
      if (seen.has(key)) {
        idsToDelete.push(c.id);
      } else {
        seen.add(key);
      }
    }

    for (const id of idsToDelete) {
      await db.delete(candidates).where(eq(candidates.id, id));
    }

    const updatedList = await db
      .select()
      .from(candidates)
      .where(eq(candidates.electionId, electionId))
      .orderBy(asc(candidates.role), asc(candidates.number));

    return NextResponse.json({
      success: true,
      message: `${idsToDelete.length} candidato(s) duplicado(s) removido(s) com sucesso.`,
      removedCount: idsToDelete.length,
      candidates: updatedList,
    });
  } catch (error: any) {
    console.error("Erro ao deduplicar candidatos:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao remover duplicatas." },
      { status: 500 }
    );
  }
}
