import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthApiProxy } from "@/lib/auth-proxy";

const getInvitationQuerySchema = z.object({
  id: z.string().min(1, { message: "ID do convite inválido" }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const proxy = AuthApiProxy.getInstance();

    // Extrair e validar query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};

    if (searchParams.has("id")) {
      queryParams.id = searchParams.get("id")!;
    }

    // Validar query parameters com Zod
    const validatedQuery = getInvitationQuerySchema.parse(queryParams);

    // Converter para Record<string, string> removendo undefined
    const query: Record<string, string> = {};
    if (validatedQuery.id) {
      query.id = validatedQuery.id;
    }

    return await proxy.getInvitation(request, {
      query: Object.keys(query).length > 0 ? query : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: {
            message: "Parâmetros de consulta de convite inválidos",
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return Response.json(
      { error: { message: "Erro ao obter convite" } },
      { status: 500 }
    );
  }
}

