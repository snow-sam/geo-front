import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Wrench, MoreVertical, CheckCircle, Clock, Route } from "lucide-react";
import type { Visita } from "@/types/visita";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface VisitaCardProps {
  visita: Visita;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onChangeStatus: (id: string, status: "pendente" | "no_roteiro" | "realizada") => void;
}

export function VisitaCard({ visita, onDelete, onEdit, onChangeStatus }: VisitaCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(date);
  };

  const getStatusBadge = () => {
    switch (visita.status) {
      case "realizada":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="h-3 w-3" />
            Realizada
          </span>
        );
      case "pendente":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        );
      case "no_roteiro":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Route className="h-3 w-3" />
            No Roteiro
          </span>
        );
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1">
            {getStatusBadge()}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ações da Visita</DialogTitle>
                <DialogDescription>
                  Escolha uma ação para esta visita
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => onEdit(visita.id)}
                >
                  Editar Visita
                </Button>
                
                {visita.status !== "realizada" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onChangeStatus(visita.id, "realizada")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Realizada
                  </Button>
                )}
                
                {visita.status !== "no_roteiro" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onChangeStatus(visita.id, "no_roteiro")}
                  >
                    <Route className="mr-2 h-4 w-4" />
                    Marcar como No Roteiro
                  </Button>
                )}
                
                {visita.status !== "pendente" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onChangeStatus(visita.id, "pendente")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Marcar como Pendente
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => onDelete(visita.id)}
                >
                  Excluir Visita
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {visita.clienteNome}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Cliente</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Wrench className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {visita.tecnicoNome}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Técnico</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(visita.dataMarcada)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Data marcada
            </p>
          </div>
        </div>

        {visita.observacoes && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {visita.observacoes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

