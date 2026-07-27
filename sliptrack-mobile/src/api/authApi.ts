import { apiClient } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

export const authApi = {
  async register(request: RegisterRequest) {
    const response = await apiClient.post<AuthResponse>(
      "/auth/register",
      request,
    );
    return response.data;
  },
  async login(request: LoginRequest) {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      request,
    );
    return response.data;
  },
  async logout(refreshToken: string) {
    await apiClient.post("/auth/logout", { refreshToken });
  },
};
