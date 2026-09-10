import { NextRequest, NextResponse } from "next/server";
import { getActiveElection } from "@/lib/services/candidateService";
import { getElectionStatus } from "@/lib/voting/electionGuard";
import {
  checkIfVoterHasVoted,
  generateAnonymousVoterSignature,
  getVoterCookieName,
} from "@/lib/voting/voterProtection";
import { VoterCheckResult } from "@/types/vote";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let electionId = searchParams.get("electionId");
    const clientSignature = searchParams.get("voterSignature");

    let title: string | undefined;
    let electionStatus = null;
    let openedAt: Date | string | null = null;

    if (!electionId) {
      const activeElection = await getActiveElection();
      if (!activeElection) {
        const response: VoterCheckResult = {
          canVote: false,
          hasVoted: false,
          electionStatus: null,
          reason: "Nenhuma eleição aberta no momento.",
        };
        return NextResponse.json(response, {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
        });
      }
      electionId = activeElection.id;
      title = activeElection.title;
      electionStatus = activeElection.status;
      openedAt = activeElection.openedAt;
    } else {
      const statusInfo = await getElectionStatus(electionId);
      if (!statusInfo) {
        return NextResponse.json(
          {
            canVote: false,
            hasVoted: false,
            electionStatus: null,
            reason: "Eleição não encontrada.",
          },
          {
            status: 404,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            },
          }
        );
      }
      title = statusInfo.title;
      electionStatus = statusInfo.status;
    }

    // Se a eleição não estiver OPEN, não pode votar
    if (electionStatus !== "OPEN") {
      const reason =
        electionStatus === "DRAFT"
          ? "A eleição ainda não foi iniciada."
          : "A eleição já foi encerrada.";

      const response: VoterCheckResult = {
        canVote: false,
        hasVoted: false,
        electionStatus,
        electionId,
        title,
        reason,
        openedAt,
      };
      return NextResponse.json(response, {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      });
    }

    // Calcula o hash anônimo do eleitor
    const voterSignature = generateAnonymousVoterSignature(
      electionId,
      clientSignature,
      request.headers
    );

    // Obtém o cookie específico da eleição
    const cookieName = getVoterCookieName(electionId);
    const cookieToken = request.cookies.get(cookieName)?.value;

    const { hasVoted, reason } = await checkIfVoterHasVoted(
      electionId,
      voterSignature,
      cookieToken,
      openedAt
    );

    const responsePayload: VoterCheckResult = {
      canVote: !hasVoted,
      hasVoted,
      electionStatus: "OPEN",
      electionId,
      title,
      openedAt,
      reason: hasVoted ? reason : undefined,
    };

    const res = NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });

    // Se o eleitor não votou ou a eleição foi zerada, remove cookie obsoleto se existente
    if (!hasVoted && cookieToken) {
      res.cookies.delete(cookieName);
    }

    return res;
  } catch (error) {
    console.error("Erro ao verificar status do eleitor:", error);
    return NextResponse.json(
      {
        canVote: false,
        hasVoted: false,
        electionStatus: null,
        error: "Erro interno ao verificar permissão de voto.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
