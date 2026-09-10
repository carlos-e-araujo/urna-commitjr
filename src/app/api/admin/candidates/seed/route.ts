import { NextRequest, NextResponse } from "next/server";
import { db, candidates } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  hasNeonDatabaseUrl,
  resetLocalCandidatesToOfficial,
  OFFICIAL_SEED_CANDIDATES,
} from "@/lib/db/localStore";
import { getPrimaryElection } from "@/lib/services/candidateService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { electionId: customElectionId } = body;

    const currentElection = await getPrimaryElection(customElectionId);
    if (!currentElection) {
      return NextResponse.json(
        { success: false, error: "Nenhuma eleição encontrada." },
        { status: 404 }
      );
    }
    const electionId = currentElection.id;

    if (!hasNeonDatabaseUrl()) {
      const local = resetLocalCandidatesToOfficial(electionId);
      return NextResponse.json({
        success: true,
        message: "3 Candidatos Oficiais restaurados com sucesso!",
        candidates: local.candidates.filter((c) => c.electionId === electionId),
      });
    }

    // Remove candidatos antigos desta eleição
    await db.delete(candidates).where(eq(candidates.electionId, electionId));

    // Insere os 3 candidatos oficiais
    const insertedList = [];
    for (const c of OFFICIAL_SEED_CANDIDATES) {
      const [inserted] = await db
        .insert(candidates)
        .values({
          electionId,
          name: c.nome,
          number: c.numero,
          role: c.cargo,
          photoUrl: c.foto_url,
        })
        .returning();
      insertedList.push(inserted);
    }

    return NextResponse.json({
      success: true,
      message: "3 Candidatos Oficiais restaurados com sucesso!",
      candidates: insertedList,
    });
  } catch (error: any) {
    console.error("Erro ao restaurar candidatos padrão:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao restaurar candidatos." },
      { status: 500 }
    );
  }
}
