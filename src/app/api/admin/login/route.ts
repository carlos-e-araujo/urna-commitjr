import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword } from "@/lib/auth/password";
import { createAdminSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Senha não fornecida." },
        { status: 400 }
      );
    }

    const isValid = await checkAdminPassword(password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Senha administrativa incorreta." },
        { status: 401 }
      );
    }

    const sessionCookie = await createAdminSession();
    const response = NextResponse.json(
      { success: true, message: "Autenticado com sucesso." },
      { status: 200 }
    );

    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options
    );

    return response;
  } catch (error) {
    console.error("Erro no login admin:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor ao processar autenticação." },
      { status: 500 }
    );
  }
}
