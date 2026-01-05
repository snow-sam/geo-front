"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { authClient } from "@/lib/auth";
import { useWorkspace } from "@/components/organization/workspace-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { Organization } from "@/types/organization";

export function OrgSelector() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { updateWorkspaceId } = useWorkspace();

  useEffect(() => {
    setMounted(true);
    loadOrganizations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const orgsResult = await authClient.organization.list();
      
      // Handle both array and object with organizations property
      const orgsData = orgsResult.data 
        ? (Array.isArray(orgsResult.data) 
            ? orgsResult.data 
            : (orgsResult.data as unknown as Organization[]))
        : [];
      
      setOrganizations(orgsData);

      // Get active organization from session
      const session = await authClient.getSession();
      if (session.data?.session?.activeOrganizationId) {
        const activeOrgId = session.data.session.activeOrganizationId;
        const active = orgsData.find((org: Organization) => org.id === activeOrgId);
        if (active) {
          setActiveOrg(active);
          updateWorkspaceId(activeOrgId); // Sync cookie with active org
        } else if (orgsData.length > 0) {
          // Active org not found in list, set first one
          const firstOrg = orgsData[0];
          await authClient.organization.setActive({ organizationId: firstOrg.id });
          setActiveOrg(firstOrg);
          updateWorkspaceId(firstOrg.id);
        }
      } else if (orgsData.length > 0) {
        // No active org in session, set first one
        const firstOrg = orgsData[0];
        await authClient.organization.setActive({ organizationId: firstOrg.id });
        setActiveOrg(firstOrg);
        updateWorkspaceId(firstOrg.id);
        console.log("[OrgSelector] First org set as active:", firstOrg.id);
      }
    } catch (error) {
      console.error("Erro ao carregar organizações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgChange = async (orgId: string) => {
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      const org = organizations.find((o) => o.id === orgId);
      if (org) {
        setActiveOrg(org);
      }
      updateWorkspaceId(orgId); // Update context, cookie and localStorage
      router.refresh();
    } catch (error) {
      console.error("Erro ao trocar organização:", error);
    }
  };

  // Prevent hydration mismatch by showing consistent skeleton on server and initial client render
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center gap-2 px-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={() => router.push("/organizacao?criar=true")}
      >
        <Plus className="h-4 w-4" />
        Criar Organização
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {activeOrg?.name || "Selecionar"}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Organizações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrgChange(org.id)}
            className="cursor-pointer"
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">{org.name}</span>
            {activeOrg?.id === org.id && (
              <Check className="ml-2 h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/organizacao")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Gerenciar Organização
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/organizacao?criar=true")}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar Nova
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

