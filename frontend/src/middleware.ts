import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const _refreshToken = request.cookies.get("refresh_token")?.value;

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  // Se está em página de auth e já tem token, redireciona para feed
  if (isAuthPage && accessToken) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Permitir acesso a todas as outras páginas sem autenticação
  // O site funciona de forma limitada sem login
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register"],
};
