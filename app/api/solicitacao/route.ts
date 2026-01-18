import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://backend-geo-crud--samuelf21.replit.app/api/v1/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backend-geo-crud--samuelf21.replit.app/api/v1";

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

// Schema para validação da solicitação (usando organizationId diretamente)
const solicitacaoSchema = z.object({
  organizationId: z.string().min(1, { message: "ID da organização é obrigatório" }),
  nomeEmpresa: z.string().min(1, { message: "Nome da empresa é obrigatório" }),
  nomeFuncao: z.string().min(2, { message: "Nome e função devem ter no mínimo 2 caracteres" }),
  telefoneContato: z.string().min(10, { message: "Telefone deve ter no mínimo 10 caracteres" }),
  enderecoCompleto: z.string().min(10, { message: "Endereço deve ter no mínimo 10 caracteres" }),
  precisaAutorizacao: z.boolean(),
  procedimentoAutorizacao: z.string().optional(),
  equipamentoModelo: z.string().min(2, { message: "Modelo do equipamento deve ter no mínimo 2 caracteres" }),
  descricaoProblema: z.string().min(10, { message: "Descrição do problema deve ter no mínimo 10 caracteres" }),
  fotoEquipamento: z.string().optional(),
  fotoVideoProblema: z.string().optional(),
  responsavelNome: z.string().optional(),
  responsavelTelefone: z.string().optional(),
  horarioDisponivel: z.string().min(2, { message: "Horário disponível deve ter no mínimo 2 caracteres" }),
}).refine((data) => {
  if (data.precisaAutorizacao && (!data.procedimentoAutorizacao || data.procedimentoAutorizacao.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Procedimento de autorização é obrigatório quando autorização é necessária",
  path: ["procedimentoAutorizacao"],
});

export async function POST(request: NextRequest) {
  try {
    const cookies = request.cookies.getAll();
    const cookieHeader = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const origin = await getOrigin();

    // Validar dados da solicitação
    const body = await request.json();
    const validatedData = solicitacaoSchema.parse(body);

    console.log("=== DEBUG: Recebendo solicitação ===");
    console.log("Organization ID recebido:", validatedData.organizationId);
    console.log("Nome da empresa recebido:", validatedData.nomeEmpresa);
    console.log("Dados validados:", JSON.stringify(validatedData, null, 2));
    console.log("====================================");

    // Preparar dados para enviar ao backend
    // organizationId e nomeEmpresa já vêm do frontend (já foram buscados na página)
    const dadosParaBackend = {
      ...validatedData,
    };

    console.log("✅ Dados preparados para backend:", {
      organizationId: validatedData.organizationId,
      nomeEmpresa: validatedData.nomeEmpresa,
      dadosParaBackend: JSON.stringify(dadosParaBackend, null, 2),
    });

    // Enviar para o backend
    const backendResponse = await fetch(`${API_URL}/chamados/abertura`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
        Origin: origin,
      },
      body: JSON.stringify(dadosParaBackend),
    });

    const backendData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: backendData.error || { message: "Erro ao criar solicitação" } },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(backendData, { status: backendResponse.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { message: "Dados inválidos", details: error.issues } },
        { status: 400 }
      );
    }

    console.error("Erro ao processar solicitação:", error);
    return NextResponse.json(
      { error: { message: "Erro ao processar solicitação" } },
      { status: 500 }
    );
  }
}

