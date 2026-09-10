import { NextRequest, NextResponse } from "next/server";
import { db, elections, candidates, votes, voterRecords } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";

export async function GET() {
  try {
    // Busca a eleição mais recente
    const electionList = await db
      .select()
      .from(elections)
      .orderBy(desc(elections.createdAt))
      .limit(1);

    let currentElection = electionList[0];

    // Se nenhuma eleição existir ainda, cria uma padrão
    if (!currentElection) {
      const [newElec] = await db
        .insert(elections)
        .values({
          title: "Eleição Commit Jr. 2026",
          status: "DRAFT",
        })
        .returning();
      currentElection = newElec;
    }

    // Contadores gerais da eleição
    const [candidatesCountRes] = await db
      .select({ count: count() })
      .from(candidates)
      .where(eq(candidates.electionId, currentElection.id));

    const [votesCountRes] = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.electionId, currentElection.id));

    const [votersCountRes] = await db
      .select({ count: count() })
      .from(voterRecords)
      .where(eq(voterRecords.electionId, currentElection.id));

    return NextResponse.json({
      success: true,
      election: currentElection,
      stats: {
        totalCandidates: Number(candidatesCountRes?.count || 0),
        totalVotes: Number(votesCountRes?.count || 0),
        totalVoters: Number(votersCountRes?.count || 0),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dados da eleição:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao obter status da eleição." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, title, electionId } = body;

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
        { success: false, error: "Nenhuma eleição encontrada para atualizar." },
        { status: 404 }
      );
    }

    const updatePayload: Partial<typeof elections.$inferInsert> = {};

    if (title && typeof title === "string") {
      updatePayload.title = title.trim();
    }

    if (status) {
      if (!["DRAFT", "OPEN", "CLOSED"].includes(status)) {
        return NextResponse.json(
          { success: false, error: "Status inválido. Use DRAFT, OPEN ou CLOSED." },
          { status: 400 }
        );
      }
      updatePayload.status = status;

      if (status === "OPEN") {
        updatePayload.openedAt = new Date();
        updatePayload.closedAt = null;
      } else if (status === "CLOSED") {
        updatePayload.closedAt = new Date();
      } else if (status === "DRAFT") {
        updatePayload.openedAt = null;
        updatePayload.closedAt = null;
      }
    }

    const [updatedElection] = await db
      .update(elections)
      .set(updatePayload)
      .where(eq(elections.id, targetId))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Eleição atualizada para o status: ${updatedElection.status}`,
      election: updatedElection,
    });
  } catch (error) {
    console.error("Erro ao atualizar status da eleição:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno ao atualizar eleição." },
      { status: 500 }
    );
  }
}
