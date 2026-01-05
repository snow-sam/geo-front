/**
 * Funções de API para Server Components
 * Este arquivo usa next/headers e só pode ser importado em Server Components
 */
import type { Cliente } from "@/types/cliente";
import type { Tecnico } from "@/types/tecnico";
import type { Chamado } from "@/types/chamado";
import type { Roteiro } from "@/types/roteiro";
import type { Visita, VisitaStats } from "@/types/visita";
import { cookies } from "next/headers";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Função auxiliar para construir query strings
 */
function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, String(v)));
    } else {
      query.append(key, String(value));
    }
  });

  return query.toString() ? `?${query.toString()}` : "";
}

/**
 * Função auxiliar para fazer requisições HTTP em Server Components
 * Usa cookies() do next/headers para obter cookies de sessão
 */
async function fetchAPIServer<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  // Obtém cookies do request no servidor
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join("; ");
  
  // Obtém workspace ID do cookie
  const workspaceIdCookie = cookieStore.get("x-workspace-id");
  const workspaceId = workspaceIdCookie?.value || null;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
        ...(workspaceId ? { "x-workspace-id": workspaceId } : {}),
        ...options?.headers,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Erro desconhecido",
      }));
      throw new Error(error.message || `Erro HTTP: ${response.status}`);
    }
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return data;
  } catch (error) {
    console.error(`Erro ao buscar ${endpoint}:`, error);
    throw error;
  }
}

// ==================== CLIENTES ====================

export interface GetClientesParams {
  page?: number;
  limit?: number;
  search?: string;
  hasEmail?: boolean;
}

/**
 * Versão server-side de getClientes para uso em Server Components
 */
export async function getClientesServer(
  params: GetClientesParams = {}
): Promise<PaginatedResponse<Cliente>> {
  const queryString = buildQueryString(params);
  return fetchAPIServer<PaginatedResponse<Cliente>>(`/clientes${queryString}`);
}

// ==================== TÉCNICOS ====================

export interface GetTecnicosParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Versão server-side de getTecnicos para uso em Server Components
 */
export async function getTecnicosServer(
  params: GetTecnicosParams = {}
): Promise<PaginatedResponse<Tecnico>> {
  const queryString = buildQueryString(params);
  return fetchAPIServer<PaginatedResponse<Tecnico>>(`/tecnicos${queryString}`);
}

// ==================== CHAMADOS ====================

export interface GetChamadosParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Versão server-side de getChamados para uso em Server Components
 */
export async function getChamadosServer(
  params: GetChamadosParams = {}
): Promise<PaginatedResponse<Chamado>> {
  const queryString = buildQueryString(params);
  return fetchAPIServer<PaginatedResponse<Chamado>>(`/chamados${queryString}`);
}

// ==================== ROTEIROS ====================

export interface GetRoteirosParams {
  page?: number;
  limit?: number;
  tecnicoId?: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Versão server-side de getRoteiros para uso em Server Components
 */
export async function getRoteirosServer(
  params: GetRoteirosParams = {}
): Promise<PaginatedResponse<Roteiro>> {
  const queryString = buildQueryString({
    join: [
      "visitas",
      "tecnico",
      "visitas.cliente"
    ], ...params
  });
  return fetchAPIServer<PaginatedResponse<Roteiro>>(`/roteiros${queryString}`);
}

// ==================== VISITAS ====================

export interface GetVisitasParams {
  page?: number;
  limit?: number;
  status?: string;
  tecnicoId?: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Versão server-side de getVisitas para uso em Server Components
 */
export async function getVisitasServer(
  params: GetVisitasParams = {}
): Promise<PaginatedResponse<Visita>> {
  const queryString = buildQueryString({
    join: [
      "cliente(nome,endereco)",
      "tecnico(nome,endereco)",
    ], ...params
  });
  return fetchAPIServer<PaginatedResponse<Visita>>(`/visitas${queryString}`);
}

export interface GetVisitasStatsParams {
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Versão server-side de getVisitasStats para uso em Server Components
 */
export async function getVisitasStatsServer(
  params: GetVisitasStatsParams = {}
): Promise<VisitaStats> {
  const queryString = buildQueryString(params);
  return fetchAPIServer<VisitaStats>(`/visitas/stats${queryString}`);
}

