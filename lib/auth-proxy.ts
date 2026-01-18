/**
 * AuthApiProxy - Proxy para requisições à API de autenticação
 * 
 * Classe Singleton que fornece métodos para fazer proxy de requisições HTTP
 * para a API de autenticação, com tratamento de erros robusto, validação
 * com Zod e logging estruturado.
 * 
 * @example
 * ```typescript
 * import { AuthApiProxy } from "@/lib/auth-proxy";
 * 
 * const proxy = AuthApiProxy.getInstance();
 * const response = await proxy.listOrganizations(request);
 * ```
 */

import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z, type ZodType } from "zod";
import { appLogger } from "@/lib/logger";

interface ErrorDescription {
  errorPrefix: string;
  errorMessage: string;
}

interface ApiErrorResponse {
  error?: {
    message?: string;
    details?: unknown;
  };
  message?: string;
}

enum ErrorType {
  NETWORK = "NETWORK_ERROR",
  PARSE = "PARSE_ERROR",
  HTTP = "HTTP_ERROR",
  TIMEOUT = "TIMEOUT_ERROR",
  UNKNOWN = "UNKNOWN_ERROR",
}

interface ErrorContext {
  type: ErrorType;
  endpoint: string;
  method: string;
  statusCode?: number;
  originalError?: unknown;
  responseBody?: unknown;
}

export class AuthApiProxy {
  private static instance: AuthApiProxy | null = null;
  private static readonly BASE_URL: string =
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    "https://backend-geo-crud--samuelf21.replit.app/api/v1/auth";

  // Construtor privado para prevenir instanciação direta
  private constructor() {}

  private _buildOrigin = async (): Promise<string> => {
    const headersList = await headers();
    const host = headersList.get("host") || process.env.HOST || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    return `${protocol}://${host}`;
  };

  private _buildCookies = (request: NextRequest): string => {
    const cookies = request.cookies.getAll();
    return cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
  };

  private _buildHeaders = (origin: string, cookie: string): HeadersInit => {
    return {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    };
  };

  private _parseErrorResponse = async (
    response: Response
  ): Promise<ApiErrorResponse> => {
    try {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return await response.json();
      }
      const text = await response.text();
      return { message: text || `Erro HTTP ${response.status}` };
    } catch {
      return { message: `Erro HTTP ${response.status}` };
    }
  };

  private _getErrorMessage = (
    statusCode: number,
    apiError?: ApiErrorResponse,
    defaultMessage?: string
  ): string => {
    // Priorizar mensagem da API
    if (apiError?.error?.message) {
      return apiError.error.message;
    }
    if (apiError?.message) {
      return apiError.message;
    }

    // Mensagens baseadas no status HTTP
    const statusMessages: Record<number, string> = {
      400: "Requisição inválida. Verifique os dados enviados.",
      401: "Não autorizado. Faça login novamente.",
      403: "Acesso negado. Você não tem permissão para esta ação.",
      404: "Recurso não encontrado.",
      409: "Conflito. O recurso já existe ou está em uso.",
      422: "Dados inválidos. Verifique as informações enviadas.",
      429: "Muitas requisições. Tente novamente mais tarde.",
      500: "Erro interno do servidor. Tente novamente.",
      502: "Servidor temporariamente indisponível.",
      503: "Serviço temporariamente indisponível.",
      504: "Tempo de resposta excedido.",
    };

    return (
      statusMessages[statusCode] ||
      defaultMessage ||
      `Erro inesperado (${statusCode})`
    );
  };

  private _handleError = (
    error: unknown,
    context: ErrorContext,
    errorDescription: ErrorDescription
  ): NextResponse => {
    const { type, endpoint, method, statusCode, responseBody } = context;
    const { errorPrefix, errorMessage } = errorDescription;

    // Usar o parâmetro error diretamente, com fallback para originalError do context se necessário
    const errorToLog = error instanceof Error 
      ? error.message 
      : error ?? context.originalError;

    // Log estruturado com Pino
    const logContext: Record<string, unknown> = {
      prefix: errorPrefix,
      errorType: type,
      endpoint: `${method} ${endpoint}`,
      statusCode,
      error: errorToLog instanceof Error ? errorToLog.message : errorToLog,
    };

    if (error instanceof Error && error.stack) {
      logContext.errorStack = error.stack;
    }

    if (responseBody) {
      logContext.responseBody = responseBody;
    }

    // Usar nível apropriado baseado no tipo de erro
    if (type === ErrorType.NETWORK || type === ErrorType.TIMEOUT) {
      appLogger.warn(`${errorPrefix} ${errorToLog}`, logContext);
    } else {
      appLogger.error(`${errorPrefix} ${errorToLog}`, logContext);
    }

    // Determinar status HTTP e mensagem
    let httpStatus = 500;
    let message = errorMessage;

    if (type === ErrorType.NETWORK) {
      httpStatus = 503;
      message = "Erro de conexão. Verifique sua internet e tente novamente.";
      // Adicionar detalhes do erro de rede se disponível
      if (error instanceof Error && error.message) {
        message += ` (${error.message})`;
      }
    } else if (type === ErrorType.TIMEOUT) {
      httpStatus = 504;
      message = "Tempo de resposta excedido. Tente novamente.";
    } else if (type === ErrorType.HTTP && statusCode) {
      httpStatus = statusCode;
      message = this._getErrorMessage(
        statusCode,
        responseBody as ApiErrorResponse,
        errorMessage
      );
    } else if (type === ErrorType.PARSE) {
      httpStatus = 502;
      message = "Erro ao processar resposta do servidor.";
      // Adicionar detalhes do erro de parsing se disponível
      if (error instanceof Error && error.message) {
        message += ` (${error.message})`;
      }
    } else if (type === ErrorType.UNKNOWN) {
      // Para erros desconhecidos, tentar extrair mensagem útil do erro
      if (error instanceof Error && error.message) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      }
    }

    return NextResponse.json(
      {
        error: {
          message,
          type,
          ...(process.env.NODE_ENV === "development" && {
            details: {
              endpoint,
              method,
              statusCode,
              ...(error instanceof Error && {
                errorMessage: error.message,
                errorStack: error.stack,
              }),
            },
          }),
        },
      },
      { status: httpStatus }
    );
  };

  private _makeRequest = async <T = unknown>(
    request: NextRequest,
    method: string,
    endpoint: string,
    errorDescription: ErrorDescription,
    options?: {
      body?: unknown;
      query?: Record<string, string>;
      timeout?: number;
      responseSchema?: ZodType<T>;
    }
  ): Promise<NextResponse> => {
    const { body, query, timeout = 30000 } = options || {};

    try {
      const origin = await this._buildOrigin();
      const cookies = this._buildCookies(request);
      const headers = this._buildHeaders(origin, cookies);

      const input = new URL(endpoint, AuthApiProxy.BASE_URL);
      if (query) {
        input.search = new URLSearchParams(query).toString();
      }

      const init: RequestInit = {
        method,
        headers,
      };

      if (body) {
        init.body = JSON.stringify(body);
      }

      // Timeout usando AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      init.signal = controller.signal;

      try {
        const response = await fetch(input, init);
        clearTimeout(timeoutId);

        // Verificar se a resposta é OK
        if (!response.ok) {
          const errorData = await this._parseErrorResponse(response);
          return this._handleError(
            new Error(`HTTP ${response.status}`),
            {
              type: ErrorType.HTTP,
              endpoint,
              method,
              statusCode: response.status,
              responseBody: errorData,
            },
            errorDescription
          );
        }

        // Tentar parsear JSON
        const contentType = response.headers.get("content-type");
        let data: unknown;

        if (contentType?.includes("application/json")) {
          try {
            const text = await response.text();
            data = text ? JSON.parse(text) : null;
          } catch (parseError) {
            return this._handleError(
              parseError,
              {
                type: ErrorType.PARSE,
                endpoint,
                method,
                statusCode: response.status,
                originalError: parseError,
              },
              errorDescription
            );
          }
        } else {
          const text = await response.text();
          data = text || null;
        }

        // Validar resposta com Zod se schema fornecido
        const { responseSchema } = options || {};
        if (responseSchema) {
          try {
            data = responseSchema.parse(data);
          } catch (validationError) {
            if (validationError instanceof z.ZodError) {
              return this._handleError(
                validationError,
                {
                  type: ErrorType.PARSE,
                  endpoint,
                  method,
                  statusCode: response.status,
                  originalError: validationError,
                  responseBody: {
                    validationErrors: validationError.issues,
                    receivedData: data,
                  },
                },
                {
                  ...errorDescription,
                  errorMessage:
                    "Resposta da API não está no formato esperado. " +
                    errorDescription.errorMessage,
                }
              );
            }
            throw validationError;
          }
        }

        return NextResponse.json(data, { status: response.status });
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Verificar se foi timeout
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return this._handleError(
            fetchError,
            {
              type: ErrorType.TIMEOUT,
              endpoint,
              method,
              originalError: fetchError,
            },
            errorDescription
          );
        }

        // Verificar se é erro de rede
        if (
          fetchError instanceof TypeError &&
          (fetchError.message.includes("fetch") ||
            fetchError.message.includes("network"))
        ) {
          return this._handleError(
            fetchError,
            {
              type: ErrorType.NETWORK,
              endpoint,
              method,
              originalError: fetchError,
            },
            errorDescription
          );
        }

        throw fetchError;
      }
    } catch (error) {
      return this._handleError(
        error,
        {
          type: ErrorType.UNKNOWN,
          endpoint,
          method,
          originalError: error,
        },
        errorDescription
      );
    }
  };

  private GET = async <T = unknown>(
    request: NextRequest,
    endpoint: string,
    errorDescription: ErrorDescription,
    options?: {
      query?: Record<string, string>;
      responseSchema?: ZodType<T>;
    }
  ): Promise<NextResponse> => {
    return this._makeRequest<T>(request, "GET", endpoint, errorDescription, {
      query: options?.query,
      responseSchema: options?.responseSchema,
    });
  };

  private POST = async <T = unknown>(
    request: NextRequest,
    endpoint: string,
    errorDescription: ErrorDescription,
    options?: {
      body?: unknown;
      responseSchema?: ZodType<T>;
    }
  ): Promise<NextResponse> => {
    return this._makeRequest<T>(request, "POST", endpoint, errorDescription, {
      body: options?.body,
      responseSchema: options?.responseSchema,
    });
  };

  private PUT = async <T = unknown>(
    request: NextRequest,
    endpoint: string,
    errorDescription: ErrorDescription,
    options?: {
      body?: unknown;
      responseSchema?: ZodType<T>;
    }
  ): Promise<NextResponse> => {
    return this._makeRequest<T>(request, "PUT", endpoint, errorDescription, {
      body: options?.body,
      responseSchema: options?.responseSchema,
    });
  };

  private DELETE = async <T = unknown>(
    request: NextRequest,
    endpoint: string,
    errorDescription: ErrorDescription,
    options?: {
      body?: unknown;
      responseSchema?: ZodType<T>;
    }
  ): Promise<NextResponse> => {
    return this._makeRequest<T>(request, "DELETE", endpoint, errorDescription, {
      body: options?.body,
      responseSchema: options?.responseSchema,
    });
  };

  // Métodos públicos GET
  public listOrganizations = async <T = unknown>(
    request: NextRequest,
    options?: {
      query?: Record<string, string>;
      responseSchema?: ZodType<T>;
    }
  ): Promise<NextResponse> => {
    const endpoint = "/organization/list";
    const errorDescription: ErrorDescription = {
      errorPrefix: "Organization list error:",
      errorMessage: "Erro ao listar organizações",
    };

    return await this.GET<T>(request, endpoint, errorDescription, options);
  };

  // Métodos públicos POST
  public createOrganization = async <T = unknown>(
    request: NextRequest,
    body: unknown,
    options?: {
      responseSchema?: ZodType<T>;
    }
  ): Promise<NextResponse> => {
    const endpoint = "/organization/create";
    const errorDescription: ErrorDescription = {
      errorPrefix: "Organization create error:",
      errorMessage: "Erro ao criar organização",
    };

    return await this.POST<T>(request, endpoint, errorDescription, {
      body,
      responseSchema: options?.responseSchema,
    });
  };

  public inviteMember = async <T = unknown>(
    request: NextRequest,
    body: unknown,
    options?: {
      responseSchema?: ZodType<T>;
    }
  ): Promise<NextResponse> => {
    const endpoint = "/organization/invite-member";
    const errorDescription: ErrorDescription = {
      errorPrefix: "Organization invite error:",
      errorMessage: "Erro ao convidar membro",
    };

    return await this.POST<T>(request, endpoint, errorDescription, {
      body,
      responseSchema: options?.responseSchema,
    });
  };

  // Métodos públicos PUT
  public updateOrganization = async <T = unknown>(
    request: NextRequest,
    body: unknown,
    options?: {
      responseSchema?: ZodType<T>;
    }
  ): Promise<NextResponse> => {
    const endpoint = "/organization/update";
    const errorDescription: ErrorDescription = {
      errorPrefix: "Organization update error:",
      errorMessage: "Erro ao atualizar organização",
    };

    return await this.PUT<T>(request, endpoint, errorDescription, {
      body,
      responseSchema: options?.responseSchema,
    });
  };

  // Métodos públicos DELETE
  public deleteOrganization = async <T = unknown>(
    request: NextRequest,
    options?: {
      body?: unknown;
      responseSchema?: ZodType<T>;
    }
  ): Promise<NextResponse> => {
    const endpoint = "/organization/delete";
    const errorDescription: ErrorDescription = {
      errorPrefix: "Organization delete error:",
      errorMessage: "Erro ao deletar organização",
    };

    return await this.DELETE<T>(request, endpoint, errorDescription, options);
  };

  // Método estático para obter a instância Singleton
  public static getInstance(): AuthApiProxy {
    if (!AuthApiProxy.instance) {
      AuthApiProxy.instance = new AuthApiProxy();
    }
    return AuthApiProxy.instance;
  }

  // Método para resetar a instância (útil para testes)
  public static resetInstance(): void {
    AuthApiProxy.instance = null;
  }
}

