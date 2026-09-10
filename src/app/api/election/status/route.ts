import { NextRequest, NextResponse } from "next/server";
import { getElectionStatus } from "@/lib/voting/electionGuard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const electionId = searchParams.get("electionId") || undefined;

    const statusResult = await getElectionStatus(electionId);

    if (!statusResult) {
      return NextResponse.json(
        {
          isOpen: false,
          status: null,
          message: "Nenhuma eleição cadastrada no sistema.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: statusResult.id,
        title: statusResult.title,
        status: statusResult.status,
        isOpen: statusResult.isOpen,
        message: statusResult.message,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao consultar status da eleição:", error);
    return NextResponse.json(
      {
        isOpen: false,
        error: "Erro interno ao consultar status da eleição.",
      },
      { status: 500 }
    );
  }
}
