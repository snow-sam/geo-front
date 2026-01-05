export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected' | 'canceled';
  expiresAt: string;
  inviterId: string;
}

export type OrganizationRole = 'owner' | 'admin' | 'member';

export const roleLabels: Record<OrganizationRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
};

export const roleColors: Record<OrganizationRole, string> = {
  owner: 'bg-amber-500',
  admin: 'bg-blue-500',
  member: 'bg-gray-500',
};

