import { NextResponse } from "next/server";
import { authProxyGet } from "@/lib/auth-proxy";

export async function GET() {
  try {
    const response = await authProxyGet("/organization/get-full-organization");
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Organization full proxy error:", error);
    return NextResponse.json(
      { error: { message: "Erro ao obter organização" } },
      { status: 500 }
    );
  }
}

