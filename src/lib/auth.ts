import * as SecureStore from "expo-secure-store";
import type { AuthResponse, AuthUser } from "./api";
import { Role } from "@repo/types";

const ACCESS_KEY = "jnlop:access";
const REFRESH_KEY = "jnlop:refresh";
const USER_KEY = "jnlop:user";

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function saveSession(data: AuthResponse): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
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
