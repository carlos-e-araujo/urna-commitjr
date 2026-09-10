import { NextRequest, NextResponse } from "next/server";
import { submitVotes, VoteProcessingError } from "@/lib/services/voteService";
import { ElectionGuardError } from "@/lib/voting/electionGuard";
import {
  generateAnonymousVoterSignature,
  getVoterCookieName,
  getVoterCookieOptions,
  signVoterToken,
} from "@/lib/voting/voterProtection";
import { VoteSessionSubmission } from "@/types/vote";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VoteSessionSubmission;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Payload de votação inválido.",
        },
        { status: 400 }
      );
    }

    const electionId = body.electionId;
    if (!electionId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID da eleição não foi fornecido.",
        },
        { status: 400 }
      );
    }

    // Garante uma assinatura anônima caso o cliente não tenha enviado ou enviado em formato cru
    const voterSignature = generateAnonymousVoterSignature(
      electionId,
      body.voterSignature,
      request.headers
    );

    // Obtém cookie de voto existente se houver
    const cookieName = getVoterCookieName(electionId);
    const existingCookieToken = request.cookies.get(cookieName)?.value;

    // Submete e persiste os votos atomicamente
    const result = await submitVotes(
      {
        electionId,
        votes: body.votes,
        voterSignature,
      },
      existingCookieToken
    );

    // Cria a resposta com o cookie HttpOnly assinado
    const response = NextResponse.json(
      {
        success: true,
        message: result.message,
        recordedVotesCount: result.recordedVotesCount,
      },
      { status: 201 }
    );

    // Emite o cookie seguro de voto único
    const signedToken = signVoterToken(result.electionId, result.voterSignature);
    response.cookies.set(cookieName, signedToken, getVoterCookieOptions());

    return response;
  } catch (error: any) {
    if (error instanceof ElectionGuardError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof VoteProcessingError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    console.error("Erro não tratado no endpoint /api/vote:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno no servidor ao processar o voto.",
      },
      { status: 500 }
    );
  }
}
