import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { elections, candidates } from "@/lib/db/schema";
import { CandidateDisplay } from "@/types/database";
import { hasNeonDatabaseUrl, readLocalDb } from "@/lib/db/localStore";

// Ordem preferencial dos cargos padrão
const DEFAULT_ROLE_ORDER = [
  "Presidente",
  "Vice-Presidente",
  "Diretor de Gestão e Gente",
  "Diretor Financeiro",
  "Diretor de Projetos",
  "Diretor de Marketing",
];

export interface ActiveElectionData {
  id: string;
  title: string;
  status: "OPEN" | "DRAFT" | "CLOSED";
  openedAt: Date | null;
  createdAt: Date;
  roles: string[];
}

/**
 * Ordena lista de cargos respeitando a ordem institucional padrão
 */
export function sortRoles(roles: string[]): string[] {
  const uniqueRoles = Array.from(new Set(roles));
  return uniqueRoles.sort((a, b) => {
    const indexA = DEFAULT_ROLE_ORDER.indexOf(a);
    const indexB = DEFAULT_ROLE_ORDER.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b, "pt-BR");
  });
}

/**
 * Busca a eleição atualmente aberta (OPEN)
 */
export async function getActiveElection(): Promise<ActiveElectionData | null> {
  if (!hasNeonDatabaseUrl()) {
    const local = readLocalDb();
    const active = local.elections.find((e) => e.status === "OPEN");
    if (!active) return null;

    const electionCandidates = local.candidates.filter((c) => c.electionId === active.id);
    const rawRoles = electionCandidates.map((c) => c.role);
    const sortedRoles = sortRoles(rawRoles);

    return {
      id: active.id,
      title: active.title,
      status: active.status,
      openedAt: active.openedAt ? new Date(active.openedAt) : null,
      createdAt: new Date(active.createdAt),
      roles: sortedRoles,
    };
  }

  const activeElections = await db
    .select()
    .from(elections)
    .where(eq(elections.status, "OPEN"))
    .orderBy(desc(elections.openedAt), desc(elections.createdAt))
    .limit(1);

  if (activeElections.length === 0) {
    return null;
  }

  const election = activeElections[0];

  const electionCandidates = await db
    .select({ role: candidates.role })
    .from(candidates)
    .where(eq(candidates.electionId, election.id));

  const rawRoles = electionCandidates.map((c) => c.role);
  const sortedRoles = sortRoles(rawRoles);

  return {
    id: election.id,
    title: election.title,
    status: election.status,
    openedAt: election.openedAt,
    createdAt: election.createdAt,
    roles: sortedRoles,
  };
}

/**
 * Busca candidatos públicos de uma eleição
 */
export async function getCandidatesByElectionId(
  electionId: string
): Promise<CandidateDisplay[]> {
  let candidateList: CandidateDisplay[] = [];

  if (!hasNeonDatabaseUrl()) {
    const local = readLocalDb();
    candidateList = local.candidates
      .filter((c) => c.electionId === electionId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        number: c.number,
        role: c.role,
        photoUrl: c.photoUrl,
      }));
  } else {
    candidateList = await db
      .select({
        id: candidates.id,
        name: candidates.name,
        number: candidates.number,
        role: candidates.role,
        photoUrl: candidates.photoUrl,
      })
      .from(candidates)
      .where(eq(candidates.electionId, electionId))
      .orderBy(asc(candidates.role), asc(candidates.number));
  }

  // Ordena os candidatos considerando a ordem dos cargos
  return candidateList.sort((a, b) => {
    const roleOrderA = DEFAULT_ROLE_ORDER.indexOf(a.role);
    const roleOrderB = DEFAULT_ROLE_ORDER.indexOf(b.role);

    if (roleOrderA !== -1 && roleOrderB !== -1 && roleOrderA !== roleOrderB) {
      return roleOrderA - roleOrderB;
    }
    if (roleOrderA !== -1 && roleOrderB === -1) return -1;
    if (roleOrderA === -1 && roleOrderB !== -1) return 1;

    const roleCompare = a.role.localeCompare(b.role, "pt-BR");
    if (roleCompare !== 0) return roleCompare;

    return a.number.localeCompare(b.number);
  });
}

/**
 * Busca um candidato específico por eleição, cargo e número
 */
export async function getCandidateByNumberAndRole(
  electionId: string,
  role: string,
  number: string
): Promise<CandidateDisplay | null> {
  const all = await getCandidatesByElectionId(electionId);
  const matched = all.find(
    (c) => c.role.toLowerCase() === role.toLowerCase() && c.number === number
  );
  return matched || null;
}
