import crypto from "crypto";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { voterRecords } from "@/lib/db/schema";
import { hasNeonDatabaseUrl, readLocalDb } from "@/lib/db/localStore";

const VOTER_SECRET =
  process.env.VOTER_COOKIE_SECRET ||
  process.env.ADMIN_PASSWORD_HASH ||
  "commitjr-urna-voter-secret-salt-2026";

export const VOTER_COOKIE_PREFIX = "urna_voted_";

export function signVoterToken(
  electionId: string,
  voterSignature: string,
  openedAt?: Date | string | null
): string {
  const sessionTime = openedAt ? new Date(openedAt).getTime() : 0;
  const payload = `${electionId}:${voterSignature}:${sessionTime}`;
  const hmac = crypto.createHmac("sha256", VOTER_SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

export function extractAndVerifyVoterToken(
  token: string,
  electionId: string,
  currentOpenedAt?: Date | string | null
): { valid: boolean; voterSignature?: string } {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return { valid: false };

    const payload = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const [tokenElectionId, tokenVoterSignature, tokenSessionTimestamp] = payload.split(":");

    if (tokenElectionId !== electionId) return { valid: false };

    const expectedHmac = crypto.createHmac("sha256", VOTER_SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
      return { valid: false };
    }

    // Se a eleição foi reiniciada após o cookie ser emitido
    if (currentOpenedAt) {
      const currentSessionTime = new Date(currentOpenedAt).getTime();
      const tokenTime = Number(tokenSessionTimestamp || 0);
      if (tokenTime > 0 && currentSessionTime > tokenTime + 1000) {
        return { valid: false };
      }
    }

    return { valid: true, voterSignature: tokenVoterSignature };
  } catch {
    return { valid: false };
  }
}

export function verifyVoterToken(
  token: string,
  electionId: string,
  currentOpenedAt?: Date | string | null
): boolean {
  return extractAndVerifyVoterToken(token, electionId, currentOpenedAt).valid;
}

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

export function getVoterCookieName(electionId: string): string {
  return `${VOTER_COOKIE_PREFIX}${electionId}`;
}

export function getVoterCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  };
}

export async function checkIfVoterHasVoted(
  electionId: string,
  voterSignature: string,
  cookieToken?: string | null,
  currentOpenedAt?: Date | string | null
): Promise<{ hasVoted: boolean; reason?: string }> {
  let cookieVoterSignature: string | undefined;

  if (cookieToken) {
    const verified = extractAndVerifyVoterToken(cookieToken, electionId, currentOpenedAt);
    if (verified.valid) {
      cookieVoterSignature = verified.voterSignature;
    }
  }

  const signaturesToCheck = Array.from(
    new Set([voterSignature, cookieVoterSignature].filter((s): s is string => Boolean(s)))
  );

  // 1. Verificação no banco de dados (tabela voter_records ou local store)
  if (!hasNeonDatabaseUrl()) {
    const local = readLocalDb();
    const exists = local.voterRecords.some(
      (r) => r.electionId === electionId && signaturesToCheck.includes(r.voterSignature)
    );
    if (exists) {
      return {
        hasVoted: true,
        reason: "Seu voto já foi registrado para esta eleição. Obrigado pela participação!",
      };
    }
    return { hasVoted: false };
  }

  const existingRecords = await db
    .select({ id: voterRecords.id })
    .from(voterRecords)
    .where(
      and(
        eq(voterRecords.electionId, electionId),
        inArray(voterRecords.voterSignature, signaturesToCheck)
      )
    )
    .limit(1);

  if (existingRecords.length > 0) {
    return {
      hasVoted: true,
      reason: "Seu voto já foi registrado para esta eleição. Obrigado pela participação!",
    };
  }

  return { hasVoted: false };
}
