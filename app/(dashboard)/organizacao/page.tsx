"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, Users, UserPlus, Settings, Loader2, Plus } from "lucide-react";
import { authClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrgDetails } from "@/components/organization/org-details";
import { MembersList } from "@/components/organization/members-list";
import { InviteForm } from "@/components/organization/invite-form";
import type { Organization, OrganizationMember, Invitation, OrganizationRole } from "@/types/organization";

export default function OrganizacaoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <OrganizacaoContent />
    </Suspense>
  );
}

function OrganizacaoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showCreateModal = searchParams.get("criar") === "true";

  const [isLoading, setIsLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<OrganizationRole>("member");

  // Create org modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(showCreateModal);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      setIsCreateModalOpen(true);
    }
  }, [showCreateModal]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get session and user info
      const sessionResult = await authClient.getSession();
      if (sessionResult.data?.user) {
        setCurrentUserId(sessionResult.data.user.id);
      }

      // Get active organization
      const activeOrgId = sessionResult.data?.session?.activeOrganizationId;
      if (!activeOrgId) {
        // No active org, show create modal
        setIsLoading(false);
        return;
      }

      // Get organization details
      const orgResult = await authClient.organization.getFullOrganization();
      if (orgResult.data) {
        const orgData = orgResult.data;
        setOrganization({
          id: orgData.id,
          name: orgData.name,
          slug: orgData.slug,
          logo: orgData.logo,
          metadata: orgData.metadata as Record<string, unknown> | undefined,
          createdAt: orgData.createdAt instanceof Date 
            ? orgData.createdAt.toISOString() 
            : String(orgData.createdAt),
        });
        
        // Get members
        const membersResult = await authClient.organization.listMembers();
        if (membersResult.data) {
          // Handle both array and object with members property
          const rawMembers = Array.isArray(membersResult.data) 
            ? membersResult.data 
            : (membersResult.data as { members?: unknown[] }).members || [];
          
          // Convert Date to string for createdAt
          const membersData: OrganizationMember[] = rawMembers.map((m: unknown) => {
            const member = m as { 
              id: string; 
              organizationId: string; 
              userId: string; 
              role: string; 
              createdAt: Date | string; 
              user: { id: string; name: string; email: string; image?: string | null } 
            };
            return {
              ...member,
              role: member.role as OrganizationMember["role"],
              createdAt: member.createdAt instanceof Date 
                ? member.createdAt.toISOString() 
                : String(member.createdAt),
            };
          });
          
          setMembers(membersData);
          
          // Find current user's role
          const currentMember = membersData.find(
            (m) => m.userId === sessionResult.data?.user?.id
          );
          if (currentMember) {
            setCurrentUserRole(currentMember.role as OrganizationRole);
          }
        }

        // Get invitations
        try {
          const invitationsResult = await authClient.organization.listInvitations();
          if (invitationsResult.data) {
            const invitationsData: Invitation[] = invitationsResult.data.map((inv) => ({
              id: inv.id,
              organizationId: inv.organizationId,
              email: inv.email,
              role: inv.role as Invitation["role"],
              status: inv.status as Invitation["status"],
              inviterId: inv.inviterId,
              expiresAt: inv.expiresAt instanceof Date 
                ? inv.expiresAt.toISOString() 
                : String(inv.expiresAt),
            }));
            setInvitations(invitationsData);
          }
        } catch {
          // Invitations might not be available
          console.log("Could not load invitations");
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados da organização:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      setCreateError("Nome é obrigatório");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const slug = newOrgSlug.trim() || newOrgName.toLowerCase().replace(/\s+/g, "-");
      
      const result = await authClient.organization.create({
        name: newOrgName,
        slug,
      });

      if (result.error) {
        setCreateError(result.error.message || "Erro ao criar organização");
        return;
      }

      // Set as active
      if (result.data?.id) {
        await authClient.organization.setActive({
          organizationId: result.data.id,
        });
      }

      setIsCreateModalOpen(false);
      setNewOrgName("");
      setNewOrgSlug("");
      router.replace("/organizacao");
      loadData();
    } catch {
      setCreateError("Erro ao conectar com o servidor");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    router.replace("/organizacao");
  };

  const canEdit = currentUserRole === "owner" || currentUserRole === "admin";
  const canInvite = currentUserRole === "owner" || currentUserRole === "admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organização</h1>
          <p className="text-muted-foreground">
            Gerencie sua organização e membros
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma organização</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Você ainda não faz parte de nenhuma organização. Crie uma nova
              organização para começar.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Organização
            </Button>
          </CardContent>
        </Card>

        {/* Create Organization Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={handleCloseCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Organização</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar sua organização
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {createError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {createError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="org-name">Nome da Organização</Label>
                <Input
                  id="org-name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Minha Empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-slug">
                  Slug <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="org-slug"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  placeholder="minha-empresa"
                />
                <p className="text-xs text-muted-foreground">
                  Se não informado, será gerado automaticamente a partir do nome
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCloseCreateModal}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateOrg} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organização</h1>
        <p className="text-muted-foreground">
          Gerencie sua organização, membros e permissões
        </p>
      </div>

      <Tabs defaultValue="detalhes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="detalhes" className="gap-2">
            <Settings className="h-4 w-4" />
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="membros" className="gap-2">
            <Users className="h-4 w-4" />
            Membros
          </TabsTrigger>
          <TabsTrigger value="convites" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Convites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes">
          <OrgDetails
            organization={organization}
            onUpdate={loadData}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="membros">
          <MembersList
            members={members}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onUpdate={loadData}
          />
        </TabsContent>

        <TabsContent value="convites">
          <InviteForm
            invitations={invitations}
            canInvite={canInvite}
            onUpdate={loadData}
          />
        </TabsContent>
      </Tabs>

      {/* Create Organization Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={handleCloseCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Organização</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar sua organização
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {createError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {createError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="org-name-2">Nome da Organização</Label>
              <Input
                id="org-name-2"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Minha Empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug-2">
                Slug <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="org-slug-2"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                placeholder="minha-empresa"
              />
              <p className="text-xs text-muted-foreground">
                Se não informado, será gerado automaticamente a partir do nome
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCloseCreateModal}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateOrg} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

