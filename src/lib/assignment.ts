import { Role } from "@repo/types";
import type { AuthUser, UserRecord } from "@/src/lib/api";
import { isHqUser } from "@/src/lib/auth";

export type AssignmentView = {
  title: string;
  meta: string;
  footnote: string;
};

export function buildAssignmentView(
  user: AuthUser | UserRecord | null,
  branchFallback?: string | null,
): AssignmentView {
  if (!user) {
    return {
      title: "No assignment",
      meta: "Sign in to view your scope",
      footnote: "",
    };
  }

  if (isHqUser(user)) {
    return {
      title: "National operations",
      meta: "HQ-wide visibility and approvals",
      footnote: "Contact platform Admin for account changes.",
    };
  }

  const branch = user.branchName ?? branchFallback ?? null;
  const zone = user.zoneName ?? null;
  const state = user.stateName ?? null;

  if (user.role === Role.BRANCH_PASTOR) {
    return {
      title: branch ?? "Branch assigned",
      meta: [zone, state].filter(Boolean).join(" · ") || "Location pending",
      footnote: "Contact Admin to change your assignment.",
    };
  }

  if (user.role === Role.ZONAL_PASTOR) {
    const meta = [
      branch ? `Home branch: ${branch}` : null,
      state,
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      title: zone ?? "Zone assigned",
      meta: meta || "Location pending",
      footnote: branch
        ? "Your home branch is used for weekly report submit."
        : "Contact Admin to change your assignment.",
    };
  }

  if (user.role === Role.STATE_PASTOR) {
    const meta = [
      branch ? `Home branch: ${branch}` : null,
      zone,
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      title: state ?? "State assigned",
      meta: meta || "Location pending",
      footnote: branch
        ? "Your home branch is used for weekly report submit."
        : "Contact Admin to change your assignment.",
    };
  }

  return {
    title: branch ?? zone ?? state ?? "Assigned",
    meta: [zone, state].filter(Boolean).join(" · "),
    footnote: "Contact Admin to change your assignment.",
  };
}
