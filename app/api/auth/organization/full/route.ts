import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthApiProxy } from "@/lib/auth-proxy";

const getFullOrganizationQuerySchema = z.object({
  organizationId: z.string().min(1, { message: "ID da organização inválido" }).optional(),
  organizationSlug: z.string().min(1, { message: "Slug da organização inválido" }).optional(),
  membersLimit: z
    .string()
    .regex(/^\d+$/, { message: "Limite de membros deve ser um número válido" })
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const proxy = AuthApiProxy.getInstance();

    // Extrair e validar query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};

    if (searchParams.has("organizationId")) {
      queryParams.organizationId = searchParams.get("organizationId")!;
    }
    if (searchParams.has("organizationSlug")) {
      queryParams.organizationSlug = searchParams.get("organizationSlug")!;
    }
    if (searchParams.has("membersLimit")) {
      queryParams.membersLimit = searchParams.get("membersLimit")!;
    }

    // Validar query parameters com Zod
    const validatedQuery = getFullOrganizationQuerySchema.parse(queryParams);

    // Converter para Record<string, string> removendo undefined
    const query: Record<string, string> = {};
    if (validatedQuery.organizationId) {
      query.organizationId = validatedQuery.organizationId;
    }
    if (validatedQuery.organizationSlug) {
      query.organizationSlug = validatedQuery.organizationSlug;
    }
    if (validatedQuery.membersLimit) {
      query.membersLimit = validatedQuery.membersLimit;
    }

    return await proxy.getFullOrganization(request, {
      query: Object.keys(query).length > 0 ? query : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: {
            message: "Parâmetros de consulta inválidos",
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return Response.json(
      { error: { message: "Erro ao obter organização completa" } },
      { status: 500 }
    );
  }
}

