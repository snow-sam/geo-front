import { cookies, headers } from "next/headers";

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://backend-geo-crud--samuelf21.replit.app/api/v1/auth";

export async function getAuthCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  return allCookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export async function authProxyGet(endpoint: string) {
  const cookieHeader = await getAuthCookieHeader();
  const origin = await getOrigin();

  const response = await fetch(`${AUTH_API_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
      Origin: origin,
    },
  });

  return response;
}

export async function authProxyPost(endpoint: string, body?: unknown) {
  const cookieHeader = await getAuthCookieHeader();
  const origin = await getOrigin();

  const response = await fetch(`${AUTH_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      Origin: origin,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}

export { AUTH_API_URL };

