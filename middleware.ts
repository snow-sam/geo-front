import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/cadastro", "/solicitacao", "/tecnico/login"];
const authRoutes = ["/login", "/cadastro"];
const tecnicoAuthRoutes = ["/tecnico/login"];

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "https://backend-geo-crud--samuelf21.replit.app/api/v1/auth";

async function getSession(request: NextRequest): Promise<boolean> {
  // Pegar todos os cookies relacionados ao better-auth
  const cookies = request.cookies.getAll();
  const cookieHeader = cookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  if (!cookieHeader) {
    return false;
  }

  try {
    const response = await fetch(`${AUTH_API_URL}/get-session`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return !!data?.session;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar arquivos estáticos e API routes
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

  // Verificar sessão com o backend
  const hasSession = await getSession(request);

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

