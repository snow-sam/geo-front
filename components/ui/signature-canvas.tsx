"use client";

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SignatureCanvasRef {
  clear: () => void;
  isEmpty: () => boolean;
  getDataURL: () => string;
}

interface SignatureCanvasProps {
  onChange?: (dataURL: string) => void;
  className?: string;
  width?: number;
  height?: number;
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ onChange, className, width = 400, height = 200 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onChange?.("");
      },
      isEmpty: () => !hasSignature,
      getDataURL: () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasSignature) return "";
        return canvas.toDataURL("image/png");
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Configurações do canvas
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }, []);

    const getCoordinates = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const startDrawing = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      const { x, y } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    };

    const draw = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    };

    const stopDrawing = () => {
      if (isDrawing && hasSignature) {
        const canvas = canvasRef.current;
        if (canvas) {
          onChange?.(canvas.toDataURL("image/png"));
        }
      }
      setIsDrawing(false);
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onChange?.("");
    };

    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full border-2 border-dashed border-slate-600 rounded-lg bg-white cursor-crosshair touch-none"
            style={{ aspectRatio: `${width}/${height}` }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-slate-400 text-sm">Assine aqui</p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <Eraser className="mr-2 h-4 w-4" />
          Limpar Assinatura
        </Button>
      </div>
    );
  }
);

SignatureCanvas.displayName = "SignatureCanvas";







