import { NextResponse } from "next/server";
import { authProxyGet } from "@/lib/auth-proxy";

export async function GET() {
  try {
    const response = await authProxyGet("/organization/list-members");
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Organization members proxy error:", error);
    return NextResponse.json(
      { error: { message: "Erro ao listar membros" } },
      { status: 500 }
    );
  }
}

