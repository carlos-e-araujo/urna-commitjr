import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth/session";

export async function POST() {
  const sessionCookie = destroyAdminSession();
  const response = NextResponse.json(
    { success: true, message: "Sessão encerrada com sucesso." },
    { status: 200 }
  );

  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options
  );

  return response;
}
