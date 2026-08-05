export type Role = "USER" | "ADMIN";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}
