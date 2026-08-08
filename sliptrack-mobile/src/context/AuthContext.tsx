import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authApi } from "../api/authApi";
import { setOnSessionExpired } from "../api/client";
import { deviceApi } from "../api/deviceApi";
import { tokenStorage } from "../api/tokenStorage";
import { getExpoPushRegistration } from "../utils/registerPushToken";
import type { AuthUser, LoginRequest, RegisterRequest } from "../types/auth";

async function registerDeviceForPush() {
  try {
    const registration = await getExpoPushRegistration();
    if (!registration) {
      return;
    }
    const device = await deviceApi.register(registration);
    await tokenStorage.saveDeviceId(device.id);
  } catch {
    // Best-effort — push registration failure shouldn't block auth flows.
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [accessToken, storedUser] = await Promise.all([
        tokenStorage.getAccessToken(),
        tokenStorage.getUser(),
      ]);
      if (accessToken && storedUser) {
        setUser(storedUser);
        registerDeviceForPush();
      }
      setIsLoading(false);
    })();
  }, []);

  const handleSessionExpired = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    setOnSessionExpired(handleSessionExpired);
  }, [handleSessionExpired]);

  const login = useCallback(async (request: LoginRequest) => {
    const response = await authApi.login(request);
    await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
    const authUser: AuthUser = {
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    };
    await tokenStorage.saveUser(authUser);
    setUser(authUser);
    registerDeviceForPush();
  }, []);

  const register = useCallback(async (request: RegisterRequest) => {
    const response = await authApi.register(request);
    await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
    const authUser: AuthUser = {
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    };
    await tokenStorage.saveUser(authUser);
    setUser(authUser);
    registerDeviceForPush();
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      // Best-effort — if the network call fails, still clear local state so the user isn't stuck logged in.
      await authApi.logout(refreshToken).catch(() => {});
    }
    const deviceId = await tokenStorage.getDeviceId();
    if (deviceId) {
      // Best-effort — device row already scoped to this user, no reason to block logout on it.
      await deviceApi.delete(deviceId).catch(() => {});
    }
    await tokenStorage.clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
