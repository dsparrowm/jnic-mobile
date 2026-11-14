import { Role } from "@repo/types";
import type { AuthUser } from "./api";

const TITLE_WORDS = new Set([
  "platform",
  "hq",
  "admin",
  "pastor",
  "lead",
  "national",
  "system",
]);

export function formatRole(role?: string | null): string {
  if (!role) return "";
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatRoleShort(role?: string | null): string {
  if (role === Role.BRANCH_PASTOR) return "Branch";
  if (role === Role.ZONAL_PASTOR) return "Zonal";
  if (role === Role.STATE_PASTOR) return "State";
  if (role === Role.LEAD_PASTOR) return "Lead";
  if (role === Role.ADMIN) return "Admin";
  return formatRole(role);
}

export function greetingName(user: AuthUser | null): string {
  const parts = user?.name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const first = parts[0];
  if (first && !TITLE_WORDS.has(first.toLowerCase())) return first;
  if (user?.role === Role.ADMIN) return "Admin";
  if (user?.role === Role.LEAD_PASTOR) return "Pastor";
  return first ?? "there";
}

export function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatMoney(value: number, currency = "NGN"): string {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

export function formatCount(value: number): string {
  return Number(value).toLocaleString();
}

export function formatShortWeekLabel(weekLabel: string): string {
  const match = weekLabel.match(/(\d{1,2})\s+([A-Za-z]{3,})/);
  if (match) return `${match[2].slice(0, 3)} ${match[1]}`;
  return weekLabel;
}

export function todayWeekday(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Africa/Lagos",
  }).format(new Date());
}

export function formatMemberSince(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export function humanizeStatus(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
