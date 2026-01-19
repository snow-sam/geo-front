import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthApiProxy } from "@/lib/auth-proxy";

const updateOrganizationSchema = z.object({
  data: z
    .object({
      name: z.string().min(1, { message: "Nome da organização inválido" }).optional(),
      slug: z.string().min(1, { message: "Slug da organização inválido" }).optional(),
      logo: z.string().optional(),
      metadata: z.record(z.string(), z.any()).nullable().optional(),
    })
    .optional(),
  organizationId: z.string().min(1, { message: "ID da organização inválido" }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const proxy = AuthApiProxy.getInstance();
    return proxy.updateOrganization(request, body, {
      inputSchema: updateOrganizationSchema,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { message: "Corpo da requisição inválido. JSON esperado." } },
        { status: 400 }
      );
    }

    return Response.json(
      { error: { message: "Erro ao atualizar organização" } },
      { status: 500 }
    );
  }
}

