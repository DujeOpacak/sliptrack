import { apiClient } from "./client";
import type { AuthResponse, AuthUser, LoginRequest } from "../types/auth";

export const authApi = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", request);
    return response.data;
  },
  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
  async me(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>("/auth/me");
    return response.data;
  },
};
