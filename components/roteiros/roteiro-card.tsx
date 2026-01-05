"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, User, Calendar, Navigation, Clock, Eye } from "lucide-react";
import type { Roteiro } from "@/types/roteiro";
import { Separator } from "@/components/ui/separator";

interface RoteiroCardProps {
  roteiro: Roteiro;
  onView?: (id: string) => void;
}

export function RoteiroCard({ roteiro, onView }: RoteiroCardProps) {
  const formatDate = (dateString: string) => {
    // Extrai apenas a parte da data (YYYY-MM-DD) para evitar problemas de timezone
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    // Cria a data usando o horário local (meio-dia para evitar problemas)
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (minutes?: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const tecnicoNome = typeof roteiro.tecnico === 'object' && roteiro.tecnico 
    ? roteiro.tecnico.nome 
    : roteiro.tecnicoNome || "Técnico não definido";
  console.log("roteiro", roteiro);
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {tecnicoNome}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              {formatDate(roteiro.data)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações do roteiro */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Paradas</p>
              <p className="font-semibold">{roteiro.visitas?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tempo Est.</p>
              <p className="font-semibold">{formatTime(roteiro.tempoEstimado)}</p>
            </div>
          </div>
        </div>

        {roteiro.distanciaTotal && (
          <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
            <Navigation className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Distância Total</p>
              <p className="font-semibold">{roteiro.distanciaTotal.toFixed(1)} km</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Lista de visitas */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
            Clientes no Roteiro
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {[...(roteiro.visitas || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((visita) => (
              <div
                key={visita.id}
                className="flex items-start gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                  {visita.ordem || "-"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{visita.cliente?.nome || "Cliente não encontrado"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {visita.cliente?.endereco}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView?.(roteiro.id)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
