import { NextRequest, NextResponse } from "next/server";
import { db, elections, votes, voterRecords } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hasNeonDatabaseUrl, readLocalDb, writeLocalDb } from "@/lib/db/localStore";
import { getPrimaryElection } from "@/lib/services/candidateService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { electionId, resetStatusTo = "OPEN", confirmationText } = body;

    if (confirmationText !== "ZERAR") {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmação inválida. Digite exatamente a palavra "ZERAR" para confirmar a operação.',
        },
        { status: 400 }
      );
    }

    const currentElection = await getPrimaryElection(electionId);
    if (!currentElection) {
      return NextResponse.json(
        { success: false, error: "Nenhuma eleição encontrada para reiniciar." },
        { status: 404 }
      );
    }
    const targetId = currentElection.id;

    if (!hasNeonDatabaseUrl()) {
      const local = readLocalDb();
      const target = local.elections.find((e) => e.id === targetId) || local.elections[0];
      if (!target) {
        return NextResponse.json({ success: false, error: "Eleição não encontrada." }, { status: 404 });
      }

      local.votes = local.votes.filter((v) => v.electionId !== target.id);
      local.voterRecords = local.voterRecords.filter((r) => r.electionId !== target.id);
      target.status = resetStatusTo as "DRAFT" | "OPEN" | "CLOSED";
      if (resetStatusTo === "OPEN") {
        target.openedAt = new Date().toISOString();
        target.closedAt = null;
      } else {
        target.openedAt = null;
        target.closedAt = null;
      }

      writeLocalDb(local);
      return NextResponse.json({
        success: true,
        message: "Eleição reiniciada com sucesso. Todos os votos e registros de presença foram zerados.",
        election: target,
      });
    }

    await db.delete(votes).where(eq(votes.electionId, targetId));
    await db.delete(voterRecords).where(eq(voterRecords.electionId, targetId));

    const [updatedElection] = await db
      .update(elections)
      .set({
        status: resetStatusTo as "DRAFT" | "OPEN" | "CLOSED",
        openedAt: resetStatusTo === "OPEN" ? new Date() : null,
        closedAt: null,
      })
      .where(eq(elections.id, targetId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Eleição reiniciada com sucesso. Todos os votos e registros de presença foram zerados.",
      election: updatedElection,
    });
  } catch (error) {
    console.error("Erro ao reiniciar eleição:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao reiniciar a eleição." },
      { status: 500 }
    );
  }
}
