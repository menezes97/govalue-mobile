import * as SecureStore from 'expo-secure-store';
import type { ApiErrorBody } from './types';

// EXPO_PUBLIC_* fica embutido no bundle em tempo de build — não é segredo, só a URL da API.
const BASE_URL: string = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
const STORAGE_KEY = 'govalue.auth';

export class ApiError extends Error {
  status: number;
  campos: Record<string, string>;

  constructor(status: number, mensagem: string, campos: Record<string, string> = {}) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.campos = campos;
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** Chamado quando uma requisição autenticada recebe 401 (token expirado/inválido). */
export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

// Diferente do client.ts web (localStorage é síncrono): SecureStore é sempre assíncrono,
// então toda leitura de token aqui precisa de await — a requisição só pode montar o header
// depois que a Promise resolve.
async function token(): Promise<string | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { token: string }).token : null;
  } catch {
    return null;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const jwt = await token();
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique se a API está no ar e se o celular está na mesma rede.');
  }

  if (response.status === 401 && jwt) unauthorizedHandler?.();
  if (response.status === 204) return undefined as T;

  const texto = await response.text();
  const dados = texto ? JSON.parse(texto) : undefined;

  if (!response.ok) {
    const erro = dados as Partial<ApiErrorBody> | undefined;
    throw new ApiError(response.status, erro?.mensagem ?? `Erro ${response.status}`, erro?.campos ?? {});
  }
  return dados as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
};

export const AUTH_STORAGE_KEY = STORAGE_KEY;
