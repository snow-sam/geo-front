import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backend-geo-crud--samuelf21.replit.app/api/v1";

async function getOrigin(): Promise<string> {
  const headersList = await nextHeaders();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

async function proxyRequest(
  request: NextRequest,
  method: string,
  path: string
) {
  // Pegar cookies da requisição
  const cookies = request.cookies.getAll();
  const cookieHeader = cookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  // Pegar headers customizados
  const workspaceId = request.headers.get("x-workspace-id");
  const origin = await getOrigin();

  // Construir URL de destino
  const url = new URL(request.url);
  const targetUrl = `${API_URL}/${path}${url.search}`;

  // Preparar headers
  const headers: HeadersInit = {
    Cookie: cookieHeader,
    Origin: origin,
  };

  if (workspaceId) {
    headers["x-workspace-id"] = workspaceId;
  }

  // Preparar body para métodos que suportam
  let body: string | FormData | undefined;
  const contentType = request.headers.get("content-type");

  if (["POST", "PUT", "PATCH"].includes(method)) {
    if (contentType?.includes("multipart/form-data")) {
      // Para upload de arquivos, passar o formData diretamente
      body = await request.formData();
    } else if (contentType?.includes("application/json")) {
      headers["Content-Type"] = "application/json";
      body = await request.text();
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      credentials: "include",
    });

    // Copiar resposta
    const responseData = await response.text();
    
    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { message: "Erro ao conectar com o servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, "GET", path.join("/"));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, "POST", path.join("/"));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, "PUT", path.join("/"));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, "PATCH", path.join("/"));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, "DELETE", path.join("/"));
}

