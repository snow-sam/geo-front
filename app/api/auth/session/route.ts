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
  const cookies = request.cookies.getAll();
  const cookieHeader = cookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  if (!cookieHeader) {
    return NextResponse.json({ session: null, user: null });
  }

  try {
    const origin = await getOrigin();

    const response = await fetch(`${AUTH_API_URL}/get-session`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        Origin: origin,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ session: null, user: null });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ session: null, user: null });
  }
}

