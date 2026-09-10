import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "admin_session";
const DEFAULT_SESSION_SECRET = "urna-commitjr-admin-super-secret-key-32chars-min";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

export interface AdminSessionPayload {
  role: "admin";
  iat: number;
  exp: number;
}

function getSecretKey(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD_HASH || DEFAULT_SESSION_SECRET;
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSessionToken(payload: AdminSessionPayload): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey(getSecretKey());
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(dataToSign)
  );

  let binary = "";
  const bytes = new Uint8Array(signatureBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const encodedSignature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${dataToSign}.${encodedSignature}`;
}

export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    // Decode signature
    let base64Sig = encodedSignature.replace(/-/g, "+").replace(/_/g, "/");
    while (base64Sig.length % 4) {
      base64Sig += "=";
    }
    const binarySig = atob(base64Sig);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const key = await getHmacKey(getSecretKey());
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(dataToSign)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson) as AdminSessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export async function createAdminSession(): Promise<{ name: string; value: string; options: any }> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    role: "admin",
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const token = await signSessionToken(payload);
  const isProd = process.env.NODE_ENV === "production";

  return {
    name: ADMIN_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  };
}

export function destroyAdminSession(): { name: string; value: string; options: any } {
  return {
    name: ADMIN_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    },
  };
}

/**
 * Helper para validar sessão dentro de Server Components ou Route Handlers
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  return verifySessionToken(sessionCookie);
}

/**
 * Helper para verificar sessão em requisições de Middleware ou Route Handler
 */
export async function verifyAdminRequest(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionCookie) return false;
  const payload = await verifySessionToken(sessionCookie);
  return payload !== null && payload.role === "admin";
}
