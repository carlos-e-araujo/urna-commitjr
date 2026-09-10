#!/usr/bin/env node

/**
 * Script utilitário para gerar hash seguro para a variável ADMIN_PASSWORD_HASH
 * Uso: node scripts/generate-admin-hash.mjs <sua_senha>
 */

import { webcrypto } from "node:crypto";
const crypto = globalThis.crypto || webcrypto;

const ITERATIONS = 100_000;
const KEY_LEN_BYTES = 32;

function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function generateHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bufferToHex(salt.buffer);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LEN_BYTES * 8
  );

  const hashHex = bufferToHex(derivedBits);
  return `${saltHex}:${hashHex}`;
}

const password = process.argv[2] || "admin123";

console.log("==================================================");
console.log("🔐 Gerador de Hash de Senha - Urna Commit Jr.");
console.log("==================================================");
console.log(`Senha informada: "${password}"`);

generateHash(password)
  .then((hash) => {
    console.log("\n✅ Hash PBKDF2-SHA256 gerado com sucesso:");
    console.log("\n" + hash + "\n");
    console.log("Adicione esta linha ao seu arquivo .env ou .env.local:");
    console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
    console.log("==================================================");
  })
  .catch((err) => {
    console.error("❌ Erro ao gerar hash:", err);
    process.exit(1);
  });
