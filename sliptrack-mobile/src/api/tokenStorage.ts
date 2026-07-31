import * as SecureStore from "expo-secure-store";
import type { AuthUser } from "../types/auth";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "authUser";
const DEVICE_ID_KEY = "userDeviceId";

export const tokenStorage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async saveTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },
  async getUser(): Promise<AuthUser | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async saveUser(user: AuthUser) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  async getDeviceId(): Promise<number | null> {
    const raw = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    return raw ? Number(raw) : null;
  },
  async saveDeviceId(id: number) {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, String(id));
  },
  async clearDeviceId() {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  },
  async clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  },
};
