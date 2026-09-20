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
