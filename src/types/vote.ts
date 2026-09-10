import { ElectionStatus } from "@/types/database";

export interface SingleVotePayload {
  role: string;
  candidateId?: string | null;
  candidateNumber?: string | null;
  isBlank?: boolean;
  isNull?: boolean;
}

export interface VoteSessionSubmission {
  electionId: string;
  votes: SingleVotePayload[];
  voterSignature?: string;
}

export interface VoteSubmissionResult {
  success: boolean;
  message: string;
  recordedVotesCount: number;
  electionId: string;
  voterSignature: string;
}

export interface VoterCheckResult {
  canVote: boolean;
  hasVoted: boolean;
  electionStatus: ElectionStatus | null;
  reason?: string;
  electionId?: string;
  title?: string;
}
