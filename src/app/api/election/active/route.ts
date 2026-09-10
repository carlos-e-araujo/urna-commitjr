import { NextResponse } from "next/server";
import { getActiveElection } from "@/lib/services/candidateService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const election = await getActiveElection();

    if (!election) {
      return NextResponse.json(
        {
          active: false,
          election: null,
          message: "Nenhuma eleição aberta no momento.",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
        }
      );
    }

    return NextResponse.json(
      {
        active: true,
        election,
        id: election.id,
        title: election.title,
        status: election.status,
        roles: election.roles,
        openedAt: election.openedAt,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao buscar eleição ativa:", error);
    return NextResponse.json(
      {
        active: false,
        error: "Erro interno ao buscar eleição ativa.",
      },
      { status: 500 }
    );
  }
}
