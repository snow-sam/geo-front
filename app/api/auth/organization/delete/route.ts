import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthApiProxy } from "@/lib/auth-proxy";

const deleteOrganizationSchema = z.object({
  organizationId: z.string().min(1, { message: "ID da organização é obrigatório" }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const proxy = AuthApiProxy.getInstance();
    return proxy.deleteOrganization(request, body, {
      inputSchema: deleteOrganizationSchema,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { message: "Corpo da requisição inválido. JSON esperado." } },
        { status: 400 }
      );
    }

    return Response.json(
      { error: { message: "Erro ao deletar organização" } },
      { status: 500 }
    );
  }
}

