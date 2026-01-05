"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Navigation,
  Clock,
  Eye,
  CheckCircle2,
} from "lucide-react";
import type { Roteiro } from "@/types/roteiro";
import { Separator } from "@/components/ui/separator";

interface RoteiroViewProps {
  roteiro: Roteiro;
  isToday?: boolean;
  onView?: (id: string) => void;
}

export function RoteiroView({ roteiro, isToday = false, onView }: RoteiroViewProps) {
  const formatDate = (dateString: string) => {
    // Extrai apenas a parte da data (YYYY-MM-DD) para evitar problemas de timezone
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    // Cria a data usando o horário local (meio-dia para evitar problemas)
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
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

  return (
    <Card
      className={`transition-all duration-200 ${
        isToday
          ? "bg-emerald-900/30 border-emerald-500/50 hover:border-emerald-400"
          : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-400" />
                {formatDate(roteiro.data)}
              </CardTitle>
              {isToday && (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Hoje
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações do roteiro */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-sm bg-slate-800/50 p-3 rounded-lg">
            <MapPin className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-400">Paradas</p>
              <p className="font-semibold text-white">{roteiro.visitas?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm bg-slate-800/50 p-3 rounded-lg">
            <Clock className="h-4 w-4 text-orange-400" />
            <div>
              <p className="text-xs text-slate-400">Tempo Est.</p>
              <p className="font-semibold text-white">{formatTime(roteiro.tempoEstimado)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm bg-slate-800/50 p-3 rounded-lg">
            <Navigation className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-xs text-slate-400">Distância</p>
              <p className="font-semibold text-white">
                {roteiro.distanciaTotal ? `${roteiro.distanciaTotal.toFixed(1)} km` : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Lista de visitas */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Clientes no Roteiro
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {[...(roteiro.visitas || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((visita) => (
              <div
                key={visita.id}
                className="flex items-start gap-3 text-sm p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold">
                  {visita.ordem || "-"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {visita.cliente?.nome || "Cliente não encontrado"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {visita.cliente?.endereco}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-slate-600 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-emerald-600 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300"
            onClick={() => onView?.(roteiro.id)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Rota no Mapa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
