"use client";

import { MapPin, Car, Phone, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Tecnico } from "@/types/tecnico";
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

interface TecnicoCardProps {
  tecnico: Tecnico;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function TecnicoCard({ tecnico, onDelete, onEdit }: TecnicoCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    onDelete(tecnico.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-xl">{tecnico.nome}</CardTitle>
        <CardDescription className="flex items-start gap-2 mt-2">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{tecnico.endereco}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Car className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">Placa: {tecnico.placa}</span>
        </div>
        {tecnico.telefone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <a
              href={`tel:${tecnico.telefone}`}
              className="hover:text-primary hover:underline"
            >
              {tecnico.telefone}
            </a>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(tecnico.id)}
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
                Tem certeza que deseja remover o técnico{" "}
                <strong>{tecnico.nome}</strong>? Esta ação não pode ser
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

