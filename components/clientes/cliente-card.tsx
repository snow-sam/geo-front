"use client";

import { Mail, Phone, MapPin, Calendar, Edit, Trash2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Cliente } from "@/types/cliente";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface ClienteCardProps {
  cliente: Cliente;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function ClienteCard({ cliente, onDelete, onEdit }: ClienteCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    onDelete(cliente.id);
    setIsDeleteDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-xl">{cliente.nome}</CardTitle>
        <CardDescription className="flex items-start gap-2 mt-2">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{cliente.endereco}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {cliente.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <a
              href={`mailto:${cliente.email}`}
              className="hover:text-primary hover:underline truncate"
            >
              {cliente.email}
            </a>
          </div>
        )}
        {cliente.telefone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <a
              href={`tel:${cliente.telefone}`}
              className="hover:text-primary hover:underline"
            >
              {cliente.telefone}
            </a>
          </div>
        )}
        {cliente.ultimaVisita && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Última visita: {formatDate(cliente.ultimaVisita)}</span>
          </div>
        )}
        {cliente.placeId && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPinned className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-mono truncate" title={cliente.placeId}>
              Google Place ID: {cliente.placeId}
            </span>
          </div>
        )}
        {!cliente.email && !cliente.telefone && !cliente.ultimaVisita && !cliente.placeId && (
          <p className="text-sm text-gray-500 dark:text-gray-500 italic">
            Informações adicionais não cadastradas
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 justify-end mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(cliente.id)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover o cliente{" "}
                <strong>{cliente.nome}</strong>? Esta ação não pode ser
                desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Confirmar Exclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

