"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DebugConsole() {
  const [logs, setLogs] = useState<Array<{ type: string; message: string; timestamp: string }>>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Apenas em desenvolvimento ou quando necessário
    if (typeof window === "undefined") return;

    // Interceptar console.log, console.error, console.warn
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: string, ...args: unknown[]) => {
      const message = args
        .map(arg => {
          if (typeof arg === "object") {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(" ");

      const timestamp = new Date().toLocaleTimeString("pt-BR");

      setLogs(prev => {
        const newLogs = [...prev, { type, message, timestamp }];
        // Manter apenas os últimos 100 logs
        return newLogs.slice(-100);
      });
    };

    console.log = (...args: unknown[]) => {
      originalLog(...args);
      addLog("log", ...args);
    };

    console.error = (...args: unknown[]) => {
      originalError(...args);
      addLog("error", ...args);
    };

    console.warn = (...args: unknown[]) => {
      originalWarn(...args);
      addLog("warn", ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900 border-t border-slate-700 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">Debug Console</span>
          <span className="text-xs text-slate-400">({logs.length} logs)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 px-2 text-xs text-slate-400 hover:text-white"
          >
            {isMinimized ? "Expandir" : "Minimizar"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLogs([])}
            className="h-6 px-2 text-xs text-slate-400 hover:text-white"
          >
            Limpar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 px-2 text-slate-400 hover:text-white"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Logs */}
      {!isMinimized && (
        <div className="h-64 overflow-y-auto p-2 space-y-1 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-8">Nenhum log ainda...</div>
          ) : (
            logs.map((log, i) => {
              const bgColor =
                log.type === "error"
                  ? "bg-red-900/20 border-red-500/30"
                  : log.type === "warn"
                  ? "bg-yellow-900/20 border-yellow-500/30"
                  : "bg-slate-800/50 border-slate-700/50";

              return (
                <div
                  key={i}
                  className={`p-2 rounded border ${bgColor} break-words`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 text-[10px] min-w-[60px]">
                      {log.timestamp}
                    </span>
                    <span
                      className={`text-[10px] font-semibold min-w-[40px] ${
                        log.type === "error"
                          ? "text-red-400"
                          : log.type === "warn"
                          ? "text-yellow-400"
                          : "text-emerald-400"
                      }`}
                    >
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="text-slate-300 flex-1">{log.message}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

