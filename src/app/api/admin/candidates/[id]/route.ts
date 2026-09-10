import { NextRequest, NextResponse } from "next/server";
import { db, candidates } from "@/lib/db";
import { eq, and, ne } from "drizzle-orm";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, id))
      .limit(1);

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "Candidato não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      candidate,
    });
  } catch (error) {
    console.error("Erro ao buscar candidato:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar candidato." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, number, role, photoUrl } = body;

    // Busca candidato existente
    const [existingCandidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, id))
      .limit(1);

    if (!existingCandidate) {
      return NextResponse.json(
        { success: false, error: "Candidato não encontrado." },
        { status: 404 }
      );
    }

    const updatedName = name !== undefined ? name.trim() : existingCandidate.name;
    const updatedNumber = number !== undefined ? number.trim() : existingCandidate.number;
    const updatedRole = role !== undefined ? role.trim() : existingCandidate.role;
    const updatedPhotoUrl = photoUrl !== undefined ? photoUrl.trim() : existingCandidate.photoUrl;

    if (!updatedName) {
      return NextResponse.json(
        { success: false, error: "O nome não pode ficar vazio." },
        { status: 400 }
      );
    }

    if (!/^\d{2,5}$/.test(updatedNumber)) {
      return NextResponse.json(
        { success: false, error: "O número deve conter de 2 a 5 dígitos numéricos." },
        { status: 400 }
      );
    }

    if (!updatedRole) {
      return NextResponse.json(
        { success: false, error: "O cargo não pode ficar vazio." },
        { status: 400 }
      );
    }

    // Se alterou número ou cargo, verificar conflito com outro candidato na mesma eleição
    if (updatedNumber !== existingCandidate.number || updatedRole !== existingCandidate.role) {
      const conflict = await db
        .select()
        .from(candidates)
        .where(
          and(
            eq(candidates.electionId, existingCandidate.electionId),
            eq(candidates.role, updatedRole),
            eq(candidates.number, updatedNumber),
            ne(candidates.id, id)
          )
        )
        .limit(1);

      if (conflict.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `O número ${updatedNumber} já está em uso para o cargo "${updatedRole}".`,
          },
          { status: 409 }
        );
      }
    }

    const [updatedCandidate] = await db
      .update(candidates)
      .set({
        name: updatedName,
        number: updatedNumber,
        role: updatedRole,
        photoUrl: updatedPhotoUrl,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Candidato atualizado com sucesso.",
      candidate: updatedCandidate,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar candidato:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao atualizar candidato." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    const [deleted] = await db
      .delete(candidates)
      .where(eq(candidates.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Candidato não encontrado para exclusão." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Candidato ${deleted.name} removido com sucesso.`,
    });
  } catch (error: any) {
    console.error("Erro ao excluir candidato:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao excluir candidato." },
      { status: 500 }
    );
  }
}
