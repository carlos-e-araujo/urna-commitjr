import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { voterRecords } from "@/lib/db/schema";

const VOTER_SECRET =
  process.env.VOTER_COOKIE_SECRET ||
  process.env.ADMIN_PASSWORD_HASH ||
  "commitjr-urna-voter-secret-salt-2026";

export const VOTER_COOKIE_PREFIX = "urna_voted_";

/**
 * Cria a assinatura criptográfica segura para o cookie HttpOnly
 */
export function signVoterToken(electionId: string, voterSignature: string): string {
  const payload = `${electionId}:${voterSignature}:${Date.now()}`;
  const hmac = crypto.createHmac("sha256", VOTER_SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

/**
 * Valida a integridade do token assinado do cookie HttpOnly
 */
export function verifyVoterToken(token: string, electionId: string): boolean {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;

    const payload = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const [tokenElectionId] = payload.split(":");

    if (tokenElectionId !== electionId) return false;

    const expectedHmac = crypto.createHmac("sha256", VOTER_SECRET).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}

/**
 * Gera um hash anônimo unidirecional para registro em voter_records.
 * Garante sigilo absoluto (não revela quem é o eleitor nem seu voto),
 * mas impede submissão duplicada no mesmo ciclo eleitoral.
 */
export function generateAnonymousVoterSignature(
  electionId: string,
  clientSignature?: string | null,
  headers?: Headers
): string {
  const ip =
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers?.get("x-real-ip") ||
    "0.0.0.0";
  const userAgent = headers?.get("user-agent") || "unknown-agent";
  const rawSeed = clientSignature || `${ip}-${userAgent}`;

  return crypto
    .createHash("sha256")
    .update(`${electionId}:${rawSeed}:${VOTER_SECRET}`)
    .digest("hex");
}

/**
 * Nome do cookie para uma eleição específica
 */
export function getVoterCookieName(electionId: string): string {
  return `${VOTER_COOKIE_PREFIX}${electionId}`;
}

/**
 * Opções padrão de segurança para o cookie HttpOnly de confirmação de voto
 */
export function getVoterCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias de retenção
  };
}

/**
 * Verificação multicamada de voto já realizado:
 * 1. Camada 1: Cookie assinado HttpOnly
 * 2. Camada 2: Registro anônimo de presença na tabela `voter_records`
 */
export async function checkIfVoterHasVoted(
  electionId: string,
  voterSignature: string,
  cookieToken?: string | null
): Promise<{ hasVoted: boolean; reason?: string }> {
  // 1. Verificação por Cookie HttpOnly
  if (cookieToken && verifyVoterToken(cookieToken, electionId)) {
    return {
      hasVoted: true,
      reason: "Este dispositivo/navegador já registrou voto nesta eleição.",
    };
  }

  // 2. Verificação no banco de dados (tabela voter_records)
  const existingRecord = await db
    .select({ id: voterRecords.id })
    .from(voterRecords)
    .where(
      and(
        eq(voterRecords.electionId, electionId),
        eq(voterRecords.voterSignature, voterSignature)
      )
    )
    .limit(1);

  if (existingRecord.length > 0) {
    return {
      hasVoted: true,
      reason: "Registro de votação já identificado para esta sessão/eleitor.",
    };
  }

  return { hasVoted: false };
}
