"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  User,
  Calendar,
  Navigation,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { RoteiroMap } from "@/components/tecnico-portal/roteiro-map";
import { getRoteiro } from "@/lib/api";
import type { Roteiro } from "@/types/roteiro";

interface RoteiroDetailDialogProps {
  roteiroId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoteiroDetailDialog({
  roteiroId,
  open,
  onOpenChange,
}: RoteiroDetailDialogProps) {
  const [roteiro, setRoteiro] = useState<Roteiro | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoteiro() {
      if (!roteiroId || !open) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await getRoteiro(roteiroId);
        setRoteiro(data);
      } catch (err) {
        console.error("Erro ao carregar roteiro:", err);
        setError("Erro ao carregar os detalhes do roteiro");
      } finally {
        setIsLoading(false);
      }
    }

    loadRoteiro();
  }, [roteiroId, open]);

  const formatDate = (dateString: string) => {
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
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

  const openInMaps = (endereco?: string) => {
    if (!endereco) return;
    const encodedAddress = encodeURIComponent(endereco);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank"
    );
  };

  const tecnicoNome = roteiro && typeof roteiro.tecnico === 'object' && roteiro.tecnico 
    ? roteiro.tecnico.nome 
    : roteiro?.tecnicoNome || "Técnico não definido";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Navigation className="h-6 w-6 text-primary" />
            Detalhes do Roteiro
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12 text-red-500">
            {error}
          </div>
        )}

        {roteiro && !isLoading && (
          <div className="space-y-6">
            {/* Cabeçalho com informações do técnico e data */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{tecnicoNome}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(roteiro.data)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge variant="secondary" className="text-sm py-1 px-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  {roteiro.visitas?.length || 0} paradas
                </Badge>
                <Badge variant="secondary" className="text-sm py-1 px-3">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(roteiro.tempoEstimado)}
                </Badge>
                {roteiro.distanciaTotal && (
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    <Navigation className="h-4 w-4 mr-1" />
                    {roteiro.distanciaTotal.toFixed(1)} km
                  </Badge>
                )}
              </div>
            </div>

            {/* Grid com Mapa e Lista de Paradas */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Mapa */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Navigation className="h-5 w-5 text-primary" />
                    Mapa da Rota
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[400px] lg:h-[450px]">
                    <RoteiroMap roteiro={roteiro} />
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Paradas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-primary" />
                    Lista de Paradas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] lg:max-h-[420px] overflow-y-auto pr-2">
                    {roteiro.visitas
                      ?.sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                      .map((visita) => (
                        <div
                          key={visita.id}
                          className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {visita.ordem || "-"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {visita.cliente?.nome || "Cliente não encontrado"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {visita.cliente?.endereco}
                            </p>
                            
                            {/* Informações de contato */}
                            {(visita.cliente?.telefone || visita.cliente?.email) && (
                              <div className="flex items-center gap-4 mt-2">
                                {visita.cliente?.telefone && (
                                  <a
                                    href={`tel:${visita.cliente.telefone}`}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Phone className="h-3 w-3" />
                                    {visita.cliente.telefone}
                                  </a>
                                )}
                                {visita.cliente?.email && (
                                  <a
                                    href={`mailto:${visita.cliente.email}`}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]">
                                      {visita.cliente.email}
                                    </span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => openInMaps(visita.cliente?.endereco)}
                            title="Abrir no Google Maps"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
