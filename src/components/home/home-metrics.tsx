import { StyleSheet, Text, View } from "react-native";
import { Role } from "@repo/types";
import type { HqDashboardResponse } from "@repo/types";
import { formatCount } from "@/src/lib/format";
import { colors, fonts, spacing } from "@/src/theme/tokens";

type Delta = {
  text: string;
  tone: "up" | "down" | "muted";
};

export function HomeMetrics({ dashboard }: { dashboard: HqDashboardResponse }) {
  const data = dashboard;
  const { weeklyReporting, attendanceTrend } = data;
  const latest = attendanceTrend.at(-1)?.total ?? 0;
  const previous = attendanceTrend.at(-2)?.total ?? 0;
  const change = previous > 0 ? Math.round(((latest - previous) / previous) * 100) : null;

  const attendanceDelta: Delta =
    change === null || change === 0
      ? { text: "vs last week", tone: "muted" }
      : { text: `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}%`, tone: change > 0 ? "up" : "down" };

  const reportsDelta: Delta =
    weeklyReporting.missed > 0
      ? { text: `${weeklyReporting.missed} missed`, tone: "down" }
      : weeklyReporting.pending > 0
        ? { text: `${weeklyReporting.pending} pending`, tone: "muted" }
        : { text: "all in", tone: "up" };

  const isAdmin = data.role === Role.ADMIN;
  const middle = isAdmin
    ? {
        label: "Pastors",
        value: formatCount(data.pastors?.active ?? 0),
        delta: {
          text: `${data.pastors?.pending ?? 0} pending`,
          tone: "muted" as const,
        },
      }
    : {
        label: "To approve",
        value: formatCount(data.pendingSummaryApprovals),
        delta: { text: "waiting", tone: "muted" as const },
      };

  const kpis = [
    {
      label: "Attendance",
      value: formatCount(weeklyReporting.attendance.total),
      delta: attendanceDelta,
    },
    middle,
    {
      label: "Reports in",
      value: `${weeklyReporting.submitted}/${weeklyReporting.total}`,
      delta: reportsDelta,
    },
  ];

  return (
    <View style={styles.strip}>
      {kpis.map((kpi, index) => (
        <View
          key={kpi.label}
          style={[styles.cell, index > 0 && styles.cellDivider]}
        >
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {kpi.value}
          </Text>
          <Text style={styles.label} numberOfLines={1}>
            {kpi.label}
          </Text>
          <Text style={[styles.delta, styles[kpi.delta.tone]]} numberOfLines={1}>
            {kpi.delta.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    paddingVertical: spacing.xs,
  },
  cell: {
    flex: 1,
    gap: 2,
  },
  cellDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  delta: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },
  up: {
    color: colors.success,
  },
  down: {
    color: colors.error,
  },
  muted: {
    color: colors.textMuted,
  },
});
