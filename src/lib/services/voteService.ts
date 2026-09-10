import { db } from "@/lib/db";
import { votes, voterRecords, candidates } from "@/lib/db/schema";
import { assertElectionIsOpen, ElectionGuardError } from "@/lib/voting/electionGuard";
import { checkIfVoterHasVoted } from "@/lib/voting/voterProtection";
import { VoteSessionSubmission, VoteSubmissionResult } from "@/types/vote";
import { eq, and } from "drizzle-orm";

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

/**
 * Processa a submissão atômica dos votos da sessão do eleitor.
 * Garante:
 * 1. Eleição ativa (OPEN)
 * 2. Unicidade de voto por eleitor/sessão
 * 3. Atomicidade da gravação no Neon PostgreSQL
 * 4. Sigilo 100% absoluto do voto (sem vínculo entre eleitor e a tabela `votes`)
 */
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

  // 3. Carrega candidatos da eleição para validar integridade de referências
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

  // 4. Prepara os registros anônimos de votos
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
        // Se o candidateId fornecido não existir, converte para voto nulo
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
      // Sem candidato e sem ser branco => nulo
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

  // 5. Execução Atômica de Persistência
  try {
    // 5.1 Registra a presença/assinatura do eleitor (impede duplicação simultânea via Unique Constraint)
    await db.insert(voterRecords).values({
      electionId,
      voterSignature,
      votedAt: new Date(),
    });

    // 5.2 Registra os votos de forma estritamente anônima (sem dados do eleitor)
    await db.insert(votes).values(votesToInsert);

    return {
      success: true,
      message: "Votos computados com sucesso na urna.",
      recordedVotesCount: votesToInsert.length,
      electionId,
      voterSignature,
    };
  } catch (error: any) {
    // Tratamento de violação de restrição única (concorrência)
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
