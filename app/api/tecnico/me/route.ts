import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backend-geo-crud--samuelf21.replit.app/api/v1";

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
    const workspaceId = request.headers.get("x-workspace-id") || 
                       request.cookies.get("x-workspace-id")?.value || null;

    const headers: HeadersInit = {
      Cookie: cookieHeader,
      Origin: origin,
    };

    if (workspaceId) {
      headers["x-workspace-id"] = workspaceId;
    }

    const response = await fetch(`${API_URL}/tecnico/me`, {
      method: "GET",
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Tecnico me error:", error);
    return NextResponse.json(
      { error: { message: "Erro ao obter dados do técnico" } },
      { status: 500 }
    );
  }
}

