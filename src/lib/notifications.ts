import type { NotificationRecord } from "@repo/types";

export function notificationReportId(item: NotificationRecord): string | null {
  const value = item.metadata?.reportId;
  return typeof value === "string" ? value : null;
}

export function openNotificationTarget(
  item: NotificationRecord,
  navigate: (href: string) => void,
) {
  const reportId = notificationReportId(item);
  if (reportId) {
    navigate(`/weekly/${reportId}`);
    return;
  }
  navigate("/weekly");
}
