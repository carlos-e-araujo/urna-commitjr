import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso aberto para a rota de login
  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";

  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;
  const isAuthenticated = session !== null && session.role === "admin";

  // Se já autenticado e tentando acessar a página de login, redireciona para o dashboard
  if (isLoginPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Permitir chamada à API de login sem autenticação prévia
  if (isLoginApi) {
    return NextResponse.next();
  }

  // Se não autenticado
  if (!isAuthenticated) {
    // Para APIs administrativas, retorna JSON 401
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { error: "Não autorizado. Sessão administrativa ausente ou inválida." },
        { status: 401 }
      );
    }

    // Para páginas administrativas web, redireciona para o login
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
