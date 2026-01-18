import pino from "pino";

// Configuração do logger baseada no ambiente
const isDevelopment = process.env.NODE_ENV === "development";

// Criar logger base
const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Tipos de contexto para logging
export interface LogContext {
  [key: string]: unknown;
}

// Logger com métodos auxiliares
export const appLogger = {
  // Log de erro
  error: (message: string, context?: LogContext) => {
    logger.error(context || {}, message);
  },

  // Log de warning
  warn: (message: string, context?: LogContext) => {
    logger.warn(context || {}, message);
  },

  // Log de informação
  info: (message: string, context?: LogContext) => {
    logger.info(context || {}, message);
  },

  // Log de debug
  debug: (message: string, context?: LogContext) => {
    logger.debug(context || {}, message);
  },

  // Log de trace
  trace: (message: string, context?: LogContext) => {
    logger.trace(context || {}, message);
  },

  // Logger child para contexto específico (ex: por módulo)
  child: (bindings: LogContext) => {
    return logger.child(bindings);
  },
};

export default appLogger;

