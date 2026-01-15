import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/cadastro", "/solicitacao", "/tecnico/login"];
const authRoutes = ["/login", "/cadastro"];
const tecnicoAuthRoutes = ["/tecnico/login"];

// Nomes dos cookies do better-auth
const SESSION_COOKIE_NAME = "better-auth.session_token";
const SESSION_COOKIE_NAME_SECURE = "__Secure-better-auth.session_token";

function hasSessionCookie(request: NextRequest): boolean {
  // Verificar se existe algum cookie de sessão do better-auth
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME);
  const secureSessionToken = request.cookies.get(SESSION_COOKIE_NAME_SECURE);
  
  return !!(sessionToken?.value || secureSessionToken?.value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar arquivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isTecnicoAuthRoute = tecnicoAuthRoutes.some((route) => pathname.startsWith(route));
  const isTecnicoRoute = pathname.startsWith("/tecnico");

  // Verificar se existe cookie de sessão
  const hasSession = hasSessionCookie(request);

  // Se usuário está autenticado e tenta acessar login do técnico, redireciona para portal do técnico
  if (hasSession && isTecnicoAuthRoute) {
    return NextResponse.redirect(new URL("/tecnico", request.url));
  }

  // Se usuário está autenticado e tenta acessar login/cadastro normal, redireciona para home
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Se usuário não está autenticado e tenta acessar rota protegida do técnico
  if (!hasSession && isTecnicoRoute && !isTecnicoAuthRoute) {
    const loginUrl = new URL("/tecnico/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se usuário não está autenticado e tenta acessar rota protegida normal
  if (!hasSession && !isPublicRoute && !isTecnicoRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

