import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthApiProxy } from "@/lib/auth-proxy";

const createOrganizationSchema = z.object({
  name: z.string().min(1, { message: "Nome da organização é obrigatório" }),
  slug: z.string().min(1, { message: "Slug da organização é obrigatório" }),
  logo: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  userId: z.string().optional(),
  keepCurrentActiveOrganization: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const proxy = AuthApiProxy.getInstance();
    return proxy.createOrganization(request, body, {
      inputSchema: createOrganizationSchema,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { message: "Corpo da requisição inválido. JSON esperado." } },
        { status: 400 }
      );
    }

    return Response.json(
      { error: { message: "Erro ao criar organização" } },
      { status: 500 }
    );
  }
}