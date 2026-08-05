import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { authApi } from "../api/authApi";
import { apiClient, setOnSessionExpired } from "../api/client";
import { tokenStore } from "../api/tokenStore";
import type { AuthUser, TokenResponse } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    setOnSessionExpired(() => setUser(null));

    // Guard against React StrictMode's dev-only double-invoke: two concurrent
    // /auth/refresh calls would race against the same one-time-use refresh
    // cookie (rotation revokes the old token), failing one of them for no reason.
    if (hasBootstrapped.current) {
      return;
    }
    hasBootstrapped.current = true;

    // Silent session restore: if the browser still has a valid HttpOnly refresh
    // cookie from a previous visit, /auth/refresh returns a fresh access token
    // without the user re-entering credentials. The JWT itself only carries the
    // email, so /auth/me is needed to recover name/role for the UI. A 401 on
    // either call just means "not logged in" — not an error.
    (async () => {
      try {
        const response = await apiClient.post<TokenResponse>("/auth/refresh");
        tokenStore.setAccessToken(response.data.accessToken);
        const me = await authApi.me();
        if (me.role !== "ADMIN") {
          // Refresh cookie belongs to a non-admin session (e.g. a USER account
          // accidentally logged into this app before the role check ran) —
          // purge it server-side so it doesn't silently restore next time.
          await authApi.logout();
          tokenStore.setAccessToken(null);
          return;
        }
        setUser(me);
      } catch {
        tokenStore.setAccessToken(null);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const response = await authApi.login({ email, password });
    if (response.role !== "ADMIN") {
      tokenStore.setAccessToken(null);
      // Backend already set the refresh cookie for this (non-admin) session
      // before the role check happened here — clear it explicitly.
      await authApi.logout();
      throw new Error("Ovaj račun nema administratorska prava");
    }
    tokenStore.setAccessToken(response.accessToken);
    setUser({
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    });
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      tokenStore.setAccessToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isBootstrapping, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
