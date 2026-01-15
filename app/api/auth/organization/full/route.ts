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

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies.getAll();
    const cookieHeader = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const origin = await getOrigin();

    const response = await fetch(`${AUTH_API_URL}/organization/get-full-organization`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        Origin: origin,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Organization full error:", error);
    return NextResponse.json(
      { error: { message: "Erro ao obter organização" } },
      { status: 500 }
    );
  }
}

