import fs from "fs";
import path from "path";

export interface LocalDbData {
  elections: Array<{
    id: string;
    title: string;
    status: "DRAFT" | "OPEN" | "CLOSED";
    openedAt: string | null;
    closedAt: string | null;
    createdAt: string;
  }>;
  candidates: Array<{
    id: string;
    electionId: string;
    name: string;
    number: string;
    role: string;
    photoUrl: string;
    createdAt: string;
    updatedAt: string;
  }>;
  votes: Array<{
    id: string;
    electionId: string;
    candidateId: string | null;
    role: string;
    isBlank: boolean;
    isNull: boolean;
    createdAt: string;
  }>;
  voterRecords: Array<{
    id: string;
    electionId: string;
    voterSignature: string;
    votedAt: string;
  }>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "local-db.json");

export const DEFAULT_ELECTION_ID = "election-commitjr-2026-default";

export const OFFICIAL_SEED_CANDIDATES = [
  {
    nome: "João Vitor",
    numero: "42",
    cargo: "Presidente",
    foto_url: "/assets/candidates/joao_vitor.jpeg",
  },
  {
    nome: "Arthur Cordeiro",
    numero: "07",
    cargo: "Vice-Presidente",
    foto_url: "/assets/candidates/arthur_cordeiro.jpeg",
  },
  {
    nome: "André Guilherme",
    numero: "29",
    cargo: "Diretor de Gestão e Gente",
    foto_url: "/assets/candidates/andre_guilherme.jpeg",
  },
];

export function getInitialData(): LocalDbData {
  const now = new Date().toISOString();
  return {
    elections: [
      {
        id: DEFAULT_ELECTION_ID,
        title: "Eleição Diretoria Executiva Commit Jr. 2026",
        status: "OPEN",
        openedAt: now,
        closedAt: null,
        createdAt: now,
      },
    ],
    candidates: OFFICIAL_SEED_CANDIDATES.map((c, index) => ({
      id: `candidate-${index + 1}`,
      electionId: DEFAULT_ELECTION_ID,
      name: c.nome,
      number: c.numero,
      role: c.cargo,
      photoUrl: c.foto_url,
      createdAt: now,
      updatedAt: now,
    })),
    votes: [],
    voterRecords: [],
  };
}

export function cleanConnectionString(val?: string | null): string | null {
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

export function readLocalDb(): LocalDbData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.elections)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    return {
      elections: Array.isArray(parsed.elections) ? parsed.elections : [],
      candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
      votes: Array.isArray(parsed.votes) ? parsed.votes : [],
      voterRecords: Array.isArray(parsed.voterRecords) ? parsed.voterRecords : [],
    };
  } catch {
    return getInitialData();
  }
}

export function writeLocalDb(data: LocalDbData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao gravar local DB:", error);
  }
}

export function resetLocalCandidatesToOfficial(electionId?: string): LocalDbData {
  const local = readLocalDb();
  const targetId = electionId || local.elections[0]?.id || DEFAULT_ELECTION_ID;
  const now = new Date().toISOString();

  // Remove candidatos da eleição atual e reinsere os oficiais
  local.candidates = OFFICIAL_SEED_CANDIDATES.map((c, index) => ({
    id: `candidate-${index + 1}`,
    electionId: targetId,
    name: c.nome,
    number: c.numero,
    role: c.cargo,
    photoUrl: c.foto_url,
    createdAt: now,
    updatedAt: now,
  }));

  writeLocalDb(local);
  return local;
}

export function hasNeonDatabaseUrl(): boolean {
  const cleaned = cleanConnectionString(process.env.DATABASE_URL);
  if (!cleaned) return false;
  return (
    (cleaned.startsWith("postgres://") || cleaned.startsWith("postgresql://")) &&
    !cleaned.includes("dummy") &&
    !cleaned.includes("localhost:5432/dummy")
  );
}
