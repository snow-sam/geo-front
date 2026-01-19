import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthApiProxy } from "@/lib/auth-proxy";

const checkSlugSchema = z.object({
  slug: z.string().min(1, { message: "Slug da organização é obrigatório" }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const proxy = AuthApiProxy.getInstance();
    return proxy.checkOrganizationSlug(request, body, {
      inputSchema: checkSlugSchema,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { message: "Corpo da requisição inválido. JSON esperado." } },
        { status: 400 }
      );
    }

    return Response.json(
      { error: { message: "Erro ao verificar slug da organização" } },
      { status: 500 }
    );
  }
}
