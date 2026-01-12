import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://backend-geo-crud--samuelf21.replit.app/api/v1/auth";

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const origin = await getOrigin();
    const headersList = await headers();
    const protocol = headersList.get("x-forwarded-proto") || "http";

    const response = await fetch(`${AUTH_API_URL}/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Criar a resposta
    const nextResponse = NextResponse.json(data, { status: response.status });

    // Copiar os cookies da resposta do backend para a resposta local
    const setCookieHeaders = response.headers.getSetCookie();

    if (setCookieHeaders && setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        // Modificar o cookie para funcionar no domínio local
        const cookieParts = cookie.split(";").map((part) => part.trim());
        const [nameValue] = cookieParts;
        const [name, ...valueParts] = nameValue.split("=");
        const value = valueParts.join("="); // Handle values that contain "="

        // Extrair Max-Age se existir
        const maxAgePart = cookieParts.find((p) =>
          p.toLowerCase().startsWith("max-age")
        );
        const maxAge = maxAgePart
          ? parseInt(maxAgePart.split("=")[1])
          : 60 * 60 * 24 * 7; // 7 dias default

        // Determinar SameSite baseado no ambiente
        // Em produção com HTTPS, usar "none" para melhor compatibilidade mobile
        // Em desenvolvimento, usar "lax"
        const isProduction = process.env.NODE_ENV === "production";
        const isSecure = protocol === "https";
        const sameSite = isProduction && isSecure ? "none" : "lax";
        
        nextResponse.cookies.set(name, value, {
          httpOnly: true,
          secure: isProduction && isSecure,
          sameSite: sameSite as "lax" | "none" | "strict",
          path: "/",
          maxAge,
        });
      }
    }

    return nextResponse;
  } catch (error) {
    console.error("Sign-in proxy error:", error);
    return NextResponse.json(
      { error: { message: "Erro ao conectar com o servidor de autenticação" } },
      { status: 500 }
    );
  }
}

