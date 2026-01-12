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
    isTecnicoRoute: path.includes('tecnico'),
  });
  
  // Se não estiver no header, tentar pegar do cookie
  if (!workspaceId) {
    const workspaceCookie = request.cookies.get("x-workspace-id");
    workspaceId = workspaceCookie?.value || null;
    if (workspaceId) {
      console.log(`[Proxy] ✅ Workspace obtido do cookie: ${workspaceId.substring(0, 8)}...`);
    } else {
      // Se for rota de técnico e não tiver workspace, tentar obter através de uma requisição especial
      if (path.includes('tecnico')) {
        console.log(`[Proxy] ⚠️ Requisição de técnico sem workspace - tentando obter através do técnico...`);
        
        // Tentar fazer uma requisição ao /tecnico/me sem workspace para ver se o backend retorna o workspace necessário
        // Nota: Isso pode não funcionar se o backend realmente exigir o workspace, mas tentamos mesmo assim
        try {
          const tecnicoMeUrl = `${API_URL}/tecnico/me`;
          const tecnicoMeResponse = await fetch(tecnicoMeUrl, {
            method: "GET",
            headers: {
              Cookie: cookieHeader,
              Origin: origin,
              // Não enviar x-workspace-id para ver se o backend retorna o workspace necessário
            },
            credentials: "include",
          });
          
          if (tecnicoMeResponse.ok) {
            const tecnicoData = await tecnicoMeResponse.json();
            // Verificar se o técnico tem campo de workspace
            if (tecnicoData?.workspaceId) {
              workspaceId = tecnicoData.workspaceId;
              console.log(`[Proxy] ✅ Workspace obtido do técnico: ${workspaceId.substring(0, 8)}...`);
            } else if (tecnicoData?.organizationId) {
              workspaceId = tecnicoData.organizationId;
              console.log(`[Proxy] ✅ Workspace obtido do técnico (organizationId): ${workspaceId.substring(0, 8)}...`);
            } else if (tecnicoData?.workspace?.id) {
              workspaceId = tecnicoData.workspace.id;
              console.log(`[Proxy] ✅ Workspace obtido do técnico (workspace.id): ${workspaceId.substring(0, 8)}...`);
            } else {
              console.log(`[Proxy] ⚠️ Técnico não contém workspace - backend pode identificar automaticamente`);
            }
          } else if (tecnicoMeResponse.status === 400) {
            // Se der erro 400, pode ser que o backend retorne o workspace necessário na mensagem de erro
            try {
              const errorData = await tecnicoMeResponse.json();
              if (errorData?.requiredWorkspaceId || errorData?.workspaceId) {
                workspaceId = errorData.requiredWorkspaceId || errorData.workspaceId;
                console.log(`[Proxy] ✅ Workspace obtido da mensagem de erro: ${workspaceId.substring(0, 8)}...`);
              } else {
                console.log(`[Proxy] ⚠️ Erro 400 ao buscar técnico - backend pode identificar automaticamente pelo token`);
              }
            } catch {
              console.log(`[Proxy] ⚠️ Erro ao parsear resposta de erro - continuando sem workspace`);
            }
          } else {
            console.log(`[Proxy] ⚠️ Erro ${tecnicoMeResponse.status} ao buscar técnico - continuando sem workspace`);
          }
        } catch (e) {
          console.warn(`[Proxy] Erro ao tentar obter workspace do técnico:`, e);
          console.log(`[Proxy] ⚠️ Continuando sem workspace - backend pode identificar automaticamente`);
        }
      }
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

