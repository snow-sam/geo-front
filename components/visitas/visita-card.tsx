import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Wrench, MoreVertical, CheckCircle, Clock, Route, UserCog, CalendarDays } from "lucide-react";
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
  onChangeDate: (id: string) => void;
  onChangeStatus: (id: string, status: "pendente" | "no_roteiro" | "realizado") => void;
  onChangeTecnico?: (id: string) => void;
}

export function VisitaCard({ visita, onDelete, onChangeDate, onChangeStatus, onChangeTecnico }: VisitaCardProps) {
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

  const getStatusBadge = () => {
    switch (visita.status) {
      case "realizado":
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
    <Card className="hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div className="flex-shrink-0">
            {getStatusBadge()}
          </div>

          {/* Cliente */}
          <div className="flex items-center gap-2 min-w-[180px]">
            <User className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {visita.cliente?.nome ?? "Cliente não informado"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cliente</p>
            </div>
          </div>

          {/* Técnico */}
          <div className="flex items-center gap-2 min-w-[150px]">
            <Wrench className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {visita.tecnico?.nome ?? "Técnico não informado"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Técnico</p>
            </div>
          </div>

          {/* Data */}
          <div className="flex items-center gap-2 min-w-[120px]">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(visita.dataAgendamento)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Data marcada</p>
            </div>
          </div>

          {/* Observações (se houver) */}
          {visita.observacoes && (
            <div className="flex-1 min-w-0 hidden lg:block">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {visita.observacoes}
              </p>
            </div>
          )}

          {/* Menu de Ações */}
          <div className="flex-shrink-0 ml-auto">
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
                    onClick={() => onChangeDate(visita.id)}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Alterar Data
                  </Button>

                  {onChangeTecnico && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => onChangeTecnico(visita.id)}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Alterar Técnico
                    </Button>
                  )}
                  
                  {visita.status !== "realizado" && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => onChangeStatus(visita.id, "realizado")}
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
        </div>
      </CardContent>
    </Card>
  );
}

