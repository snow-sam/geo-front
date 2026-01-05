"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { importClientesExcel } from "@/lib/api";
import type { Cliente } from "@/types/cliente";

interface ClienteImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (clientes: Cliente[]) => void;
}

type ImportStatus = "idle" | "uploading" | "success" | "error";

export function ClienteImport({
  open,
  onOpenChange,
  onImportSuccess,
}: ClienteImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setError(null);
    setImportedCount(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const validateFile = useCallback((file: File): boolean => {
    const validExtensions = [".xlsx", ".xls"];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setError("Arquivo inválido. Envie um arquivo Excel (.xlsx ou .xls)");
      return false;
    }

    // Limite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo permitido: 10MB");
      return false;
    }

    return true;
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setError(null);
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    },
    [validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setStatus("uploading");
    setError(null);

    try {
      const clientes = await importClientesExcel(file);
      setImportedCount(clientes.length);
      setStatus("success");
      onImportSuccess(clientes);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao importar clientes. Tente novamente."
      );
    }
  }, [file, onImportSuccess]);

  const isUploading = status === "uploading";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel (.xlsx) com os dados dos clientes.
            O sistema irá buscar automaticamente as coordenadas de cada
            endereço.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Status de sucesso */}
          {status === "success" && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Importação concluída!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {importedCount} cliente(s) importado(s) com sucesso.
                </p>
              </div>
            </div>
          )}

          {/* Área de upload */}
          {status !== "success" && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInputChange}
                className="hidden"
                disabled={isUploading}
              />

              {file ? (
                <div className="flex items-center gap-3 p-4 rounded-lg border border-input bg-background">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {!isUploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  onClick={handleClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-input bg-background p-4 text-center transition-colors hover:border-primary/50 hover:bg-muted/50",
                    isDragging && "border-primary bg-primary/5",
                    error && "border-destructive"
                  )}
                >
                  <Upload
                    className={cn(
                      "h-10 w-10 text-muted-foreground",
                      isDragging && "text-primary"
                    )}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Arraste o arquivo ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Arquivo Excel (.xlsx ou .xls) • Máximo 10MB
                    </p>
                  </div>
                </div>
              )}

              {/* Mensagem de erro */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Informações sobre formato */}
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium mb-2">Colunas esperadas no Excel:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    • <strong>nome</strong> (obrigatório)
                  </li>
                  <li>
                    • <strong>endereco</strong> (obrigatório)
                  </li>
                  <li>• telefone, email, descricao, ultimaVisita (opcionais)</li>
                </ul>
              </div>
            </>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              {status === "success" ? "Fechar" : "Cancelar"}
            </Button>
            {status !== "success" && (
              <Button
                type="button"
                onClick={handleImport}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
