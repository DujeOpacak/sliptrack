import axios from "axios";
import { API_BASE_URL } from "./config";
import { tokenStore } from "./tokenStore";
import type { TokenResponse } from "../types/auth";

export const apiClient = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

// Plain instance (no interceptors) so the refresh call itself can't trigger another refresh loop.
const refreshClient = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(callback: () => void) {
  onSessionExpired = callback;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // No body needed — the refresh token travels as the HttpOnly cookie set by the backend.
  const response = await refreshClient.post<TokenResponse>("/auth/refresh");
  tokenStore.setAccessToken(response.data.accessToken);
  return response.data.accessToken;
}

apiClient.interceptors.request.use((config) => {
  const accessToken = tokenStore.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.includes("/auth/");

    if (error.response?.status !== 401 || isAuthRoute || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      // Multiple requests can 401 at once — share a single in-flight refresh instead of racing.
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      tokenStore.setAccessToken(null);
      onSessionExpired?.();
      return Promise.reject(refreshError);
    }
  },
);
