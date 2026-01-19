import type { Cliente } from "@/types/cliente";
import type { Tecnico } from "@/types/tecnico";
import type { Visita, VisitaStats } from "@/types/visita";
import type { Chamado, ChamadoStats } from "@/types/chamado";
import type { Roteiro } from "@/types/roteiro";
import type { Solicitacao, SolicitacaoFormValues } from "@/types/solicitacao";

// Usar API route proxy local para evitar problemas de CORS/cookies cross-domain
const API_URL = "/api/proxy";

// Cache em memória para workspace (útil quando localStorage/cookie não funcionam)
let workspaceIdCache: string | null = null;

/**
 * Obtém o workspace ID do localStorage, sessionStorage, cookie ou cache em memória
 */
function getWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    // 1. Tenta localStorage primeiro (persiste entre sessões)
    try {
      const fromLocalStorage = localStorage.getItem("activeWorkspaceId");
      if (fromLocalStorage) {
        workspaceIdCache = fromLocalStorage; // Atualizar cache
        return fromLocalStorage;
      }
    } catch (e) {
      // Ignorar erro ao acessar localStorage
    }
    
    // 2. Tenta sessionStorage (persiste durante a sessão do navegador)
    try {
      const fromSessionStorage = sessionStorage.getItem("activeWorkspaceId");
      if (fromSessionStorage) {
        workspaceIdCache = fromSessionStorage; // Atualizar cache
        return fromSessionStorage;
      }
    } catch (e) {
      // Ignorar erro ao acessar sessionStorage
    }
    
    // 3. Fallback para cookie
    try {
      const cookieMatch = document.cookie.match(/x-workspace-id=([^;]+)/);
      if (cookieMatch) {
        const cookieValue = decodeURIComponent(cookieMatch[1]);
        workspaceIdCache = cookieValue; // Atualizar cache
        return cookieValue;
      }
    } catch (e) {
      // Ignorar erro ao acessar cookie
    }
    
    // 4. Último recurso: cache em memória (só funciona durante a sessão atual)
    if (workspaceIdCache) {
      return workspaceIdCache;
    }
    
    return null;
  } catch (e) {
    return workspaceIdCache; // Retornar cache se disponível
  }
}

/**
 * Define o workspace ID ativo no localStorage e cookie (para SSR)
 */
export function setWorkspaceId(workspaceId: string | null): void {
  if (typeof window === "undefined") return;

  // Atualizar cache em memória sempre
  workspaceIdCache = workspaceId;

  if (workspaceId) {
    // 1. Salvar no localStorage (persiste entre sessões)
    try {
      localStorage.setItem("activeWorkspaceId", workspaceId);
    } catch (e) {
      // Ignorar erro ao salvar no localStorage
    }
    
    // 2. Salvar no sessionStorage (persiste durante a sessão)
    try {
      sessionStorage.setItem("activeWorkspaceId", workspaceId);
    } catch (e) {
      // Ignorar erro ao salvar no sessionStorage
    }
    
    // Salvar também como cookie para SSR e requisições
    // Usar configuração compatível com mobile
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    const isSecure = window.location.protocol === "https:";
    
    // Tentar diferentes configurações de cookie para garantir compatibilidade mobile
    // No mobile, cookies podem ter problemas com SameSite=None mesmo com Secure
    let cookieSaved = false;
    
    // Tentar 1: SameSite=Lax (funciona na maioria dos casos)
    const cookieValue1 = `x-workspace-id=${encodeURIComponent(workspaceId)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
    document.cookie = cookieValue1;
    
    // Verificar se foi salvo
    const verifyCookie = document.cookie.match(/x-workspace-id=([^;]+)/);
    cookieSaved = !!(verifyCookie && decodeURIComponent(verifyCookie[1]) === workspaceId);
    
    // Tentar 2: Se não funcionou e é HTTPS, tentar com Secure
    if (!cookieSaved && isSecure) {
      const cookieValue2 = `x-workspace-id=${encodeURIComponent(workspaceId)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax; Secure`;
      document.cookie = cookieValue2;
      const verifyCookie2 = document.cookie.match(/x-workspace-id=([^;]+)/);
      cookieSaved = !!(verifyCookie2 && decodeURIComponent(verifyCookie2[1]) === workspaceId);
    }
    
    // Tentar 3: Sem SameSite (fallback)
    if (!cookieSaved) {
      const cookieValue3 = `x-workspace-id=${encodeURIComponent(workspaceId)}; path=/; expires=${expires.toUTCString()}`;
      document.cookie = cookieValue3;
      const verifyCookie3 = document.cookie.match(/x-workspace-id=([^;]+)/);
      cookieSaved = !!(verifyCookie3 && decodeURIComponent(verifyCookie3[1]) === workspaceId);
    }
    
    
  } else {
    // Limpar todos os storages
    try {
      localStorage.removeItem("activeWorkspaceId");
    } catch (e) {
      // Ignorar erro ao remover do localStorage
    }
    
    try {
      sessionStorage.removeItem("activeWorkspaceId");
    } catch (e) {
      // Ignorar erro ao remover do sessionStorage
    }
    
    try {
      document.cookie = "x-workspace-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (e) {
      // Ignorar erro ao remover cookie
    }
  }
}

/**
 * Tenta obter o workspace do técnico através de métodos alternativos
 * Útil quando o técnico não tem organizações vinculadas
 */
async function getTecnicoWorkspace(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  
  try {
    // Método 1: Tentar endpoint especial (se existir)
    // Nota: Este endpoint pode não existir, mas tentamos primeiro
    try {
      const workspaceRes = await fetch("/api/proxy/tecnico/workspace", {
        credentials: "include",
        cache: "no-store",
      });
      
      if (workspaceRes.ok) {
        const workspaceData = await workspaceRes.json();
        if (workspaceData?.workspaceId || workspaceData?.organizationId) {
          const workspaceId = workspaceData.workspaceId || workspaceData.organizationId;
          return workspaceId;
        }
      }
    } catch (e) {
      // Endpoint especial não disponível ou erro
    }
    
    // Método 2: Tentar fazer requisição ao /tecnico/me sem workspace
    // O backend pode retornar o workspace necessário no próprio técnico
    try {
      const tecnicoRes = await fetch("/api/proxy/tecnico/me", {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          // Não enviar x-workspace-id para ver se o backend retorna o workspace necessário
        },
      });
      
      if (tecnicoRes.ok) {
        const tecnicoData = await tecnicoRes.json();
        // Verificar se o técnico tem campo de workspace
        if (tecnicoData?.workspaceId) {
          return tecnicoData.workspaceId;
        }
        if (tecnicoData?.organizationId) {
          return tecnicoData.organizationId;
        }
        // Verificar se há workspace em algum campo relacionado
        if (tecnicoData?.workspace?.id) {
          return tecnicoData.workspace.id;
        }
      } else if (tecnicoRes.status === 400) {
        // Se der erro 400, pode ser que o backend retorne o workspace necessário na mensagem de erro
        try {
          const errorData = await tecnicoRes.json();
          if (errorData?.requiredWorkspaceId || errorData?.workspaceId) {
            const workspaceId = errorData.requiredWorkspaceId || errorData.workspaceId;
            return workspaceId;
          }
        } catch {
          // Ignorar erro ao parsear JSON
        }
      }
    } catch (e) {
      // Ignorar erro ao tentar obter workspace do técnico
    }
    
    // Método 3: Tentar obter através do userId da sessão
    try {
      const { authClient } = await import("@/lib/auth");
      const sessionResult = await authClient.getSession();
      
      if (sessionResult.data) {
        const userId = sessionResult.data.user?.id;
        
        if (userId) {
          // Tentar endpoint que retorna workspace através do userId
          // Nota: Este endpoint pode não existir
          try {
            const userWorkspaceRes = await fetch(`/api/proxy/users/${userId}/workspace`, {
              credentials: "include",
              cache: "no-store",
            });
            
            if (userWorkspaceRes.ok) {
              const workspaceData = await userWorkspaceRes.json();
              if (workspaceData?.workspaceId || workspaceData?.organizationId) {
                const workspaceId = workspaceData.workspaceId || workspaceData.organizationId;
                return workspaceId;
              }
            }
          } catch {
            // Endpoint não existe ou erro
          }
        }
      }
    } catch (e) {
      // Ignorar erro ao tentar obter workspace através do userId
    }
    
    return null;
  } catch (e) {
    return null;
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
  
  // Sempre tentar obter o workspace ID do storage primeiro
  let workspaceId = getWorkspaceId();
  
  // Para requisições de técnico, SEMPRE buscar da sessão se não tiver workspace
  // Isso é crítico no mobile onde storage pode não funcionar
  const isTecnicoRequest = endpoint.includes('/tecnico/');
  const shouldFetchFromSession = !workspaceId || isTecnicoRequest;
  
  if (shouldFetchFromSession && typeof window !== "undefined") {
    try {
      // Fazer requisição síncrona para buscar workspace antes de continuar
      const { authClient } = await import("@/lib/auth");
      const sessionResult = await authClient.getSession();
      
      if (sessionResult.data) {
        if (sessionResult.data.session?.activeOrganizationId) {
          workspaceId = sessionResult.data.session.activeOrganizationId;
          // Definir imediatamente para próximas requisições
          setWorkspaceId(workspaceId);
        } else {
          // Tentar buscar organizações se não houver workspace ativo
          try {
            const orgsResult = await authClient.organization.list();
            const orgsData = orgsResult.data 
              ? (Array.isArray(orgsResult.data) ? orgsResult.data : [])
              : [];
            
            if (orgsData.length > 0) {
              const firstOrg = orgsData[0];
              // Definir como ativa
              await authClient.organization.setActive({
                organizationId: firstOrg.id,
              });
              workspaceId = firstOrg.id;
              setWorkspaceId(workspaceId);
            } else {
              // Se for uma requisição de técnico e não houver organizações,
              // tentar obter o workspace através do próprio técnico
              if (isTecnicoRequest) {
                try {
                  const tecnicoWorkspaceId = await getTecnicoWorkspace();
                  if (tecnicoWorkspaceId) {
                    workspaceId = tecnicoWorkspaceId;
                    setWorkspaceId(workspaceId);
                  }
                } catch (tecnicoWorkspaceError) {
                  // Ignorar erro ao obter workspace do técnico
                }
              }
            }
          } catch (orgError) {
            // Se for requisição de técnico, tentar obter workspace do técnico
            if (isTecnicoRequest) {
              try {
                const tecnicoWorkspaceId = await getTecnicoWorkspace();
                if (tecnicoWorkspaceId) {
                  workspaceId = tecnicoWorkspaceId;
                  setWorkspaceId(workspaceId);
                }
              } catch {
                // Ignorar erro
              }
            }
          }
        }
      } else {
        // Se for requisição de técnico, tentar obter workspace do técnico
        if (isTecnicoRequest) {
          try {
            const tecnicoWorkspaceId = await getTecnicoWorkspace();
            if (tecnicoWorkspaceId) {
              workspaceId = tecnicoWorkspaceId;
              setWorkspaceId(workspaceId);
            }
          } catch {
            // Ignorar erro
          }
        }
      }
    } catch (e) {
      // Se for requisição de técnico, tentar obter workspace do técnico
      if (isTecnicoRequest) {
        try {
          const tecnicoWorkspaceId = await getTecnicoWorkspace();
          if (tecnicoWorkspaceId) {
            workspaceId = tecnicoWorkspaceId;
            setWorkspaceId(workspaceId);
          }
        } catch {
          // Ignorar erro
        }
      }
    }
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
  
  // CRÍTICO: Verificar novamente o workspace antes de adicionar ao header
  // Pode ter sido atualizado durante a busca da sessão
  const finalWorkspaceId = workspaceId || getWorkspaceId() || workspaceIdCache;
  
  // SEMPRE enviar workspace no header se disponível (mais confiável que cookie no mobile)
  // Isso sobrescreve qualquer valor anterior para garantir que o workspace correto seja enviado
  if (finalWorkspaceId) {
    baseHeaders["x-workspace-id"] = finalWorkspaceId;
  }
  
  const headers = baseHeaders;

  try {
    // VERIFICAÇÃO FINAL: Garantir que o workspace esteja no header antes de enviar
    const headerWorkspaceId = headers["x-workspace-id"] || finalWorkspaceId || getWorkspaceId() || workspaceIdCache;
    
    // Se ainda não estiver no header, adicionar agora
    if (headerWorkspaceId && !headers["x-workspace-id"]) {
      headers["x-workspace-id"] = headerWorkspaceId;
    }
    
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
              // Se for requisição de técnico, tentar obter workspace do técnico primeiro
              if (endpoint.includes('/tecnico/')) {
                try {
                  const tecnicoWorkspaceId = await getTecnicoWorkspace();
                  if (tecnicoWorkspaceId) {
                    setWorkspaceId(tecnicoWorkspaceId);
                    // Fazer retry automático da requisição original
                    return fetchAPI<T>(endpoint, options);
                  }
                } catch (e) {
                  // Ignorar erro ao obter workspace do técnico após erro 400
                }
              }
              
              // Tentar buscar da sessão novamente
              const { authClient } = await import("@/lib/auth");
              const sessionResult = await authClient.getSession();
              
              if (sessionResult.data) {
                if (sessionResult.data.session?.activeOrganizationId) {
                  const newWorkspaceId = sessionResult.data.session.activeOrganizationId;
                  setWorkspaceId(newWorkspaceId);
                  // Fazer retry automático da requisição original
                  return fetchAPI<T>(endpoint, options);
                } else {
                  // Se for requisição de técnico e não houver workspace, tentar buscar organizações novamente
                  if (endpoint.includes('/tecnico/')) {
                    try {
                      const { authClient } = await import("@/lib/auth");
                      const orgsResult = await authClient.organization.list();
                      const orgsData = orgsResult.data 
                        ? (Array.isArray(orgsResult.data) ? orgsResult.data : [])
                        : [];
                      
                      if (orgsData.length > 0) {
                        const firstOrg = orgsData[0];
                        await authClient.organization.setActive({
                          organizationId: firstOrg.id,
                        });
                        const newWorkspaceId = firstOrg.id;
                        setWorkspaceId(newWorkspaceId);
                        // Fazer retry automático da requisição original
                        return fetchAPI<T>(endpoint, options);
                      }
                    } catch (e) {
                      // Ignorar erro ao buscar organizações após erro 400
                    }
                  }
                }
              }
            } catch (e) {
              // Ignorar erro ao recuperar workspace após erro 400
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
