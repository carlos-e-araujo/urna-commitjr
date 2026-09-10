import { db } from "@/lib/db";
import { votes, voterRecords, candidates } from "@/lib/db/schema";
import { assertElectionIsOpen } from "@/lib/voting/electionGuard";
import { checkIfVoterHasVoted } from "@/lib/voting/voterProtection";
import { VoteSessionSubmission, VoteSubmissionResult } from "@/types/vote";
import { eq } from "drizzle-orm";
import { hasNeonDatabaseUrl, readLocalDb, writeLocalDb } from "@/lib/db/localStore";

export class VoteProcessingError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 400, code: string = "VOTE_PROCESSING_ERROR") {
    super(message);
    this.name = "VoteProcessingError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export async function submitVotes(
  submission: VoteSessionSubmission,
  cookieToken?: string | null
): Promise<VoteSubmissionResult> {
  const { electionId, votes: rawVotes, voterSignature } = submission;

  if (!electionId) {
    throw new VoteProcessingError("ID da eleição é obrigatório.", 400, "MISSING_ELECTION_ID");
  }

  if (!voterSignature) {
    throw new VoteProcessingError(
      "Identificador/assinatura do eleitor é obrigatório.",
      400,
      "MISSING_VOTER_SIGNATURE"
    );
  }

  if (!rawVotes || !Array.isArray(rawVotes) || rawVotes.length === 0) {
    throw new VoteProcessingError(
      "A sessão de votação deve conter pelo menos um voto registrado.",
      400,
      "EMPTY_VOTES_PAYLOAD"
    );
  }

  // 1. Valida se a eleição está aberta (OPEN)
  await assertElectionIsOpen(electionId);

  // 2. Valida se o eleitor já votou previamente
  const { hasVoted, reason } = await checkIfVoterHasVoted(
    electionId,
    voterSignature,
    cookieToken
  );

  if (hasVoted) {
    throw new VoteProcessingError(
      reason || "Voto já computado para esta sessão nesta eleição.",
      403,
      "DUPLICATE_VOTE"
    );
  }

  // 3. Fallback Local Store
  if (!hasNeonDatabaseUrl()) {
    const local = readLocalDb();
    const candidateMap = new Map(
      local.candidates
        .filter((c) => c.electionId === electionId)
        .map((c) => [`${c.role.toLowerCase()}:${c.number}`, c])
    );
    const candidateMapById = new Map(
      local.candidates.filter((c) => c.electionId === electionId).map((c) => [c.id, c])
    );

    const now = new Date().toISOString();
    const votesToInsert = rawVotes.map((v, index) => {
      const isBlank = Boolean(v.isBlank);
      let isNull = Boolean(v.isNull);
      let candidateId: string | null = null;

      if (isBlank) {
        candidateId = null;
        isNull = false;
      } else if (v.candidateId && candidateMapById.has(v.candidateId)) {
        candidateId = v.candidateId;
        isNull = false;
      } else if (v.candidateNumber) {
        const key = `${v.role.toLowerCase()}:${v.candidateNumber}`;
        const candidate = candidateMap.get(key);
        if (candidate) {
          candidateId = candidate.id;
          isNull = false;
        } else {
          isNull = true;
        }
      } else {
        isNull = true;
      }

      return {
        id: `vote-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        electionId,
        candidateId,
        role: v.role.trim(),
        isBlank,
        isNull,
        createdAt: now,
      };
    });

    local.voterRecords.push({
      id: `voter-rec-${Date.now()}`,
      electionId,
      voterSignature,
      votedAt: now,
    });
    local.votes.push(...votesToInsert);
    writeLocalDb(local);

    return {
      success: true,
      message: "Votos computados com sucesso na urna.",
      recordedVotesCount: votesToInsert.length,
      electionId,
      voterSignature,
    };
  }

  // 4. Modo Neon PostgreSQL
  const electionCandidates = await db
    .select({
      id: candidates.id,
      number: candidates.number,
      role: candidates.role,
    })
    .from(candidates)
    .where(eq(candidates.electionId, electionId));

  const candidateMapById = new Map(electionCandidates.map((c) => [c.id, c]));
  const candidateMapByNumberAndRole = new Map(
    electionCandidates.map((c) => [`${c.role.toLowerCase()}:${c.number}`, c])
  );

  const votesToInsert = rawVotes.map((v) => {
    if (!v.role || typeof v.role !== "string") {
      throw new VoteProcessingError(
        "Cargo inválido especificado em um dos votos.",
        400,
        "INVALID_ROLE"
      );
    }

    const isBlank = Boolean(v.isBlank);
    let isNull = Boolean(v.isNull);
    let candidateId: string | null = null;

    if (isBlank) {
      candidateId = null;
      isNull = false;
    } else if (v.candidateId) {
      const candidate = candidateMapById.get(v.candidateId);
      if (candidate) {
        candidateId = candidate.id;
        isNull = false;
      } else {
        candidateId = null;
        isNull = true;
      }
    } else if (v.candidateNumber) {
      const key = `${v.role.toLowerCase()}:${v.candidateNumber}`;
      const candidate = candidateMapByNumberAndRole.get(key);
      if (candidate) {
        candidateId = candidate.id;
        isNull = false;
      } else {
        candidateId = null;
        isNull = true;
      }
    } else {
      isNull = true;
    }

    return {
      electionId,
      candidateId,
      role: v.role.trim(),
      isBlank,
      isNull,
    };
  });

  try {
    await db.insert(voterRecords).values({
      electionId,
      voterSignature,
      votedAt: new Date(),
    });

    await db.insert(votes).values(votesToInsert);

    return {
      success: true,
      message: "Votos computados com sucesso na urna.",
      recordedVotesCount: votesToInsert.length,
      electionId,
      voterSignature,
    };
  } catch (error: any) {
    if (error?.code === "23505" || error?.message?.includes("unique")) {
      throw new VoteProcessingError(
        "Voto já computado para este eleitor nesta eleição.",
        403,
        "DUPLICATE_VOTE"
      );
    }

    console.error("Erro fatal na persistência do voto:", error);
    throw new VoteProcessingError(
      "Falha interna ao registrar votos na urna. Tente novamente.",
      500,
      "PERSISTENCE_FAILED"
    );
  }
}
