import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { AuthResponse, AuthUser } from "./api";
import { Role } from "@repo/types";

const ACCESS_KEY = "jnlop_access";
const REFRESH_KEY = "jnlop_refresh";
const USER_KEY = "jnlop_user";

const webStore = {
  async getItemAsync(key: string): Promise<string | null> {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(key);
  },
};

const store = Platform.OS === "web" ? webStore : SecureStore;

export async function getAccessToken(): Promise<string | null> {
  return store.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return store.getItemAsync(REFRESH_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await store.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function saveSession(data: AuthResponse): Promise<void> {
  await store.setItemAsync(ACCESS_KEY, data.accessToken);
  await store.setItemAsync(REFRESH_KEY, data.refreshToken);
  await store.setItemAsync(USER_KEY, JSON.stringify(data.user));
}

export async function clearSession(): Promise<void> {
  await store.deleteItemAsync(ACCESS_KEY);
  await store.deleteItemAsync(REFRESH_KEY);
  await store.deleteItemAsync(USER_KEY);
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === Role.ADMIN;
}

export function isLeadPastor(user: AuthUser | null): boolean {
  return user?.role === Role.LEAD_PASTOR;
}

export function isHqUser(user: AuthUser | null): boolean {
  return isAdmin(user) || isLeadPastor(user);
}
