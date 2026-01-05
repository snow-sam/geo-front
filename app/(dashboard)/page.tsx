"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, type DashboardStats } from "@/lib/api";
import { Users, UserCheck, Calendar, AlertCircle, Loader2 } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
        setError("Erro ao carregar estatísticas do dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statsCards = [
    {
      title: "Total de Clientes",
      value: stats?.totalClientes ?? 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Técnicos Ativos",
      value: stats?.tecnicosAtivos ?? 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Visitas Agendadas",
      value: stats?.visitasAgendadas ?? 0,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Chamados Abertos",
      value: stats?.chamadosAbertos ?? 0,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema de gestão RotGo
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                {card.title}
              </h3>
              <div className={`rounded-full p-2 ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            {loading ? (
              <div className="mt-2 flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : (
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
