import { NextRequest, NextResponse } from "next/server";
import {
  getCandidatesByElectionId,
  getActiveElection,
} from "@/lib/services/candidateService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let electionId = searchParams.get("electionId");

    // Se electionId não for especificado, busca da eleição ativa
    if (!electionId) {
      const activeElection = await getActiveElection();
      if (!activeElection) {
        return NextResponse.json(
          {
            candidates: [],
            message: "Nenhuma eleição ativa encontrada.",
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            },
          }
        );
      }
      electionId = activeElection.id;
    }

    const candidateList = await getCandidatesByElectionId(electionId);

    return NextResponse.json(
      {
        electionId,
        candidates: candidateList,
        total: candidateList.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao buscar candidatos:", error);
    return NextResponse.json(
      {
        error: "Erro interno ao buscar candidatos.",
      },
      { status: 500 }
    );
  }
}
