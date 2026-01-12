import type { Cliente } from "@/types/cliente";
import type { Tecnico } from "@/types/tecnico";
import type { Visita, VisitaStats } from "@/types/visita";
import type { Chamado, ChamadoStats } from "@/types/chamado";
import type { Roteiro } from "@/types/roteiro";
import type { Solicitacao, SolicitacaoFormValues } from "@/types/solicitacao";

// Usar API route proxy local para evitar problemas de CORS/cookies cross-domain
const API_URL = "/api/proxy";

/**
 * Obtém o workspace ID do localStorage (preferencial) ou cookie
 */
function getWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  
  // Primeiro tenta localStorage (mais atualizado)
  const fromStorage = localStorage.getItem("activeWorkspaceId");
  if (fromStorage) return fromStorage;
  
  // Fallback para cookie
  const cookieMatch = document.cookie.match(/x-workspace-id=([^;]+)/);
  return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
}

/**
 * Define o workspace ID ativo no localStorage e cookie (para SSR)
 */
export function setWorkspaceId(workspaceId: string | null): void {
  if (typeof window === "undefined") return;

  if (workspaceId) {
    // Salvar no localStorage para client-side
    try {
      localStorage.setItem("activeWorkspaceId", workspaceId);
    } catch (e) {
      console.warn("[setWorkspaceId] Erro ao salvar no localStorage:", e);
    }
    
    // Salvar também como cookie para SSR e requisições
    // Usar configuração compatível com mobile
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    const isSecure = window.location.protocol === "https:";
    
    // No mobile, usar SameSite=None com Secure para funcionar em todos os contextos
    // Se não for HTTPS, usar Lax
    const sameSite = isSecure ? "None" : "Lax";
    const secureFlag = isSecure ? "; Secure" : "";
    
    // Definir cookie com configuração otimizada para mobile
    document.cookie = `x-workspace-id=${encodeURIComponent(workspaceId)}; path=/; expires=${expires.toUTCString()}; SameSite=${sameSite}${secureFlag}`;
    
    // Log para debug (remover em produção se necessário)
    console.log(`[setWorkspaceId] Workspace definido: ${workspaceId.substring(0, 8)}... (Secure: ${isSecure}, SameSite: ${sameSite})`);
    
  } else {
    try {
      localStorage.removeItem("activeWorkspaceId");
    } catch (e) {
      console.warn("[setWorkspaceId] Erro ao remover do localStorage:", e);
    }
    document.cookie = "x-workspace-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

/**
 * Função auxiliar para fazer requisições HTTP
 * Funciona em Client Components
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  // Sempre tentar obter o workspace ID do localStorage primeiro
  // Isso é mais confiável no mobile onde cookies podem não funcionar
  let workspaceId = getWorkspaceId();
  
  // Se não encontrou, tentar buscar da sessão de forma síncrona antes da requisição
  // Isso é crítico no mobile onde o workspace pode não estar definido ainda
  if (!workspaceId && typeof window !== "undefined") {
    try {
      console.log(`[fetchAPI] Workspace não encontrado, buscando da sessão para ${endpoint}...`);
      
      // Fazer requisição síncrona para buscar workspace antes de continuar
      const sessionRes = await fetch("/api/auth/session", { 
        credentials: "include",
        cache: "no-store"
      });
      
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        console.log(`[fetchAPI] Dados da sessão:`, {
          hasSession: !!sessionData?.session,
          activeOrgId: sessionData?.session?.activeOrganizationId,
        });
        
        if (sessionData?.session?.activeOrganizationId) {
          workspaceId = sessionData.session.activeOrganizationId;
          // Definir imediatamente para próximas requisições
          setWorkspaceId(workspaceId);
          console.log(`[fetchAPI] ✅ Workspace obtido da sessão: ${workspaceId.substring(0, 8)}...`);
        } else {
          // Tentar buscar organizações se não houver workspace ativo
          console.log(`[fetchAPI] Nenhum workspace ativo na sessão, buscando organizações...`);
          try {
            const { organizationClient } = await import("@/lib/organization-client");
            const orgsResult = await organizationClient.list();
            const orgsData = orgsResult.data 
              ? (Array.isArray(orgsResult.data) ? orgsResult.data : [])
              : [];
            
            if (orgsData.length > 0) {
              const firstOrg = orgsData[0];
              // Definir como ativa
              await organizationClient.setActive({ organizationId: firstOrg.id });
              workspaceId = firstOrg.id;
              setWorkspaceId(workspaceId);
              console.log(`[fetchAPI] ✅ Workspace obtido da primeira organização: ${workspaceId.substring(0, 8)}...`);
            } else {
              console.warn(`[fetchAPI] ⚠️ Nenhuma organização encontrada`);
            }
          } catch (orgError) {
            console.warn(`[fetchAPI] Erro ao buscar organizações:`, orgError);
          }
        }
      } else {
        console.warn(`[fetchAPI] Erro ao buscar sessão: ${sessionRes.status}`);
      }
    } catch (e) {
      console.error(`[fetchAPI] ❌ Erro ao buscar workspace da sessão para ${endpoint}:`, e);
    }
  } else if (workspaceId) {
    console.log(`[fetchAPI] ✅ Workspace encontrado no storage: ${workspaceId.substring(0, 8)}...`);
  }

  // Preparar headers garantindo que o workspace sempre seja enviado se disponível
  // IMPORTANTE: Mesclar headers corretamente para não perder valores importantes
  const baseHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // Mesclar headers de options primeiro
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        baseHeaders[key] = value;
      });
    } else {
      Object.assign(baseHeaders, options.headers);
    }
  }
  
  // SEMPRE enviar workspace no header se disponível (mais confiável que cookie no mobile)
  // Isso sobrescreve qualquer valor anterior para garantir que o workspace correto seja enviado
  if (workspaceId) {
    baseHeaders["x-workspace-id"] = workspaceId;
    console.log(`[fetchAPI] 📤 Enviando workspace no header para ${endpoint}: ${workspaceId.substring(0, 8)}...`);
  } else {
    // Log de erro mais detalhado para debug
    console.error(`[fetchAPI] ⚠️ Workspace ID não encontrado para ${endpoint}`, {
      localStorage: typeof window !== "undefined" ? localStorage.getItem("activeWorkspaceId") : "N/A",
      cookie: typeof document !== "undefined" ? document.cookie.match(/x-workspace-id=([^;]+)/)?.[1] : "N/A",
      url,
    });
    
    // Se não tiver workspace, ainda tentar fazer a requisição
    // O backend pode ter uma forma alternativa de identificar o workspace
    console.warn(`[fetchAPI] ⚠️ Continuando sem workspace - backend pode rejeitar`);
  }
  
  const headers = baseHeaders;

  try {
    console.log(`[fetchAPI] 🚀 Fazendo requisição para ${url}`, {
      method: options?.method || "GET",
      hasWorkspace: !!workspaceId,
      workspaceValue: workspaceId ? `${workspaceId.substring(0, 8)}...` : null,
      headers: Object.keys(headers),
      headerValues: Object.entries(headers).map(([k, v]) => ({ [k]: typeof v === 'string' ? v.substring(0, 20) : v })),
    });
    
    // Criar objeto de fetch options garantindo que headers sejam mesclados corretamente
    const fetchOptions: RequestInit = {
      ...options,
      credentials: "include",
      cache: "no-store",
      headers: headers, // Headers já preparados com workspace
    };
    
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = `Erro HTTP: ${response.status}`;
      let isWorkspaceError = false;
      
      try {
        const error = await response.json();
        errorMessage = error.message || error.error?.message || errorMessage;
        
        // Verificar se o erro é relacionado a workspace ausente
        if (response.status === 400 && (
          errorMessage.toLowerCase().includes("workspace") ||
          errorMessage.toLowerCase().includes("organization") ||
          errorMessage.toLowerCase().includes("x-workspace-id") ||
          errorMessage.toLowerCase().includes("não informado")
        )) {
          isWorkspaceError = true;
          errorMessage = "Workspace não definido. Recarregue a página.";
          
          // Tentar buscar workspace novamente se ainda não tiver
          if (typeof window !== "undefined" && !workspaceId) {
            try {
              const sessionRes = await fetch("/api/auth/session", { 
                credentials: "include",
                cache: "no-store"
              });
              
              if (sessionRes.ok) {
                const sessionData = await sessionRes.json();
                if (sessionData?.session?.activeOrganizationId) {
                  const newWorkspaceId = sessionData.session.activeOrganizationId;
                  setWorkspaceId(newWorkspaceId);
                  console.log(`[fetchAPI] Workspace recuperado após erro 400: ${newWorkspaceId.substring(0, 8)}...`);
                  // Não relançar erro, deixar o componente tentar novamente
                }
              }
            } catch (e) {
              console.warn("[fetchAPI] Erro ao recuperar workspace após erro 400:", e);
            }
          }
        }
      } catch {
        // Se não conseguir parsear JSON, usar mensagem padrão baseada no status
        if (response.status === 400) {
          errorMessage = "Requisição inválida. Verifique se o workspace está definido.";
          isWorkspaceError = true;
        } else if (response.status === 401) {
          errorMessage = "Não autorizado. Faça login novamente.";
        } else if (response.status === 403) {
          errorMessage = "Acesso negado.";
        } else if (response.status === 404) {
          errorMessage = "Recurso não encontrado.";
        } else if (response.status === 500) {
          errorMessage = "Erro no servidor. Tente novamente.";
        }
      }
      
      const error = new Error(errorMessage);
      (error as Error & { status?: number; isWorkspaceError?: boolean }).status = response.status;
      (error as Error & { status?: number; isWorkspaceError?: boolean }).isWorkspaceError = isWorkspaceError;
      throw error;
    }
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return data;
  } catch (error) {
    console.error(`Erro ao buscar ${endpoint}:`, error);
    
    // Se for um erro de rede, criar mensagem mais amigável
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
    }
    
    throw error;
  }
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


// ==================== CLIENTES ====================

export interface GetClientesParams {
  page?: number;
  limit?: number;
  search?: string;
  hasEmail?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  pageCount: number;
  page: number;
  total: number;
}

export async function getClientes(
  params: GetClientesParams = {}
): Promise<PaginatedResponse<Cliente>> {
  const queryString = buildQueryString(params as Record<string, unknown>);
  return fetchAPI<PaginatedResponse<Cliente>>(`/clientes${queryString}`);
}

export async function getCliente(id: string): Promise<Cliente> {
  return fetchAPI<Cliente>(`/clientes/${id}`);
}

export interface CreateClienteData {
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  telefone?: string;
  email?: string;
  descricao?: string;
}

export async function createCliente(data: CreateClienteData): Promise<Cliente> {
  const apiData = data;
  return fetchAPI<Cliente>(`/clientes`, {
    method: "POST",
    body: JSON.stringify(apiData),
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
  const apiData = data;
  return fetchAPI<Cliente>(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(apiData),
  });
}

export async function deleteCliente(id: string): Promise<void> {
  return fetchAPI<void>(`/clientes/${id}`, {
    method: "DELETE",
  });
}


/**
 * Importa clientes a partir de um arquivo Excel
 * O backend processa o arquivo, busca coordenadas via Google Maps e salva os clientes
 */
export async function importClientesExcel(file: File): Promise<Cliente[]> {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${API_URL}/clientes/import`;
  const workspaceId = getWorkspaceId();
  
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: workspaceId ? { "x-workspace-id": workspaceId } : {},
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Erro desconhecido",
      }));
      throw new Error(error.message || `Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao importar clientes:", error);
    throw error;
  }
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
  const queryString = buildQueryString(params as Record<string, unknown>);
  return fetchAPI<PaginatedResponse<Tecnico>>(`/tecnicos${queryString}`);
}

export async function getTecnico(id: string): Promise<Tecnico> {
  return fetchAPI<Tecnico>(`/tecnicos/${id}`);
}

/**
 * Retorna o técnico vinculado ao usuário logado
 * Endpoint: GET /tecnico/me
 */
export async function getTecnicoMe(): Promise<Tecnico> {
  return fetchAPI<Tecnico>(`/tecnico/me`);
}

/**
 * Retorna os roteiros do técnico logado
 * Endpoint: GET /tecnico/roteiros
 * Filtro por tecnicoId é automático (pela sessão)
 * Retorna array direto (sem paginação)
 */
export async function getTecnicoRoteiros(): Promise<Roteiro[]> {
  return fetchAPI<Roteiro[]>(`/tecnico/roteiros`);
}

/**
 * Retorna detalhes de um roteiro específico do técnico logado
 * Endpoint: GET /tecnico/roteiros/:id
 * Relations já incluídas no backend
 */
export async function getTecnicoRoteiro(id: string): Promise<Roteiro> {
  return fetchAPI<Roteiro>(`/tecnico/roteiros/${id}`);
}

export interface CreateTecnicoData {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  placa?: string;
  especialidade?: string;
}

/**
 * Transforma dados do frontend (português) para o formato da API (inglês) - Técnicos
 */
// function transformTecnicoToApiFormat(
//   data: CreateTecnicoData | UpdateTecnicoData
// ): any {
//   const transformed: any = {};

//   if ("nome" in data && data.nome !== undefined) transformed.name = data.nome;
//   if ("endereco" in data && data.endereco !== undefined)
//     transformed.address = data.endereco;
//   if ("latitude" in data && data.latitude !== undefined)
//     transformed.latitude = data.latitude;
//   if ("longitude" in data && data.longitude !== undefined)
//     transformed.longitude = data.longitude;
//   if ("placeId" in data && data.placeId !== undefined)
//     transformed.placeId = data.placeId;
//   if ("placa" in data && data.placa !== undefined)
//     transformed.plate = data.placa;
//   if ("telefone" in data && data.telefone !== undefined)
//     transformed.phone = data.telefone;
//   if ("email" in data && data.email !== undefined)
//     transformed.email = data.email;
//   if ("especialidade" in data && data.especialidade !== undefined)
//     transformed.specialty = data.especialidade;

//   return transformed;
// }

export async function createTecnico(data: CreateTecnicoData): Promise<Tecnico> {
  const apiData = data;
  return fetchAPI<Tecnico>(`/tecnicos`, {
    method: "POST",
    body: JSON.stringify(apiData),
  });
}

export interface UpdateTecnicoData {
  nome?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  placa?: string;
  especialidade?: string;
}

export async function updateTecnico(
  id: string,
  data: UpdateTecnicoData
): Promise<Tecnico> {
  const apiData = data;
  return fetchAPI<Tecnico>(`/tecnicos/${id}`, {
    method: "PUT",
    body: JSON.stringify(apiData),
  });
}

export async function deleteTecnico(id: string): Promise<void> {
  return fetchAPI<void>(`/tecnicos/${id}`, {
    method: "DELETE",
  });
}

/**
 * Importa técnicos a partir de um arquivo Excel
 * O backend processa o arquivo, busca coordenadas via Google Maps e salva os técnicos
 */
export async function importTecnicosExcel(file: File): Promise<Tecnico[]> {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${API_URL}/tecnicos/import`;
  const workspaceId = getWorkspaceId();

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: workspaceId ? { "x-workspace-id": workspaceId } : {},
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Erro desconhecido",
      }));
      throw new Error(error.message || `Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao importar técnicos:", error);
    throw error;
  }
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
  const queryString = buildQueryString({
    join: [
      "cliente(nome,endereco)",
      "tecnico(nome,endereco)",
    ], ...params
  });
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
  const queryString = buildQueryString(params as Record<string, unknown>);
  return fetchAPI<VisitaStats>(`/visitas/stats${queryString}`);
}

export interface UpdateVisitaData {
  tecnicoId?: string;
  status?: string;
  dataAgendamento?: string;
  observacoes?: string;
}

export async function updateVisita(
  id: string,
  data: UpdateVisitaData
): Promise<Visita> {
  return fetchAPI<Visita>(`/visitas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
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
  const queryString = buildQueryString(params as Record<string, unknown>);
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
  const queryString = buildQueryString(params as Record<string, unknown>);
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
  const queryString = buildQueryString({
    join: [
      "visitas",
      "tecnico",
      "visitas.cliente"
    ], ...params
  });
  return fetchAPI<PaginatedResponse<Roteiro>>(`/roteiros${queryString}`);
}

export async function getRoteiro(id: string): Promise<Roteiro> {
  const queryString = buildQueryString({
    join: ["visitas", "tecnico", "visitas.cliente"],
  });
  return fetchAPI<Roteiro>(`/roteiros/${id}${queryString}`);
}

// ==================== SOLICITAÇÕES ====================

export async function createSolicitacao(
  data: SolicitacaoFormValues
): Promise<Solicitacao> {
  return fetchAPI<Solicitacao>(`/chamados/abertura`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==================== RELATÓRIOS DE VISITA ====================

export interface CreateRelatorioVisitaData {
  visitaId: string;
  clienteNome: string;
  endereco: string;
  data: string;
  horarioInicio: string;
  horarioFim?: string;
  descricaoGeral: string;
  avaliacao: number;
  observacoesAvaliacao?: string;
  assinaturaCliente: string;
}

export interface RelatorioVisita extends CreateRelatorioVisitaData {
  id: string;
  workspaceId: string;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Cria um novo relatório de visita
 * Endpoint: POST /relatorios-visita
 */
export async function createRelatorioVisita(
  data: CreateRelatorioVisitaData
): Promise<RelatorioVisita> {
  return fetchAPI<RelatorioVisita>(`/relatorios-visita`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==================== AGENDA ====================

export async function gerarVisitasDoMes(data: string, salvar: boolean): Promise<void> {
  return fetchAPI<void>(`/agenda/mes`, {
    method: "POST",
    body: JSON.stringify({ data, salvar }),
  });
}

export async function gerarRoteiroDoDia(data: string, salvar: boolean): Promise<void> {
  return fetchAPI<void>(`/agenda/roteiro-dia`, {
    method: "POST",
    body: JSON.stringify({ data, salvar }),
  });
}

// ==================== DASHBOARD ====================

export interface DashboardStats {
  totalClientes: number;
  tecnicosAtivos: number;
  visitasAgendadas: number;
  chamadosAbertos: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchAPI<DashboardStats>(`/dashboard/stats`);
}

// ==================== RELATÓRIOS DE VISITA - LISTAGEM ====================

export interface GetRelatoriosParams {
  page?: number;
  limit?: number;
  dataInicio?: string;
  dataFim?: string;
  clienteNome?: string;
  avaliacao?: number;
}

export async function getRelatoriosVisita(
  params: GetRelatoriosParams = {}
): Promise<PaginatedResponse<RelatorioVisita>> {
  const queryString = buildQueryString({
    join: [
      "visita",
      "visita.cliente",
      "visita.tecnico"
    ], ...params
  });
  return fetchAPI<PaginatedResponse<RelatorioVisita>>(`/relatorios-visita${queryString}`);
}

export async function getRelatorioVisita(id: string): Promise<RelatorioVisita> {
  return fetchAPI<RelatorioVisita>(`/relatorios-visita/${id}`);
}
