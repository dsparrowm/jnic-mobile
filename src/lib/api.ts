import Constants from "expo-constants";
import {
  Role,
  UserStatus,
  type FeedbackListResponse,
  type FeedbackRecord,
  type HqDashboardResponse,
  type PastorDashboardResponse,
  type DistrictSummaryResponse,
  type NationalSummaryResponse,
  type NotificationListResponse,
  type RegionSummaryResponse,
  type StateSummaryResponse,
  type WeeklyReportInput,
  type WeeklyReportListResponse,
  type WeeklyReportRecord,
  type ZoneSummaryResponse,
} from "@repo/types";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveSession,
} from "./auth";
import { emitSessionExpired } from "./session-events";

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
  hrPersonnel?: boolean;
  stateId: string | null;
  zoneId: string | null;
  branchId: string | null;
  regionId?: string | null;
  districtId?: string | null;
  stateName?: string | null;
  zoneName?: string | null;
  districtName?: string | null;
  branchName?: string | null;
  regionName?: string | null;
  directorate?: {
    directorateId: string;
    directorateName: string;
    office: string;
    deskId: string | null;
    deskName: string | null;
  } | null;
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
  hrPersonnel?: boolean;
  profilePicUrl: string | null;
  stateId: string | null;
  zoneId: string | null;
  branchId: string | null;
  regionId?: string | null;
  districtId?: string | null;
  stateName?: string | null;
  zoneName?: string | null;
  branchName?: string | null;
  regionName?: string | null;
  districtName?: string | null;
  directorate?: AuthUser["directorate"];
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

export interface OrgPastorRef {
  id: string;
  name: string;
  profilePicUrl: string | null;
}

export interface OrgBranch {
  id: string;
  name: string;
  zoneId: string | null;
  districtId: string | null;
  stateId?: string;
  address: string | null;
  pastor?: OrgPastorRef | null;
}

export interface OrgDistrict {
  id: string;
  name: string;
  zoneId: string;
  pastor?: OrgPastorRef | null;
  branches: OrgBranch[];
}

export interface OrgZone {
  id: string;
  name: string;
  stateId: string;
  pastor?: OrgPastorRef | null;
  districts: OrgDistrict[];
  branches: OrgBranch[];
}

export interface OrgState {
  id: string;
  name: string;
  regionId: string | null;
  pastor?: OrgPastorRef | null;
  zones: OrgZone[];
  branches?: OrgBranch[];
}

export interface OrgRegion {
  id: string;
  name: string;
  pastor?: OrgPastorRef | null;
  states: OrgState[];
}

export interface ReportTemplateField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number";
}

export interface MyReportTemplate {
  id: string;
  code: string;
  name: string;
  level: "UNIT" | "DESK" | "DIRECTORATE" | "COUNCIL";
  cadence: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
  dueDay: number | null;
  fields: ReportTemplateField[];
  directorate: { id: string; name: string };
  scopes: { serviceUnitId?: string; deskId?: string; label: string }[];
}

export interface TemplateReportRecord {
  id: string;
  templateId: string;
  periodKey: string;
  status: string;
  data: Record<string, unknown>;
  createdAt: string;
  template: { code: string; name: string; directorate: { name: string } };
  serviceUnit?: {
    unitType: { name: string };
    branch: { name: string };
  } | null;
  submittedBy?: { id: string; name: string; role: string };
}

export interface ServiceUnitRecord {
  id: string;
  branch: { id: string; name: string };
  unitType: { id: string; name: string };
  directorate: { id: string; name: string };
  coordinator: { id: string; name: string } | null;
}

export interface DirectorateRecord {
  id: string;
  key: string;
  name: string;
  mandate: string | null;
  deskCount: number;
  unitTypeCount: number;
  memberCount: number;
  leadership: {
    director: { id: string; name: string } | null;
    deputyDirector: { id: string; name: string } | null;
    secretary: { id: string; name: string } | null;
  };
}

export interface DirectorateDesk {
  id: string;
  name: string;
  duties: string[];
}

export interface DirectorateMember {
  id: string;
  office: string;
  deskId: string | null;
  agreedWeeklyHours: number | null;
  termYears: number | null;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: string;
    title: string | null;
    profilePicUrl: string | null;
    branch: { id: string; name: string } | null;
  };
}

export interface DirectorateDetail {
  id: string;
  key: string;
  name: string;
  mandate: string | null;
  desks: DirectorateDesk[];
  branchUnits: { id: string; name: string }[];
  members: DirectorateMember[];
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  branch?: { id: string; name: string } | null;
  branchName?: string | null;
}

export interface OrgTreeResponse {
  regions: OrgRegion[];
  unassignedStates: OrgState[];
}

export interface MonthlySummaryFiling {
  newChurches: number;
  welfareNote: string | null;
  plansNote: string | null;
  filedAt: string | null;
  filedByName: string | null;
}

export interface MonthlySummaryRecord {
  id: string;
  month: number;
  year: number;
  scopeType: string;
  scopeId: string | null;
  scopeName?: string;
  status: string;
  returnNote?: string | null;
  returnedAt?: string | null;
  totals?: Record<string, unknown>;
  coverage?: { branchesReporting: number; branchesTotal: number; weeklyReports: number };
  reportingRate?: number | null;
  filing?: MonthlySummaryFiling;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuarterlyCouncilResponse {
  quarter: number;
  year: number;
  label: string;
  months: Array<{
    month: number;
    monthLabel: string;
    totals: Record<string, unknown>;
    filing: {
      filed: boolean;
      filedByName: string | null;
      filedAt: string | null;
      newChurches: number;
      welfareNote: string | null;
      plansNote: string | null;
    };
    status: string;
  }>;
  totals: Record<string, unknown>;
  territoryFilings: Array<{
    scopeType: string;
    scopeId: string;
    scopeName: string;
    filed: boolean;
    filedByName: string | null;
    filedAt: string | null;
    status: string;
  }>;
  directorateReports: Array<{
    directorateId: string;
    name: string;
    submitted: number;
    reviewed: number;
  }>;
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

function shouldRefreshAccessToken(token: string, skewSeconds = 300): boolean {
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

async function expireSession(): Promise<void> {
  await clearSession();
  emitSessionExpired();
}

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
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await expireSession();
      }
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

  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(formatApiErrorMessage(body, res.statusText), res.status);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") throw err;
    throw new ApiError(
      "Can't reach the API from this browser. Sign in on Expo Go on your phone, or allow http://localhost:8081 on the API (CORS).",
      0,
    );
  }
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
    await expireSession();
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
      await expireSession();
      throw new ApiError("Session expired. Please sign in again.", 401);
    }
    throw err;
  }
}

/** Refresh tokens on app launch or resume. Keeps cached user when offline. */
export async function restoreSession(): Promise<AuthUser | null> {
  const refreshToken = await getRefreshToken();
  const stored = await getStoredUser();
  if (!refreshToken || !stored) return null;

  const accessToken = await getAccessToken();
  if (accessToken && !shouldRefreshAccessToken(accessToken)) {
    return stored;
  }

  try {
    const session = await rawRequest<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    await saveSession(session);
    return session.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await expireSession();
      return null;
    }
    return stored;
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

  presignProfilePicture: (data: {
    contentType: "image/jpeg" | "image/png";
    fileSize: number;
  }) =>
    request<{
      uploadUrl: string;
      key: string;
      publicUrl: string;
      expiresIn: number;
      apiKey: string;
      timestamp: number;
      signature: string;
    }>("/files/profile-picture/presign", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProfilePicture: (data: { key: string }) =>
    request<UserRecord>("/users/me/profile-picture", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getHqDashboard: (
    weekOf: string,
    weeks = 6,
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams({
      weekOf,
      weeks: String(weeks),
    });
    return request<HqDashboardResponse>(
      `/dashboard/hq?${params.toString()}`,
      { signal },
    );
  },

  getPastorDashboard: (
    weekOf: string,
    weeks = 6,
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams({
      weekOf,
      weeks: String(weeks),
    });
    return request<PastorDashboardResponse>(
      `/dashboard/pastor?${params.toString()}`,
      { signal },
    );
  },

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
    directorateId?: string;
    deskId?: string;
    office?: string;
    serviceUnitId?: string;
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
      regionId?: string | null;
      zoneId?: string | null;
      districtId?: string | null;
      branchId?: string | null;
    },
  ) =>
    request<UserRecord>(`/users/${userId}/reassign`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getOrgTree: () => request<OrgTreeResponse>("/org/tree"),
  listMyReportTemplates: () =>
    request<MyReportTemplate[]>("/report-templates/mine"),
  listTemplateReviewQueue: () =>
    request<TemplateReportRecord[]>("/report-templates/review-queue"),
  listMyTemplateReports: () =>
    request<TemplateReportRecord[]>("/report-templates/reports"),
  submitTemplateReport: (
    templateId: string,
    body: {
      periodKey: string;
      scope: { serviceUnitId?: string; deskId?: string };
      data: Record<string, unknown>;
    },
  ) =>
    request<TemplateReportRecord>(`/report-templates/${templateId}/submit`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  reviewTemplateReport: (reportId: string, note?: string) =>
    request<TemplateReportRecord>(`/report-templates/reports/${reportId}/review`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  listServiceUnits: (branchId: string) =>
    request<ServiceUnitRecord[]>(
      `/directorates/units?branchId=${encodeURIComponent(branchId)}`,
    ),

  listAllServiceUnits: () =>
    request<ServiceUnitRecord[]>("/directorates/units"),

  listDirectorates: () => request<DirectorateRecord[]>("/directorates"),

  getDirectorate: (id: string) =>
    request<DirectorateDetail>(`/directorates/${encodeURIComponent(id)}`),

  listAdminUsers: () => request<AdminUserRecord[]>("/users"),

  upsertDirectorateAssignment: (
    directorateId: string,
    data: {
      userId: string;
      office: string;
      deskId?: string;
      agreedWeeklyHours?: number;
      termYears?: number;
    },
  ) =>
    request<unknown>(
      `/directorates/${encodeURIComponent(directorateId)}/assignments`,
      { method: "POST", body: JSON.stringify(data) },
    ),

  removeDirectorateAssignment: (assignmentId: string) =>
    request<unknown>(
      `/directorates/assignments/${encodeURIComponent(assignmentId)}`,
      { method: "DELETE" },
    ),

  setServiceUnitCoordinator: (unitId: string, coordinatorId: string | null) =>
    request<unknown>(`/directorates/units/${encodeURIComponent(unitId)}`, {
      method: "PATCH",
      body: JSON.stringify({ coordinatorId }),
    }),

  createRegion: (data: { name: string }) =>
    request<OrgRegion>("/org/regions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createState: (data: { name: string; regionId?: string }) =>
    request<OrgState>("/org/states", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createDistrict: (data: { name: string; zoneId: string }) =>
    request<OrgDistrict>("/org/districts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createZone: (data: { name: string; stateId: string }) =>
    request<OrgZone>("/org/zones", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createBranch: (data: {
    name: string;
    stateId: string;
    zoneId?: string;
    districtId?: string;
    address?: string;
  }) =>
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

  returnMonthlySummary: (id: string, note?: string) =>
    request<{ id: string; status: string }>(`/summaries/monthly/${id}/return`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  fileMonthlySummary: (
    id: string,
    body: { newChurches?: number; welfareNote?: string; plansNote?: string },
  ) =>
    request<{ id: string; status: string }>(`/summaries/monthly/${id}/file`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getQuarterlyCouncil: (quarter: number, year: number) =>
    request<QuarterlyCouncilResponse>(
      `/summaries/quarterly?quarter=${quarter}&year=${year}`,
    ),

  listMonthlySummaries: (month: number, year: number) => {
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
    });
    return request<MonthlySummaryListResponse>(
      `/summaries/monthly?${params.toString()}`,
    );
  },

  createWeeklyReport: (data: WeeklyReportInput) =>
    request<WeeklyReportRecord>("/reports/weekly", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateWeeklyReport: (id: string, data: Partial<WeeklyReportInput>) =>
    request<WeeklyReportRecord>(`/reports/weekly/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  listWeeklyReports: (
    filters: { weekOf?: string; page?: number; perPage?: number } = {},
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams();
    if (filters.weekOf) params.set("weekOf", filters.weekOf);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.perPage) params.set("perPage", String(filters.perPage));
    const qs = params.toString();
    return request<WeeklyReportListResponse>(
      `/reports/weekly${qs ? `?${qs}` : ""}`,
      { signal },
    );
  },

  getWeeklyReport: (id: string, signal?: AbortSignal) =>
    request<WeeklyReportRecord>(`/reports/weekly/${id}`, { signal }),

  getDistrictSummary: (weekOf: string, signal?: AbortSignal) =>
    request<DistrictSummaryResponse>(
      `/reports/district/summary?weekOf=${encodeURIComponent(weekOf)}`,
      { signal },
    ),

  forwardDistrictReport: (weekOf: string) =>
    request<DistrictSummaryResponse>(
      `/reports/district/${encodeURIComponent(weekOf)}/forward`,
      { method: "POST" },
    ),

  getRegionSummary: (weekOf: string, signal?: AbortSignal) =>
    request<RegionSummaryResponse>(
      `/reports/region/summary?weekOf=${encodeURIComponent(weekOf)}`,
      { signal },
    ),

  forwardRegionReport: (weekOf: string) =>
    request<RegionSummaryResponse>(
      `/reports/region/${encodeURIComponent(weekOf)}/forward`,
      { method: "POST" },
    ),

  getZoneSummary: (weekOf: string, signal?: AbortSignal) =>
    request<ZoneSummaryResponse>(
      `/reports/zone/summary?weekOf=${encodeURIComponent(weekOf)}`,
      { signal },
    ),

  forwardZoneReport: (weekOf: string) =>
    request<ZoneSummaryResponse>(
      `/reports/zone/${encodeURIComponent(weekOf)}/forward`,
      { method: "POST" },
    ),

  getStateSummary: (weekOf: string, signal?: AbortSignal) =>
    request<StateSummaryResponse>(
      `/reports/state/summary?weekOf=${encodeURIComponent(weekOf)}`,
      { signal },
    ),

  forwardStateReport: (weekOf: string) =>
    request<StateSummaryResponse>(
      `/reports/state/${encodeURIComponent(weekOf)}/forward`,
      { method: "POST" },
    ),

  getNationalSummary: (weekOf: string, signal?: AbortSignal) =>
    request<NationalSummaryResponse>(
      `/reports/national/summary?weekOf=${encodeURIComponent(weekOf)}`,
      { signal },
    ),

  listReportFeedback: (reportId: string, signal?: AbortSignal) =>
    request<FeedbackListResponse>(`/reports/${reportId}/feedback`, { signal }),

  createReportFeedback: (
    reportId: string,
    message: string,
    replyToId?: string,
  ) =>
    request<FeedbackRecord>(`/reports/${reportId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ message, ...(replyToId ? { replyToId } : {}) }),
    }),

  listNotifications: (signal?: AbortSignal) =>
    request<NotificationListResponse>("/notifications", { signal }),

  markNotificationRead: (notificationId: string) =>
    request<{ id: string; readAt: string }>(
      `/notifications/${notificationId}/read`,
      { method: "PATCH" },
    ),
};
