import Constants from "expo-constants";
import { Role, UserStatus } from "@repo/types";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
} from "./auth";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:4000";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  stateId: string | null;
  zoneId: string | null;
  branchId: string | null;
  profilePicUrl?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  status: string;
  profilePicUrl: string | null;
  stateId: string | null;
  zoneId: string | null;
  branchId: string | null;
  onboardingTokenExpiry: string | null;
  createdAt: string;
}

export interface PastorOrgRef {
  id: string;
  name: string;
}

export interface PastorRecord {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  status: string;
  profilePicUrl: string | null;
  createdAt: string;
  state: PastorOrgRef | null;
  zone: PastorOrgRef | null;
  branch: PastorOrgRef | null;
}

export interface PastorListSummary {
  total: number;
  active: number;
  pending: number;
  deactivated: number;
}

export interface PastorListResponse {
  items: PastorRecord[];
  total: number;
  page: number;
  perPage: number;
  summary: PastorListSummary;
}

export interface PastorFilters {
  search?: string;
  stateId?: string;
  zoneId?: string;
  branchId?: string;
  role?: Role;
  status?: UserStatus | string;
  page?: number;
  perPage?: number;
}

export interface OrgBranch {
  id: string;
  name: string;
  zoneId: string;
  address: string | null;
}

export interface OrgZone {
  id: string;
  name: string;
  stateId: string;
  branches: OrgBranch[];
}

export interface OrgState {
  id: string;
  name: string;
  zones: OrgZone[];
}

export interface MonthlySummaryRecord {
  id: string;
  month: number;
  year: number;
  scopeType: string;
  scopeId: string | null;
  scopeName?: string;
  status: string;
  totals?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlySummaryPendingResponse {
  items: MonthlySummaryRecord[];
}

export interface MonthlySummaryListResponse {
  month: number;
  year: number;
  items: MonthlySummaryRecord[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function formatApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const message = (body as { message?: string | string[] }).message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}

function decodeBase64(input: string): string {
  // atob is available in React Native Hermes / Expo
  if (typeof atob === "function") {
    return atob(input);
  }
  // Fallback for unusual runtimes
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let str = input.replace(/=+$/, "");
  let output = "";
  for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ) {
    const idx = chars.indexOf(buffer);
    if (idx === -1) break;
    bs = bc % 4 ? bs * 64 + idx : idx;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}

function shouldRefreshAccessToken(token: string, skewSeconds = 60): boolean {
  try {
    const payload = JSON.parse(
      decodeBase64(token.split(".")[1] ?? ""),
    ) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;
    try {
      const session = await rawRequest<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      await saveSession(session);
      return session.accessToken;
    } catch {
      await clearSession();
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function resolveAccessToken(
  explicitToken?: string | null,
): Promise<string | null> {
  const token = explicitToken ?? (await getAccessToken());
  if (!token) return null;
  if (!shouldRefreshAccessToken(token)) return token;
  return refreshAccessToken();
}

function isPublicApiPath(path: string): boolean {
  if (path.startsWith("/auth/")) return true;
  if (path.startsWith("/onboarding/validate/")) return true;
  if (path === "/onboarding/complete") return true;
  return false;
}

async function rawRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(formatApiErrorMessage(body, res.statusText), res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  retried = false,
): Promise<T> {
  const isPublic = isPublicApiPath(path);
  const accessToken = isPublic ? (token ?? null) : await resolveAccessToken(token);

  if (!isPublic && !accessToken) {
    throw new ApiError("Session expired. Please sign in again.", 401);
  }

  try {
    return await rawRequest<T>(path, options, accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !retried && !isPublic) {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        return request<T>(path, options, nextToken, true);
      }
      throw new ApiError("Session expired. Please sign in again.", 401);
    }
    throw err;
  }
}

export const api = {
  getApiUrl: () => API_URL,

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken: string) =>
    request<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string) =>
    request<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  getMe: () => request<UserRecord>("/users/me"),

  listPastors: (filters: PastorFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.stateId) params.set("stateId", filters.stateId);
    if (filters.zoneId) params.set("zoneId", filters.zoneId);
    if (filters.branchId) params.set("branchId", filters.branchId);
    if (filters.role) params.set("role", filters.role);
    if (filters.status) params.set("status", filters.status);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.perPage) params.set("perPage", String(filters.perPage));
    const qs = params.toString();
    return request<PastorListResponse>(`/users/pastors${qs ? `?${qs}` : ""}`);
  },

  createOnboardingUser: (data: {
    name: string;
    email: string;
    phone?: string;
    role: Role;
    stateId?: string;
    zoneId?: string;
    branchId?: string;
  }) =>
    request<UserRecord>("/onboarding/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resendOnboarding: (userId: string) =>
    request<UserRecord>(`/onboarding/users/${userId}/resend`, {
      method: "POST",
    }),

  deactivateUser: (userId: string) =>
    request<UserRecord>(`/users/${userId}/deactivate`, { method: "PATCH" }),

  reassignUser: (
    userId: string,
    data: {
      role?: Role;
      stateId?: string | null;
      zoneId?: string | null;
      branchId?: string | null;
    },
  ) =>
    request<UserRecord>(`/users/${userId}/reassign`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getOrgTree: () => request<OrgState[]>("/org/tree"),

  createState: (data: { name: string }) =>
    request<OrgState>("/org/states", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createZone: (data: { name: string; stateId: string }) =>
    request<OrgZone>("/org/zones", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createBranch: (data: { name: string; zoneId: string; address?: string }) =>
    request<OrgBranch>("/org/branches", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listPendingMonthlyApprovals: () =>
    request<MonthlySummaryPendingResponse>("/summaries/monthly/pending-approval"),

  approveMonthlySummary: (id: string) =>
    request<{ id: string; status: string }>(`/summaries/monthly/${id}/approve`, {
      method: "POST",
    }),

  listMonthlySummaries: (month: number, year: number) => {
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
    });
    return request<MonthlySummaryListResponse>(
      `/summaries/monthly?${params.toString()}`,
    );
  },
};
