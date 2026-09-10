import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { elections } from "@/lib/db/schema";
import { ElectionStatus } from "@/types/database";

export class ElectionGuardError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 403, code: string = "ELECTION_FORBIDDEN") {
    super(message);
    this.name = "ElectionGuardError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface ElectionGuardResult {
  id: string;
  title: string;
  status: ElectionStatus;
  isOpen: boolean;
  message: string;
}

/**
 * Valida rigorosamente se a eleição especificada está no status OPEN.
 * Lança ElectionGuardError com status code apropriado (403 ou 404) caso não esteja.
 */
export async function assertElectionIsOpen(electionId: string): Promise<{
  id: string;
  title: string;
  status: "OPEN";
}> {
  if (!electionId) {
    throw new ElectionGuardError(
      "ID da eleição não foi fornecido.",
      400,
      "MISSING_ELECTION_ID"
    );
  }

  const result = await db
    .select({
      id: elections.id,
      title: elections.title,
      status: elections.status,
    })
    .from(elections)
    .where(eq(elections.id, electionId))
    .limit(1);

  if (result.length === 0) {
    throw new ElectionGuardError(
      "Eleição não encontrada.",
      404,
      "ELECTION_NOT_FOUND"
    );
  }

  const election = result[0];

  if (election.status === "DRAFT") {
    throw new ElectionGuardError(
      "A votação ainda não foi aberta pela comissão eleitoral.",
      403,
      "ELECTION_DRAFT"
    );
  }

  if (election.status === "CLOSED") {
    throw new ElectionGuardError(
      "A eleição já foi encerrada. Não é mais possível receber votos.",
      403,
      "ELECTION_CLOSED"
    );
  }

  if (election.status !== "OPEN") {
    throw new ElectionGuardError(
      "Esta eleição não está disponível para votação.",
      403,
      "ELECTION_UNAVAILABLE"
    );
  }

  return {
    id: election.id,
    title: election.title,
    status: "OPEN",
  };
}

/**
 * Consulta o status atual de uma eleição de forma não bloqueante.
 * Se nenhum electionId for informado, busca a eleição mais recente.
 */
export async function getElectionStatus(electionId?: string): Promise<ElectionGuardResult | null> {
  let query = db
    .select({
      id: elections.id,
      title: elections.title,
      status: elections.status,
    })
    .from(elections);

  let result;
  if (electionId) {
    result = await query.where(eq(elections.id, electionId)).limit(1);
  } else {
    result = await query.orderBy(desc(elections.createdAt)).limit(1);
  }

  if (result.length === 0) {
    return null;
  }

  const election = result[0];
  const isOpen = election.status === "OPEN";

  let message = "Eleição aberta e pronta para votação.";
  if (election.status === "DRAFT") {
    message = "Eleição em rascunho. Aguardando abertura oficial.";
  } else if (election.status === "CLOSED") {
    message = "Eleição encerrada.";
  }

  return {
    id: election.id,
    title: election.title,
    status: election.status as ElectionStatus,
    isOpen,
    message,
  };
}
