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

  // Pegar workspace ID: primeiro do header, depois do cookie
  let workspaceId = request.headers.get("x-workspace-id");
  
  // Log para debug
  console.log(`[Proxy] Requisição para ${path}:`, {
    hasHeader: !!request.headers.get("x-workspace-id"),
    headerValue: request.headers.get("x-workspace-id")?.substring(0, 8) || null,
    hasCookie: !!request.cookies.get("x-workspace-id"),
    cookieValue: request.cookies.get("x-workspace-id")?.value?.substring(0, 8) || null,
    allHeaders: Array.from(request.headers.entries()).filter(([k]) => k.toLowerCase().includes('workspace') || k.toLowerCase().includes('x-')),
  });
  
  // Se não estiver no header, tentar pegar do cookie
  if (!workspaceId) {
    const workspaceCookie = request.cookies.get("x-workspace-id");
    workspaceId = workspaceCookie?.value || null;
    if (workspaceId) {
      console.log(`[Proxy] ✅ Workspace obtido do cookie: ${workspaceId.substring(0, 8)}...`);
    }
  } else {
    console.log(`[Proxy] ✅ Workspace obtido do header: ${workspaceId.substring(0, 8)}...`);
  }
  
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
  } else {
    // Log para debug - remover em produção se necessário
    console.log(`[Proxy] Workspace ID ausente para ${path}`);
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
    
    // Log para debug em caso de erro 400
    if (response.status === 400) {
      console.log(`[Proxy] Erro 400 em ${path}:`, {
        workspaceId,
        hasCookie: !!request.cookies.get("x-workspace-id"),
        hasHeader: !!request.headers.get("x-workspace-id"),
      });
    }
    
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

