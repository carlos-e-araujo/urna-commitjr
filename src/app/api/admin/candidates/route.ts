import { NextRequest, NextResponse } from "next/server";
import { db, candidates, elections } from "@/lib/db";
import { eq, desc, asc, and } from "drizzle-orm";
import { hasNeonDatabaseUrl, readLocalDb, writeLocalDb } from "@/lib/db/localStore";
import { ensureOfficialCandidates } from "@/lib/services/candidateService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let electionId = searchParams.get("electionId");

    if (!hasNeonDatabaseUrl()) {
      const local = readLocalDb();
      const targetId = electionId || local.elections[0]?.id;
      if (targetId) {
        await ensureOfficialCandidates(targetId);
      }
      const updatedLocal = readLocalDb();
      const list = updatedLocal.candidates.filter((c) => (targetId ? c.electionId === targetId : true));
      return NextResponse.json({ success: true, candidates: list });
    }

    if (!electionId) {
      const activeElection = await db
        .select()
        .from(elections)
        .orderBy(desc(elections.createdAt))
        .limit(1);
      if (activeElection[0]) {
        electionId = activeElection[0].id;
      }
    }

    if (!electionId) {
      return NextResponse.json({ success: true, candidates: [] });
    }

    await ensureOfficialCandidates(electionId);

    const candidateList = await db
      .select()
      .from(candidates)
      .where(eq(candidates.electionId, electionId))
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

    if (!hasNeonDatabaseUrl()) {
      const local = readLocalDb();
      const targetId = customElectionId || local.elections[0]?.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: "Nenhuma eleição encontrada." }, { status: 404 });
      }

      const duplicate = local.candidates.find(
        (c) => c.electionId === targetId && c.role.toLowerCase() === cleanedRole.toLowerCase() && c.number === cleanedNumber
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
        electionId: targetId,
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

    let electionId = customElectionId;
    if (!electionId) {
      const activeElection = await db
        .select()
        .from(elections)
        .orderBy(desc(elections.createdAt))
        .limit(1);
      if (activeElection[0]) {
        electionId = activeElection[0].id;
      }
    }

    if (!electionId) {
      return NextResponse.json({ success: false, error: "Nenhuma eleição ativa encontrada." }, { status: 404 });
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
