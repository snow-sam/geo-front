// Cliente de organização que usa API routes locais (evita problemas de CORS/cookies cross-domain)

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
}

interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: string;
  inviterId: string;
  expiresAt: string | Date;
}

interface ApiResponse<T> {
  data?: T;
  error?: { message: string };
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || { message: "Erro na requisição" } };
    }

    return { data };
  } catch {
    return { error: { message: "Erro de conexão" } };
  }
}

export const organizationClient = {
  // Listar organizações do usuário
  async list(): Promise<ApiResponse<Organization[]>> {
    return fetchApi<Organization[]>("/api/auth/organization/list");
  },

  // Obter organização ativa completa
  async getFullOrganization(): Promise<ApiResponse<Organization>> {
    return fetchApi<Organization>("/api/auth/organization/full");
  },

  // Listar membros da organização
  async listMembers(): Promise<ApiResponse<OrganizationMember[]>> {
    return fetchApi<OrganizationMember[]>("/api/auth/organization/members");
  },

  // Listar convites pendentes
  async listInvitations(): Promise<ApiResponse<Invitation[]>> {
    return fetchApi<Invitation[]>("/api/auth/organization/invitations");
  },

  // Criar nova organização
  async create(data: {
    name: string;
    slug?: string;
  }): Promise<ApiResponse<Organization>> {
    return fetchApi<Organization>("/api/auth/organization/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Definir organização ativa (DEPRECATED - usar setActiveOrganization)
  async setActive(data: {
    organizationId: string;
  }): Promise<ApiResponse<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>("/api/auth/organization/set-active", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Atualizar organização
  async update(data: {
    name?: string;
    slug?: string;
    logo?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse<Organization>> {
    return fetchApi<Organization>("/api/auth/organization/update", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Convidar membro
  async inviteMember(data: {
    email: string;
    role: string;
  }): Promise<ApiResponse<Invitation>> {
    return fetchApi<Invitation>("/api/auth/organization/invite", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Cancelar convite
  async cancelInvitation(data: {
    invitationId: string;
  }): Promise<ApiResponse<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>(
      "/api/auth/organization/cancel-invitation",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  // Remover membro
  async removeMember(data: {
    memberIdOrEmail: string;
  }): Promise<ApiResponse<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>(
      "/api/auth/organization/remove-member",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  // Atualizar role do membro
  async updateMemberRole(data: {
    memberId: string;
    role: string;
  }): Promise<ApiResponse<{ success: boolean }>> {
    return fetchApi<{ success: boolean }>(
      "/api/auth/organization/update-role",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
};

/**
 * Define a organização ativa usando a rota proxy /api/auth/organization/set-active
 * Esta função deve ser usada sempre que precisar definir ou mudar a organização ativa
 */
export async function setActiveOrganization(data: {
  organizationId: string;
  organizationSlug: string;
}): Promise<{ data?: { success: boolean }; error?: { message: string } }> {
  try {
    const response = await fetch("/api/auth/organization/set-active", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        organizationId: data.organizationId,
        organizationSlug: data.organizationSlug,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      return { error: { message: result.error?.message || "Erro ao definir organização ativa" } };
    }

    return { data: { success: true } };
  } catch (error) {
    return { error: { message: "Erro de conexão ao definir organização ativa" } };
  }
}

