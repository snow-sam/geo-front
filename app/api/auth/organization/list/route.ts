import { NextResponse } from "next/server";
import { authProxyGet } from "@/lib/auth-proxy";

export async function GET() {
  try {
    const response = await authProxyGet("/organization/list");
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Organization list proxy error:", error);
    return NextResponse.json(
      { error: { message: "Erro ao listar organizações" } },
      { status: 500 }
    );
  }
}

