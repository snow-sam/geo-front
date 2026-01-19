import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthApiProxy } from "@/lib/auth-proxy";

const roleEnum = z.enum(["admin", "member", "owner"]);

const inviteMemberSchema = z.object({
  email: z.email({ message: "Email inválido" }),
  role: z.union([
    roleEnum,
    z.array(roleEnum).min(1, { message: "Pelo menos um role deve ser fornecido" }),
  ]),
  organizationId: z.string().min(1, { message: "ID da organização inválido" }).optional(),
  resend: z.boolean().optional(),
  teamId: z.string().min(1, { message: "ID do time inválido" }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const proxy = AuthApiProxy.getInstance();
    return proxy.inviteMember(request, body, {
      inputSchema: inviteMemberSchema,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { message: "Corpo da requisição inválido. JSON esperado." } },
        { status: 400 }
      );
    }

    return Response.json(
      { error: { message: "Erro ao convidar membro" } },
      { status: 500 }
    );
  }
}

