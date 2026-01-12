"use client";

import { useState, useEffect } from "react";
import { Search, User, Loader2 } from "lucide-react";
import { getTecnicos } from "@/lib/api";
import type { Tecnico } from "@/types/tecnico";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TecnicoSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTecnicoId: string;
  onSelect: (tecnicoId: string) => void;
}

export function TecnicoSelectDialog({
  open,
  onOpenChange,
  currentTecnicoId,
  onSelect,
}: TecnicoSelectDialogProps) {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTecnicos();
      setSelectedTecnicoId(null);
      setSearchTerm("");
    }
  }, [open]);

  const loadTecnicos = async () => {
    setIsLoading(true);
    try {
      const response = await getTecnicos({ limit: 100 });
      setTecnicos(response.data);
    } catch (error) {
      console.error("Erro ao carregar técnicos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTecnicos = tecnicos.filter((tecnico) =>
    tecnico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tecnico.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tecnico.especialidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedTecnicoId) {
      onSelect(selectedTecnicoId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Técnico</DialogTitle>
          <DialogDescription>
            Selecione um novo técnico para esta visita
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Técnicos */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Carregando técnicos...</span>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredTecnicos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum técnico encontrado
                  </div>
                ) : (
                  filteredTecnicos.map((tecnico) => (
                    <div
                      key={tecnico.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedTecnicoId === tecnico.id
                          ? "bg-primary/10 border-primary"
                          : tecnico.id === currentTecnicoId
                          ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent"
                      }`}
                      onClick={() => setSelectedTecnicoId(tecnico.id)}
                    >
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {tecnico.nome}
                          {tecnico.id === currentTecnicoId && (
                            <span className="ml-2 text-xs text-gray-500">(atual)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {tecnico.especialidade || tecnico.email}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedTecnicoId || selectedTecnicoId === currentTecnicoId}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}








