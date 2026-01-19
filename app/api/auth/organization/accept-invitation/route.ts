import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthApiProxy } from "@/lib/auth-proxy";

const acceptInvitationSchema = z.object({
  invitationId: z.string().min(1, { message: "ID do convite é obrigatório" }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const proxy = AuthApiProxy.getInstance();
    return proxy.acceptInvitation(request, body, {
      inputSchema: acceptInvitationSchema,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { message: "Corpo da requisição inválido. JSON esperado." } },
        { status: 400 }
      );
    }

    return Response.json(
      { error: { message: "Erro ao aceitar convite" } },
      { status: 500 }
    );
  }
}

