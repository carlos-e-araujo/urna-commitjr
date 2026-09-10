import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { elections, candidates } from "@/lib/db/schema";
import { CandidateDisplay, Election } from "@/types/database";

// Ordem preferencial dos cargos padrão caso presentes
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
 * Ordena lista de cargos respeitando a ordem institucional padrão e mantendo cargos customizados ao final
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

  // Busca os cargos cadastrados para esta eleição
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
  const candidateList = await db
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
  const result = await db
    .select({
      id: candidates.id,
      name: candidates.name,
      number: candidates.number,
      role: candidates.role,
      photoUrl: candidates.photoUrl,
    })
    .from(candidates)
    .where(eq(candidates.electionId, electionId))
    .limit(100);

  const matched = result.find(
    (c) => c.role.toLowerCase() === role.toLowerCase() && c.number === number
  );

  return matched || null;
}
