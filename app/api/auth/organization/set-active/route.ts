import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthApiProxy } from "@/lib/auth-proxy";

const setActiveOrganizationSchema = z.object({
  organizationId: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => val === null || val === undefined || val.length > 0,
      { message: "ID da organização inválido" }
    ),
  organizationSlug: z
    .string()
    .min(1, { message: "Slug da organização inválido" })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const proxy = AuthApiProxy.getInstance();
    return proxy.setCurrentActiveOrganization(request, body, {
      inputSchema: setActiveOrganizationSchema,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: { message: "Corpo da requisição inválido. JSON esperado." } },
        { status: 400 }
      );
    }

    return Response.json(
      { error: { message: "Erro ao definir organização ativa" } },
      { status: 500 }
    );
  }
}

