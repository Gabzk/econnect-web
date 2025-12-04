import axios, { type AxiosRequestConfig } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
const API_KEY = process.env.API_KEY;

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  params?: Record<string, unknown>;
  body?: unknown;
  requireAuth?: boolean;
  headers?: Record<string, string>;
}

/**
 * Verifica se as variáveis de ambiente estão configuradas
 * Retorna NextResponse de erro para uso em API routes, ou null se ok
 */
export function validateEnvVars(): NextResponse | null {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "BACKEND_URL não está definido nas variáveis de ambiente." },
      { status: 500 },
    );
  }
  if (!API_KEY) {
    return NextResponse.json(
      { error: "API_KEY não está definido nas variáveis de ambiente." },
      { status: 500 },
    );
  }
  return null;
}

/**
 * Retorna as configurações de ambiente.
 * Pressupõe que as variáveis já foram validadas por validateEnvVars().
 */
export function getEnvConfig(): { BACKEND_URL: string; API_KEY: string } {
  return { BACKEND_URL, API_KEY };
}

/**
 * Monta os headers padrão para requisições ao backend
 */
export async function getApiHeaders(requireAuth = false): Promise<{
  headers: Record<string, string>;
  authError: NextResponse | null;
}> {
  const { API_KEY: apiKey } = getEnvConfig();
  const headers: Record<string, string> = { api_key: apiKey };

  const cookiesStore = await cookies();
  const accessToken = cookiesStore.get("access_token")?.value;

  if (requireAuth && !accessToken) {
    return {
      headers,
      authError: NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      ),
    };
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return { headers, authError: null };
}

/**
 * Trata erros de requisição de forma padronizada
 */
export function handleApiError(err: unknown): NextResponse {
  const error = err as {
    response?: { status?: number; data?: { detail?: string } };
  };
  const status = error.response?.status || 500;
  const message =
    error.response?.data?.detail || "Erro ao processar requisição";
  console.error("API error:", err);
  return NextResponse.json({ error: message }, { status });
}

/**
 * Faz uma requisição ao backend com tratamento de erros padronizado
 */
export async function apiRequest(
  options: ApiRequestOptions,
): Promise<NextResponse> {
  const {
    method = "GET",
    path,
    params,
    body,
    requireAuth = false,
    headers: customHeaders,
  } = options;

  // Valida variáveis de ambiente
  const envError = validateEnvVars();
  if (envError) return envError;

  // Monta headers
  const { headers, authError } = await getApiHeaders(requireAuth);
  if (authError) return authError;

  try {
    const config: AxiosRequestConfig = {
      method,
      url: `${BACKEND_URL}${path}`,
      headers: { ...headers, ...customHeaders },
      params,
      data: body,
    };

    const response = await axios(config);
    return NextResponse.json(response.data);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

/**
 * Atalho para requisições GET
 */
export async function apiGet(
  path: string,
  params?: Record<string, unknown>,
  requireAuth = false,
): Promise<NextResponse> {
  return apiRequest({ method: "GET", path, params, requireAuth });
}

/**
 * Atalho para requisições POST
 */
export async function apiPost(
  path: string,
  body?: unknown,
  requireAuth = true,
): Promise<NextResponse> {
  return apiRequest({ method: "POST", path, body, requireAuth });
}

/**
 * Atalho para requisições PUT
 */
export async function apiPut(
  path: string,
  body?: unknown,
  requireAuth = true,
): Promise<NextResponse> {
  return apiRequest({ method: "PUT", path, body, requireAuth });
}

/**
 * Atalho para requisições DELETE
 */
export async function apiDelete(
  path: string,
  requireAuth = true,
): Promise<NextResponse> {
  return apiRequest({ method: "DELETE", path, requireAuth });
}
