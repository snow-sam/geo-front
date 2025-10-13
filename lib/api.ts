import type { Cliente } from "@/types/cliente";
import type { Tecnico } from "@/types/tecnico";
import type { Visita, VisitaStats } from "@/types/visita";
import type { Chamado, ChamadoStats } from "@/types/chamado";
import type { Roteiro } from "@/types/roteiro";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

/**
 * Função auxiliar para fazer requisições HTTP
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      cache: "no-store", // Sempre buscar dados atualizados
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Erro desconhecido",
      }));
      throw new Error(error.message || `Erro HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Função auxiliar para construir query strings
 */
function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.append(key, String(value));
    }
  });
  
  return query.toString() ? `?${query.toString()}` : "";
}

// ==================== CLIENTES ====================

export interface GetClientesParams {
  page?: number;
  limit?: number;
  search?: string;
  hasEmail?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getClientes(
  params: GetClientesParams = {}
): Promise<PaginatedResponse<Cliente>> {
  const queryString = buildQueryString(params);
  return fetchAPI<PaginatedResponse<Cliente>>(`/clientes${queryString}`);
}

export async function getCliente(id: string): Promise<Cliente> {
  return fetchAPI<Cliente>(`/clientes/${id}`);
}

export interface CreateClienteData {
  nome: string;
  endereco: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  telefone?: string;
  email?: string;
  descricao?: string;
}

export async function createCliente(data: CreateClienteData): Promise<Cliente> {
  return fetchAPI<Cliente>(`/clientes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface UpdateClienteData {
  nome?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  telefone?: string;
  email?: string;
  descricao?: string;
}

export async function updateCliente(
  id: string,
  data: UpdateClienteData
): Promise<Cliente> {
  return fetchAPI<Cliente>(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCliente(id: string): Promise<void> {
  return fetchAPI<void>(`/clientes/${id}`, {
    method: "DELETE",
  });
}

// ==================== TÉCNICOS ====================

export interface GetTecnicosParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getTecnicos(
  params: GetTecnicosParams = {}
): Promise<PaginatedResponse<Tecnico>> {
  const queryString = buildQueryString(params);
  return fetchAPI<PaginatedResponse<Tecnico>>(`/tecnicos${queryString}`);
}

export async function getTecnico(id: string): Promise<Tecnico> {
  return fetchAPI<Tecnico>(`/tecnicos/${id}`);
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

export async function getVisitas(
  params: GetVisitasParams = {}
): Promise<PaginatedResponse<Visita>> {
  const queryString = buildQueryString(params);
  return fetchAPI<PaginatedResponse<Visita>>(`/visitas${queryString}`);
}

export async function getVisita(id: string): Promise<Visita> {
  return fetchAPI<Visita>(`/visitas/${id}`);
}

export interface GetVisitasStatsParams {
  dataInicio?: string;
  dataFim?: string;
}

export async function getVisitasStats(
  params: GetVisitasStatsParams = {}
): Promise<VisitaStats> {
  const queryString = buildQueryString(params);
  return fetchAPI<VisitaStats>(`/visitas/stats${queryString}`);
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

export async function getChamados(
  params: GetChamadosParams = {}
): Promise<PaginatedResponse<Chamado>> {
  const queryString = buildQueryString(params);
  return fetchAPI<PaginatedResponse<Chamado>>(`/chamados${queryString}`);
}

export async function getChamado(id: string): Promise<Chamado> {
  return fetchAPI<Chamado>(`/chamados/${id}`);
}

export interface GetChamadosStatsParams {
  dataInicio?: string;
  dataFim?: string;
}

export async function getChamadosStats(
  params: GetChamadosStatsParams = {}
): Promise<ChamadoStats> {
  const queryString = buildQueryString(params);
  return fetchAPI<ChamadoStats>(`/chamados/stats${queryString}`);
}

// ==================== ROTEIROS ====================

export interface GetRoteirosParams {
  page?: number;
  limit?: number;
  tecnicoId?: string;
  dataInicio?: string;
  dataFim?: string;
}

export async function getRoteiros(
  params: GetRoteirosParams = {}
): Promise<PaginatedResponse<Roteiro>> {
  const queryString = buildQueryString(params);
  return fetchAPI<PaginatedResponse<Roteiro>>(`/roteiros${queryString}`);
}

export async function getRoteiro(id: string): Promise<Roteiro> {
  return fetchAPI<Roteiro>(`/roteiros/${id}`);
}

