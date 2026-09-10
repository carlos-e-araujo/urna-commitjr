import { NextRequest, NextResponse } from "next/server";
import { db, elections, votes, voterRecords } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { electionId, resetStatusTo = "DRAFT", confirmationText } = body;

    if (confirmationText !== "ZERAR") {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmação inválida. Digite exatamente a palavra "ZERAR" para confirmar a operação.',
        },
        { status: 400 }
      );
    }

    let targetId = electionId;
    if (!targetId) {
      const electionList = await db
        .select()
        .from(elections)
        .orderBy(desc(elections.createdAt))
        .limit(1);
      if (electionList[0]) {
        targetId = electionList[0].id;
      }
    }

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: "Nenhuma eleição ativa encontrada para reiniciar." },
        { status: 404 }
      );
    }

    // Remove todos os votos da eleição
    await db.delete(votes).where(eq(votes.electionId, targetId));

    // Remove todos os registros de presença/auditoria da eleição
    await db.delete(voterRecords).where(eq(voterRecords.electionId, targetId));

    // Atualiza status da eleição para DRAFT e limpa timestamps
    const [updatedElection] = await db
      .update(elections)
      .set({
        status: resetStatusTo as "DRAFT" | "OPEN" | "CLOSED",
        openedAt: null,
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
