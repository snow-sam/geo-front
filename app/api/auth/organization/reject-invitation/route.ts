import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthApiProxy } from "@/lib/auth-proxy";

const rejectInvitationSchema = z.object({
  invitationId: z.string().min(1, { message: "ID do convite é obrigatório" }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const proxy = AuthApiProxy.getInstance();
    return proxy.rejectInvitation(request, body, {
      inputSchema: rejectInvitationSchema,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { message: "Corpo da requisição inválido. JSON esperado." } },
        { status: 400 }
      );
    }
    
    return Response.json(
      { error: { message: "Erro ao rejeitar convite" } },
      { status: 500 }
    );
  }
}

