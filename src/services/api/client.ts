import axios, { AxiosHeaders, AxiosRequestConfig } from 'axios';

import { env } from '../../config/env';

export type ApiRequestConfig = AxiosRequestConfig & {
  token?: string;
};

let apiAccessToken: string | null = null;

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(config => {
  if (!apiAccessToken) {
    return config;
  }

  const headers = AxiosHeaders.from(config.headers);

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${apiAccessToken}`);
  }

  config.headers = headers;

  return config;
});

export function setApiAccessToken(token: string | null) {
  apiAccessToken = token;
}

export function clearApiAccessToken() {
  apiAccessToken = null;
}

function resolveRequestConfig(config?: ApiRequestConfig): AxiosRequestConfig | undefined {
  if (!config) {
    return undefined;
  }

  const { token, ...axiosConfig } = config;

  if (!token) {
    return axiosConfig;
  }

  const headers = AxiosHeaders.from(
    axiosConfig.headers as Parameters<typeof AxiosHeaders.from>[0],
  );
  headers.set('Authorization', `Bearer ${token}`);

  return {
    ...axiosConfig,
    headers,
  };
}

export async function apiGet<TResponse>(
  url: string,
  config?: ApiRequestConfig,
): Promise<TResponse> {
  const response = await apiClient.get<TResponse>(url, resolveRequestConfig(config));

  return response.data;
}

export async function apiPost<TResponse, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: ApiRequestConfig,
): Promise<TResponse> {
  const response = await apiClient.post<TResponse>(
    url,
    data,
    resolveRequestConfig(config),
  );

  return response.data;
}

export async function apiPut<TResponse, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: ApiRequestConfig,
): Promise<TResponse> {
  const response = await apiClient.put<TResponse>(
    url,
    data,
    resolveRequestConfig(config),
  );

  return response.data;
}

export async function apiPatch<TResponse, TBody = unknown>(
  url: string,
  data?: TBody,
  config?: ApiRequestConfig,
): Promise<TResponse> {
  const response = await apiClient.patch<TResponse>(
    url,
    data,
    resolveRequestConfig(config),
  );

  return response.data;
}

export async function apiDelete<TResponse>(
  url: string,
  config?: ApiRequestConfig,
): Promise<TResponse> {
  const response = await apiClient.delete<TResponse>(
    url,
    resolveRequestConfig(config),
  );

  return response.data;
}
