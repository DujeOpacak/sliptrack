import axios from "axios";
import { API_BASE_URL } from "./config";
import { tokenStorage } from "./tokenStorage";
import type { TokenResponse } from "../types/auth";

export const apiClient = axios.create({ baseURL: API_BASE_URL });

// Plain instance (no interceptors) so the refresh call itself can't trigger another refresh loop.
const refreshClient = axios.create({ baseURL: API_BASE_URL });

let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(callback: () => void) {
  onSessionExpired = callback;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  const response = await refreshClient.post<TokenResponse>("/auth/refresh", {
    refreshToken,
  });
  await tokenStorage.saveTokens(
    response.data.accessToken,
    response.data.refreshToken,
  );
  return response.data.accessToken;
}

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await tokenStorage.getAccessToken();
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
      await tokenStorage.clearTokens();
      onSessionExpired?.();
      return Promise.reject(refreshError);
    }
  },
);
