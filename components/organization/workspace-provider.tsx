"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { organizationClient } from "@/lib/organization-client";
import { setWorkspaceId } from "@/lib/api";

interface WorkspaceContextType {
  workspaceId: string | null;
  isLoading: boolean;
  updateWorkspaceId: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaceId: null,
  isLoading: true,
  updateWorkspaceId: () => {},
});

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    syncWorkspace();
  }, []);

  const syncWorkspace = async () => {
    try {
      // Usar API route local para obter sessão (evita problemas de cross-domain)
      const sessionRes = await fetch("/api/auth/session", { credentials: "include" });
      const sessionData = await sessionRes.json();
      const activeOrgId = sessionData?.session?.activeOrganizationId;

      if (activeOrgId) {
        setWorkspaceId(activeOrgId);
        setWorkspaceIdState(activeOrgId);
      } else {
        // Try to get first organization and set it as active
        const orgsResult = await organizationClient.list();
        const orgsData = orgsResult.data
          ? Array.isArray(orgsResult.data)
            ? orgsResult.data
            : []
          : [];

        if (orgsData.length > 0) {
          const firstOrg = orgsData[0];
          await organizationClient.setActive({ organizationId: firstOrg.id });
          setWorkspaceId(firstOrg.id);
          setWorkspaceIdState(firstOrg.id);
        } else {
          console.log("[WorkspaceProvider] No organizations found");
        }
      }
    } catch (error) {
      console.error("Erro ao sincronizar workspace:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkspaceId = useCallback((id: string) => {
    setWorkspaceId(id);
    setWorkspaceIdState(id);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ workspaceId, isLoading, updateWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

