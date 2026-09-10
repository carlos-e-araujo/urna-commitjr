/**
 * Utilitários de Hash e Verificação de Senha Administrativa
 * Utiliza Web Crypto API (PBKDF2-SHA256) compatível com Node.js e Edge Runtime.
 */

const ITERATIONS = 100_000;
const KEY_LEN_BYTES = 32; // 256 bits

// Senha padrão dev caso ADMIN_PASSWORD_HASH não esteja configurado
export const DEFAULT_DEV_PASSWORD = "admin123";

/**
 * Converte ArrayBuffer / Uint8Array para string Hexadecimal
 */
function bufferToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converte string Hexadecimal para Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Gera um hash seguro a partir de uma senha de texto puro e um salt opcional.
 * Formato retornado: `<salt_hex>:<hash_hex>`
 */
export async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = saltHex ? hexToBuffer(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const actualSaltHex = saltHex || bufferToHex(salt);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LEN_BYTES * 8
  );

  const hashHex = bufferToHex(new Uint8Array(derivedBits));
  return `${actualSaltHex}:${hashHex}`;
}

/**
 * Verifica se a senha informada corresponde ao hash armazenado (`salt_hex:hash_hex`).
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    if (!storedHash || !storedHash.includes(":")) {
      return false;
    }

    const [saltHex, expectedHashHex] = storedHash.split(":");
    if (!saltHex || !expectedHashHex) return false;

    const computed = await hashPassword(password, saltHex);
    const [, computedHashHex] = computed.split(":");

    // Constant-time comparison
    if (computedHashHex.length !== expectedHashHex.length) return false;
    let match = 0;
    for (let i = 0; i < computedHashHex.length; i++) {
      match |= computedHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return match === 0;
  } catch (error) {
    console.error("Erro ao verificar senha:", error);
    return false;
  }
}

/**
 * Valida a senha do admin comparando com `ADMIN_PASSWORD_HASH` do ambiente
 * ou a senha padrão de desenvolvimento ("admin123").
 */
export async function checkAdminPassword(password: string): Promise<boolean> {
  const envHash = process.env.ADMIN_PASSWORD_HASH;

  if (envHash && envHash.includes(":")) {
    return verifyPassword(password, envHash);
  }

  // Se for texto plano no env (fallback de conveniência)
  if (envHash && !envHash.includes(":")) {
    return password === envHash;
  }

  // Fallback dev: aceita "admin123"
  return password === DEFAULT_DEV_PASSWORD;
}
