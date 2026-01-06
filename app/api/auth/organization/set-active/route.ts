import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authProxyPost } from "@/lib/auth-proxy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await authProxyPost("/organization/set-active", body);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Organization set-active proxy error:", error);
    return NextResponse.json(
      { error: { message: "Erro ao definir organização ativa" } },
      { status: 500 }
    );
  }
}

