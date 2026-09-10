import { NextRequest, NextResponse } from "next/server";
import { db, candidates } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hasNeonDatabaseUrl, readLocalDb, writeLocalDb } from "@/lib/db/localStore";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, number, role, photoUrl } = body;

    if (!hasNeonDatabaseUrl()) {
      const local = readLocalDb();
      const cand = local.candidates.find((c) => c.id === id);
      if (!cand) {
        return NextResponse.json({ success: false, error: "Candidato não encontrado." }, { status: 404 });
      }

      if (name) cand.name = name.trim();
      if (number) cand.number = number.trim();
      if (role) cand.role = role.trim();
      if (photoUrl) cand.photoUrl = photoUrl.trim();
      cand.updatedAt = new Date().toISOString();

      writeLocalDb(local);
      return NextResponse.json({ success: true, message: "Candidato atualizado com sucesso.", candidate: cand });
    }

    const [updated] = await db
      .update(candidates)
      .set({
        name: name?.trim(),
        number: number?.trim(),
        role: role?.trim(),
        photoUrl: photoUrl?.trim(),
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Candidato não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Candidato atualizado com sucesso.", candidate: updated });
  } catch (error) {
    console.error("Erro ao atualizar candidato:", error);
    return NextResponse.json({ success: false, error: "Erro interno ao atualizar candidato." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!hasNeonDatabaseUrl()) {
      const local = readLocalDb();
      const initialCount = local.candidates.length;
      local.candidates = local.candidates.filter((c) => c.id !== id);
      if (local.candidates.length === initialCount) {
        return NextResponse.json({ success: false, error: "Candidato não encontrado." }, { status: 404 });
      }
      writeLocalDb(local);
      return NextResponse.json({ success: true, message: "Candidato removido com sucesso." });
    }

    const [deleted] = await db
      .delete(candidates)
      .where(eq(candidates.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Candidato não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Candidato removido com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir candidato:", error);
    return NextResponse.json({ success: false, error: "Erro interno ao excluir candidato." }, { status: 500 });
  }
}
