import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import { Role, type HqDashboardResponse } from "@repo/types";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

type Metric = {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

export function HomeMetrics({ dashboard }: { dashboard: HqDashboardResponse }) {
  const metrics: Metric[] =
    dashboard.role === Role.ADMIN
      ? [
          {
            label: "Active",
            value: dashboard.pastors?.active ?? 0,
            icon: "people",
          },
          { label: "Branches", value: dashboard.org.branches, icon: "git-branch" },
          {
            label: "Attendance",
            value: dashboard.weeklyReporting.attendance.total,
            icon: "pulse",
          },
        ]
      : [
          {
            label: "Attendance",
            value: dashboard.weeklyReporting.attendance.total,
            icon: "pulse",
          },
          { label: "Branches", value: dashboard.org.branches, icon: "git-branch" },
          {
            label: "Approvals",
            value: dashboard.pendingSummaryApprovals,
            icon: "checkmark-done",
          },
        ];

  return (
    <View style={styles.grid}>
      {metrics.map((metric) => (
        <View
          key={metric.label}
          accessible
          accessibilityLabel={`${metric.label}: ${metric.value.toLocaleString()}`}
          style={styles.metric}
        >
          <View style={styles.icon}>
            <Ionicons name={metric.icon} size={16} color={colors.gold} />
          </View>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {metric.value.toLocaleString()}
          </Text>
          <Text style={styles.label} numberOfLines={1}>
            {metric.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  icon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.goldSoft,
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.title3,
    color: colors.navy,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
