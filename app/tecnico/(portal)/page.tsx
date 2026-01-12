"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Route, Calendar, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { getTecnicoMe, getTecnicoRoteiros, setWorkspaceId } from "@/lib/api";
import { organizationClient } from "@/lib/organization-client";
import { RoteiroView } from "@/components/tecnico-portal/roteiro-view";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Roteiro } from "@/types/roteiro";
import type { Tecnico } from "@/types/tecnico";

// Função para obter a data atual formatada
const getTodayDate = () => {
  const now = new Date();
  const brasiliaDate = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  return brasiliaDate.toISOString().split("T")[0];
};

// Função para verificar se é hoje
const isToday = (dateString: string) => {
  const today = getTodayDate();
  const roteiroDate = new Date(dateString).toISOString().split("T")[0];
  return roteiroDate === today;
};

export default function TecnicoPortalPage() {
  const router = useRouter();
  const [roteiros, setRoteiros] = useState<Roteiro[]>([]);
  const [tecnico, setTecnico] = useState<Tecnico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Garantir que o workspace ID está definido antes de fazer requisições
      // Verificar se já existe no localStorage ou cookie
      const getWorkspaceId = (): string | null => {
        if (typeof window === "undefined") return null;
        const fromStorage = localStorage.getItem("activeWorkspaceId");
        if (fromStorage) return fromStorage;
        const cookieMatch = document.cookie.match(/x-workspace-id=([^;]+)/);
        return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
      };

      let workspaceId = getWorkspaceId();
      
      // Se não houver workspace, tentar buscar da sessão
      if (!workspaceId) {
        try {
          const sessionRes = await fetch("/api/auth/session", { 
            credentials: "include" 
          });
          const sessionData = await sessionRes.json();
          
          if (sessionData?.session?.activeOrganizationId) {
            workspaceId = sessionData.session.activeOrganizationId;
            setWorkspaceId(workspaceId);
          } else {
            // Tentar buscar a primeira organização
            const orgsResult = await organizationClient.list();
            const orgsData = orgsResult.data 
              ? (Array.isArray(orgsResult.data) ? orgsResult.data : [])
              : [];
            
            if (orgsData.length > 0) {
              const firstOrg = orgsData[0];
              await organizationClient.setActive({ organizationId: firstOrg.id });
              workspaceId = firstOrg.id;
              setWorkspaceId(workspaceId);
            }
          }
        } catch (workspaceError) {
          console.warn("[Portal Técnico] Erro ao definir workspace:", workspaceError);
          // Continuar mesmo se houver erro ao definir workspace
        }
      }

      // Buscar técnico e roteiros em paralelo usando endpoints dedicados
      // O filtro por tecnicoId é automático (pela sessão)
      const [tecnicoData, roteirosData] = await Promise.all([
        getTecnicoMe(),
        getTecnicoRoteiros(),
      ]);

      setTecnico(tecnicoData);
      setRoteiros(roteirosData);
      
    } catch (err: unknown) {
      console.error("[Portal Técnico] Erro ao carregar dados:", err);
      
      // Tratamento de erros mais específico
      let errorMessage = "Erro ao carregar dados. Tente novamente.";
      
      if (err instanceof Error) {
        // Verificar se é erro de autenticação (401/403)
        if (err.message.includes("401") || err.message.includes("403") || err.message.includes("não autorizado")) {
          errorMessage = "Sessão expirada. Por favor, faça login novamente.";
        } 
        // Verificar se é erro de rede
        else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError") || err.message.includes("Erro ao conectar")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        }
        // Verificar se é erro 404 (técnico não encontrado)
        else if (err.message.includes("404") || err.message.includes("não encontrado")) {
          errorMessage = "Seu usuário não está vinculado a um técnico. Contate o administrador.";
        }
        // Verificar se é erro do servidor
        else if (err.message.includes("500") || err.message.includes("servidor")) {
          errorMessage = "Erro no servidor. Tente novamente em alguns instantes.";
        }
        // Usar mensagem do erro se disponível
        else if (err.message && err.message !== "Erro desconhecido") {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Separar roteiro de hoje dos demais
  const { roteiroHoje, outrosRoteiros } = useMemo(() => {
    const hoje = roteiros.find((r) => isToday(r.data));
    const outros = roteiros
      .filter((r) => !isToday(r.data))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return { roteiroHoje: hoje, outrosRoteiros: outros };
  }, [roteiros]);

  const handleViewRoteiro = (id: string) => {
    router.push(`/tecnico/roteiro/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando seus roteiros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isSessionError = error.includes("Sessão expirada") || error.includes("não autorizado");
    
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-red-900/20 border-red-500/50 max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
            {!isSessionError && (
              <Button
                onClick={loadData}
                variant="outline"
                className="mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar novamente
                  </>
                )}
              </Button>
            )}
            {isSessionError && (
              <Button
                onClick={() => router.push("/tecnico/login")}
                variant="outline"
                className="mt-4"
              >
                Ir para login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Route className="h-7 w-7 text-emerald-400" />
            Meus Roteiros
          </h1>
          <p className="text-slate-400 mt-1">
            {tecnico
              ? `Bem-vindo, ${tecnico.nome}`
              : "Visualize seus roteiros de visitas"}
          </p>
        </div>
        <Badge variant="outline" className="border-slate-600 text-slate-300">
          <Calendar className="h-4 w-4 mr-2" />
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </Badge>
      </div>

      {/* Roteiro de Hoje */}
      {roteiroHoje ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Roteiro de Hoje
          </h2>
          <RoteiroView
            roteiro={roteiroHoje}
            isToday={true}
            onView={handleViewRoteiro}
          />
        </div>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-8 text-center">
            <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum roteiro programado para hoje</p>
          </CardContent>
        </Card>
      )}

      {/* Outros Roteiros */}
      {outrosRoteiros.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-300">
            Histórico de Roteiros
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {outrosRoteiros.map((roteiro) => (
              <RoteiroView
                key={roteiro.id}
                roteiro={roteiro}
                onView={handleViewRoteiro}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {roteiros.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <Route className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum roteiro encontrado
            </h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Você ainda não possui roteiros atribuídos. Quando um roteiro for
              criado para você, ele aparecerá aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

