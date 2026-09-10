import { NextRequest, NextResponse } from "next/server";
import { db, candidates } from "@/lib/db";
import { eq, asc, and } from "drizzle-orm";
import { hasNeonDatabaseUrl, readLocalDb, writeLocalDb } from "@/lib/db/localStore";
import { getPrimaryElection } from "@/lib/services/candidateService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const electionIdParam = searchParams.get("electionId") || undefined;

    const currentElection = await getPrimaryElection(electionIdParam);
    if (!currentElection) {
      return NextResponse.json({ success: true, candidates: [] });
    }

    const targetId = currentElection.id;

    if (!hasNeonDatabaseUrl()) {
      const local = readLocalDb();
      const list = local.candidates.filter((c) => c.electionId === targetId);
      return NextResponse.json({ success: true, candidates: list });
    }

    const candidateList = await db
      .select()
      .from(candidates)
      .where(eq(candidates.electionId, targetId))
      .orderBy(asc(candidates.role), asc(candidates.number));

    return NextResponse.json({
      success: true,
      candidates: candidateList,
    });
  } catch (error) {
    console.error("Erro ao listar candidatos:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar candidatos." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, number, role, photoUrl, electionId: customElectionId } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "O nome do candidato é obrigatório." }, { status: 400 });
    }
    if (!number || typeof number !== "string" || !/^\d{2,5}$/.test(number.trim())) {
      return NextResponse.json({ success: false, error: "O número deve conter de 2 a 5 dígitos numéricos." }, { status: 400 });
    }
    if (!role || typeof role !== "string" || role.trim().length === 0) {
      return NextResponse.json({ success: false, error: "O cargo do candidato é obrigatório." }, { status: 400 });
    }

    const cleanedNumber = number.trim();
    const cleanedRole = role.trim();
    const cleanedName = name.trim();
    const cleanedPhotoUrl = (photoUrl && typeof photoUrl === "string" && photoUrl.trim().length > 0)
      ? photoUrl.trim()
      : "/assets/candidates/andre_guilherme.jpeg";

    const currentElection = await getPrimaryElection(customElectionId);
    if (!currentElection) {
      return NextResponse.json({ success: false, error: "Nenhuma eleição encontrada." }, { status: 404 });
    }
    const electionId = currentElection.id;

    if (!hasNeonDatabaseUrl()) {
      const local = readLocalDb();

      const duplicate = local.candidates.find(
        (c) => c.electionId === electionId && c.role.toLowerCase() === cleanedRole.toLowerCase() && c.number === cleanedNumber
      );
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: `O número ${cleanedNumber} já está cadastrado para o cargo "${cleanedRole}".` },
          { status: 409 }
        );
      }

      const now = new Date().toISOString();
      const newCand = {
        id: `candidate-${Date.now()}`,
        electionId,
        name: cleanedName,
        number: cleanedNumber,
        role: cleanedRole,
        photoUrl: cleanedPhotoUrl,
        createdAt: now,
        updatedAt: now,
      };

      local.candidates.push(newCand);
      writeLocalDb(local);

      return NextResponse.json({ success: true, message: "Candidato cadastrado com sucesso.", candidate: newCand }, { status: 201 });
    }

    const existing = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.electionId, electionId),
          eq(candidates.role, cleanedRole),
          eq(candidates.number, cleanedNumber)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: `O número ${cleanedNumber} já está cadastrado para o cargo "${cleanedRole}".` },
        { status: 409 }
      );
    }

    const [newCandidate] = await db
      .insert(candidates)
      .values({
        electionId,
        name: cleanedName,
        number: cleanedNumber,
        role: cleanedRole,
        photoUrl: cleanedPhotoUrl,
      })
      .returning();

    return NextResponse.json(
      { success: true, message: "Candidato cadastrado com sucesso.", candidate: newCandidate },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao cadastrar candidato:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao cadastrar candidato." },
      { status: 500 }
    );
  }
}
