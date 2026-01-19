import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://api.rotgo.com.br/api/v1/auth";

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationSlug = searchParams.get("slug");

    if (!organizationSlug) {
      return NextResponse.json(
        { error: { message: "Slug da organização é obrigatório" } },
        { status: 400 }
      );
    }

    const cookies = request.cookies.getAll();
    const cookieHeader = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const origin = await getOrigin();

    // Buscar organização usando a slug através do better-auth
    const orgUrl = `${AUTH_API_URL}/organization/get-full-organization?organizationSlug=${encodeURIComponent(organizationSlug)}`;
    const orgResponse = await fetch(orgUrl, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        Origin: origin,
      },
    });

    if (!orgResponse.ok) {
      const orgError = await orgResponse.json().catch(() => ({ 
        error: { message: "Erro ao buscar organização" } 
      }));
      return NextResponse.json(
        { error: { message: orgError.error?.message || "Organização não encontrada" } },
        { status: orgResponse.status }
      );
    }

    const orgData = await orgResponse.json();
    const organization = orgData.data || orgData;

    if (!organization || !organization.id) {
      return NextResponse.json(
        { error: { message: "Organização não encontrada" } },
        { status: 404 }
      );
    }

    // Retornar dados da organização
    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      metadata: organization.metadata,
    });
  } catch (error) {
    console.error("Erro ao buscar organização por slug:", error);
    return NextResponse.json(
      { error: { message: "Erro ao buscar organização" } },
      { status: 500 }
    );
  }
}

