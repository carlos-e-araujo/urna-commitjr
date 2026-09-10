/**
 * Utilitários de Hash e Verificação de Senha Administrativa
 * Utiliza Web Crypto API (PBKDF2-SHA256) compatível com Node.js e Edge Runtime.
 */

const ITERATIONS = 100_000;
const KEY_LEN_BYTES = 32; // 256 bits

// Senha padrão dev caso ADMIN_PASSWORD_HASH não esteja configurado
export const DEFAULT_DEV_PASSWORD = "admin123";

/**
 * Limpa e sanitiza valores vindos de variáveis de ambiente
 * (remove aspas duplas, simples, quebras de linha e espaços acidentais)
 */
export function cleanEnvValue(val?: string | null): string | null {
  if (!val) return null;
  let cleaned = String(val).trim();
  let changed = true;
  while (changed && cleaned.length >= 2) {
    changed = false;
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
      (cleaned.startsWith("`") && cleaned.endsWith("`"))
    ) {
      cleaned = cleaned.slice(1, -1).trim();
      changed = true;
    }
  }
  return cleaned.length > 0 ? cleaned : null;
}

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
 * Compara duas strings em tempo constante para evitar timing attacks
 */
function safeTimingCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifica se a senha informada corresponde ao hash armazenado (`salt_hex:hash_hex`).
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const cleanedHash = cleanEnvValue(storedHash);
    if (!cleanedHash || !cleanedHash.includes(":")) {
      return false;
    }

    const [saltHex, expectedHashHex] = cleanedHash.split(":");
    if (!saltHex || !expectedHashHex) return false;

    const computed = await hashPassword(password, saltHex);
    const [, computedHashHex] = computed.split(":");

    return safeTimingCompare(computedHashHex, expectedHashHex);
  } catch (error) {
    console.error("Erro ao verificar hash de senha:", error);
    return false;
  }
}

/**
 * Valida a senha do admin contra as variáveis de ambiente:
 * 1. `ADMIN_PASSWORD_HASH` (formato salt:hash ou senha pura)
 * 2. `ADMIN_PASSWORD` (senha pura)
 * 3. Fallback dev para "admin123" se nada estiver configurado
 */
export async function checkAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;

  const rawEnvHash = process.env.ADMIN_PASSWORD_HASH;
  const rawEnvPass = process.env.ADMIN_PASSWORD;

  const envHash = cleanEnvValue(rawEnvHash);
  const envPass = cleanEnvValue(rawEnvPass);

  // 1. Caso ADMIN_PASSWORD_HASH esteja configurado no formato salt:hash
  if (envHash && envHash.includes(":")) {
    const isHashMatch = await verifyPassword(password, envHash);
    if (isHashMatch) return true;
  }

  // 2. Caso ADMIN_PASSWORD_HASH tenha sido preenchido diretamente com o texto plano da senha
  if (envHash && !envHash.includes(":")) {
    if (safeTimingCompare(password, envHash)) return true;
  }

  // 3. Caso ADMIN_PASSWORD (sem o sufixo _HASH) tenha sido configurado
  if (envPass) {
    if (safeTimingCompare(password, envPass)) return true;
  }

  // 4. Se nenhuma variável de senha foi definida, permite a senha padrão de desenvolvimento
  if (!envHash && !envPass) {
    return safeTimingCompare(password, DEFAULT_DEV_PASSWORD);
  }

  return false;
}
