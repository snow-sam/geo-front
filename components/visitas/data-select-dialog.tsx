"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DataSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: string;
  onSelect: (newDate: string) => void;
}

export function DataSelectDialog({
  open,
  onOpenChange,
  currentDate,
  onSelect,
}: DataSelectDialogProps) {
  // Extrai a data no formato YYYY-MM-DD
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(formatDateForInput(currentDate));

  const handleConfirm = () => {
    if (selectedDate) {
      // Converte para ISO string mantendo a data selecionada
      const isoDate = new Date(selectedDate + "T12:00:00").toISOString();
      onSelect(isoDate);
      onOpenChange(false);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Alterar Data da Visita
          </DialogTitle>
          <DialogDescription>
            Selecione uma nova data para esta visita
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Nova Data</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>

          {selectedDate && (
            <p className="text-sm text-muted-foreground">
              {formatDisplayDate(selectedDate)}
            </p>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || selectedDate === formatDateForInput(currentDate)}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


