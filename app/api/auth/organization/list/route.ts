import type { NextRequest } from "next/server";
import { AuthApiProxy } from "@/lib/auth-proxy";

export async function GET(request: NextRequest) {
  const proxy = AuthApiProxy.getInstance();
  return await proxy.listOrganizations(request);
}

