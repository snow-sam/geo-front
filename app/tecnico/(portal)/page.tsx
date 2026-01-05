"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Route, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { getTecnicoMe, getTecnicoRoteiros } from "@/lib/api";
import { RoteiroView } from "@/components/tecnico-portal/roteiro-view";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // Buscar técnico e roteiros em paralelo usando endpoints dedicados
        // O filtro por tecnicoId é automático (pela sessão)
        const [tecnicoData, roteirosData] = await Promise.all([
          getTecnicoMe(),
          getTecnicoRoteiros(),
        ]);

        setTecnico(tecnicoData);
        setRoteiros(roteirosData);
        
      } catch (err) {
        console.error("[Portal Técnico] Erro ao carregar dados:", err);
        setError("Seu usuário não está vinculado a um técnico. Contate o administrador.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-red-900/20 border-red-500/50 max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
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

