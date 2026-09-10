import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { elections, candidates, votes, voterRecords } from "@/lib/db/schema";

// Election Types
export type Election = InferSelectModel<typeof elections>;
export type NewElection = InferInsertModel<typeof elections>;
export type ElectionStatus = "DRAFT" | "OPEN" | "CLOSED";

// Candidate Types
export type Candidate = InferSelectModel<typeof candidates>;
export type NewCandidate = InferInsertModel<typeof candidates>;

// Vote Types
export type Vote = InferSelectModel<typeof votes>;
export type NewVote = InferInsertModel<typeof votes>;

// Voter Record Types
export type VoterRecord = InferSelectModel<typeof voterRecords>;
export type NewVoterRecord = InferInsertModel<typeof voterRecords>;

// Application Specific DTOs
export interface CandidateSeedItem {
  nome: string;
  numero: string;
  cargo: string;
  foto_url: string;
}

export interface CandidateDisplay {
  id: string;
  name: string;
  number: string;
  role: string;
  photoUrl: string;
}

export interface VoteSubmission {
  electionId: string;
  voterSignature: string;
  votes: {
    role: string;
    candidateId?: string | null;
    isBlank?: boolean;
    isNull?: boolean;
  }[];
}

export interface ElectionResults {
  election: Election;
  totalVoters: number;
  resultsByRole: Record<
    string,
    {
      role: string;
      totalVotes: number;
      candidates: {
        candidateId: string | null;
        name: string;
        number: string;
        photoUrl: string;
        votes: number;
        percentage: number;
      }[];
      blankVotes: number;
      blankPercentage: number;
      nullVotes: number;
      nullPercentage: number;
    }
  >;
}
