import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://api.rotgo.com.br/api/v1/auth";

// Nomes dos cookies do better-auth
const SESSION_COOKIE_NAME = "better-auth.session_token";
const SESSION_COOKIE_NAME_SECURE = "__Secure-better-auth.session_token";

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    // Pegar cookies da requisição para enviar ao backend
    const cookies = request.cookies.getAll();
    const cookieHeader = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const origin = await getOrigin();

    // Tentar fazer sign-out no backend
    await fetch(`${AUTH_API_URL}/sign-out`, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
        Origin: origin,
      },
    });

    // Criar resposta e remover os cookies locais
    const nextResponse = NextResponse.json({ success: true });

    // Remover cookies de sessão
    nextResponse.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    nextResponse.cookies.set(SESSION_COOKIE_NAME_SECURE, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return nextResponse;
  } catch (error) {
    console.error("Sign-out proxy error:", error);
    
    // Mesmo com erro, remover cookies locais
    const nextResponse = NextResponse.json({ success: true });
    
    nextResponse.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    nextResponse.cookies.set(SESSION_COOKIE_NAME_SECURE, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return nextResponse;
  }
}

