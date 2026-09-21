import {
  ReportStatus,
  RollupStatus,
  reportStatusLabel as sharedReportStatusLabel,
  rollupLabel as sharedRollupLabel,
  submissionLabel,
  type BranchSubmissionState,
} from "@repo/types";

export function reportStatusTone(
  status: ReportStatus | string,
): "success" | "warning" | "info" | "danger" | "neutral" {
  if (status === ReportStatus.HQ_REVIEWED) return "success";
  if (status === ReportStatus.ZONE_REVIEWED || status === ReportStatus.STATE_REVIEWED) {
    return "info";
  }
  if (status === ReportStatus.SUBMITTED) return "success";
  return "neutral";
}

export function reportStatusLabel(status: ReportStatus | string): string {
  return sharedReportStatusLabel(status);
}

export function submissionTone(
  state: BranchSubmissionState,
): "success" | "warning" | "danger" | "neutral" {
  if (state === "SUBMITTED") return "success";
  if (state === "MISSED") return "danger";
  if (state === "PENDING") return "warning";
  return "neutral";
}

export function rollupTone(
  status: RollupStatus | string,
): "success" | "warning" | "danger" | "neutral" {
  if (status === RollupStatus.FORWARDED) return "success";
  if (status === RollupStatus.STALE) return "danger";
  return "warning";
}

export function rollupLabel(status: RollupStatus | string): string {
  return sharedRollupLabel(status);
}

export { submissionLabel };
