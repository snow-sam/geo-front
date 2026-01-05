"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { Upload, X, FileImage, FileVideo, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  value?: string;
  onChange: (base64: string) => void;
  accept?: string;
  maxSize?: number; // em MB
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  maxWidth?: number; // largura máxima para compressão de imagem
  quality?: number; // qualidade da compressão (0-1)
}

/**
 * Comprime uma imagem usando Canvas
 */
async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Redimensionar se necessário
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Erro ao criar contexto do canvas"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Converter para JPEG com compressão
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

export function FileUpload({
  value,
  onChange,
  accept = "image/*",
  maxSize = 5, // 5MB padrão
  disabled = false,
  className,
  placeholder = "Arraste um arquivo ou clique para selecionar",
  maxWidth = 1200,
  quality = 0.7,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<{ type: "image" | "video"; url: string } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Determina se o valor atual é uma imagem ou vídeo baseado no Base64
  React.useEffect(() => {
    if (value) {
      if (value.startsWith("data:image")) {
        setPreview({ type: "image", url: value });
      } else if (value.startsWith("data:video")) {
        setPreview({ type: "video", url: value });
      }
    } else {
      setPreview(null);
    }
  }, [value]);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsProcessing(true);

      try {
        // Validar tamanho original
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
          setError(`Arquivo muito grande. Máximo permitido: ${maxSize}MB`);
          setIsProcessing(false);
          return;
        }

        // Validar tipo
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          setError("Tipo de arquivo não suportado. Envie uma imagem ou vídeo.");
          setIsProcessing(false);
          return;
        }

        if (isImage) {
          // Comprimir imagem
          try {
            const compressedBase64 = await compressImage(file, maxWidth, quality);
            onChange(compressedBase64);
          } catch {
            // Se falhar a compressão, usa o arquivo original
            const reader = new FileReader();
            reader.onloadend = () => {
              onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        } else if (isVideo) {
          // Para vídeos, verificar se não é muito grande
          if (fileSizeMB > 2) {
            setError("Vídeos devem ter no máximo 2MB. Considere enviar uma foto.");
            setIsProcessing(false);
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            onChange(reader.result as string);
          };
          reader.onerror = () => {
            setError("Erro ao processar o arquivo. Tente novamente.");
          };
          reader.readAsDataURL(file);
        }
      } catch {
        setError("Erro ao processar o arquivo. Tente novamente.");
      } finally {
        setIsProcessing(false);
      }
    },
    [maxSize, maxWidth, quality, onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  }, [disabled, isProcessing]);

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

      if (disabled || isProcessing) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [disabled, isProcessing, processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing) {
      inputRef.current?.click();
    }
  }, [disabled, isProcessing]);

  const handleRemove = useCallback(() => {
    onChange("");
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onChange]);

  const isDisabled = disabled || isProcessing;

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />

      {preview ? (
        <div className="relative rounded-lg border border-input bg-background p-2">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
            disabled={isDisabled}
          >
            <X className="h-3 w-3" />
          </Button>

          {preview.type === "image" ? (
            <div className="flex items-center gap-3">
              <img
                src={preview.url}
                alt="Preview"
                className="h-20 w-20 rounded-md object-cover"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileImage className="h-4 w-4" />
                <span>Imagem carregada</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <video
                src={preview.url}
                className="h-20 w-20 rounded-md object-cover"
                muted
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileVideo className="h-4 w-4" />
                <span>Vídeo carregado</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-background p-4 text-center transition-colors hover:border-primary/50 hover:bg-muted/50",
            isDragging && "border-primary bg-primary/5",
            isDisabled && "cursor-not-allowed opacity-50",
            error && "border-destructive"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processando imagem...</p>
            </>
          ) : (
            <>
              <Upload className={cn("h-8 w-8 text-muted-foreground", isDragging && "text-primary")} />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{placeholder}</p>
                <p className="text-xs text-muted-foreground">
                  Máximo {maxSize}MB • Imagens são comprimidas automaticamente
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
