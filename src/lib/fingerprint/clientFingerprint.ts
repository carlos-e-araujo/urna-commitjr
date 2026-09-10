/**
 * Utilitário de identificação anônima do cliente / dispositivo
 * Armazena um identificador pseudo-aleatório no LocalStorage para reforçar a prevenção
 * de votos duplicados no mesmo dispositivo juntamente com o Cookie HttpOnly.
 */

const STORAGE_KEY = "urna_client_device_sig";

export function getClientVoterSignature(): string {
  if (typeof window === "undefined") {
    return "ssr_session";
  }

  try {
    let signature = localStorage.getItem(STORAGE_KEY);
    if (!signature) {
      signature =
        "voter_" +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36) +
        "_" +
        (navigator.userAgent.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16) || "dev");
      localStorage.setItem(STORAGE_KEY, signature);
    }
    return signature;
  } catch {
    return "fallback_" + Math.random().toString(36).substring(2, 10);
  }
}

export function markLocalVoted(electionId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`urna_voted_${electionId}`, "true");
  } catch {
    // Silencioso em caso de restrição de storage
  }
}

export function hasLocallyVoted(electionId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`urna_voted_${electionId}`) === "true";
  } catch {
    return false;
  }
}
