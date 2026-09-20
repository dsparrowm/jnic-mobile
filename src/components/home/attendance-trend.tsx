import { StyleSheet, Text, View } from "react-native";
import type { HqHomeAttendancePoint } from "@repo/types";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export function AttendanceTrend({
  points,
}: {
  points: HqHomeAttendancePoint[];
}) {
  const max = Math.max(...points.map((point) => point.total), 0);
  const latest = points.at(-1)?.total ?? 0;
  const previous = points.at(-2)?.total ?? 0;
  const change = previous > 0 ? Math.round(((latest - previous) / previous) * 100) : 0;
  const summary =
    points.length === 0
      ? "No attendance trend data"
      : `Six week attendance trend. Latest total ${latest}. ${
          change === 0
            ? "No change from the prior week."
            : `${Math.abs(change)} percent ${change > 0 ? "higher" : "lower"} than the prior week.`
        }`;

  return (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.section}>Attendance trend</Text>
          <Text style={styles.subtitle}>All nationally submitted reports</Text>
        </View>
        {points.length > 1 ? (
          <Text style={[styles.change, change < 0 && styles.changeDown]}>
            {change > 0 ? "+" : ""}
            {change}%
          </Text>
        ) : null}
      </View>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={summary}
        style={styles.card}
      >
        {points.length === 0 ? (
          <Text style={styles.empty}>Trend data will appear after reports arrive.</Text>
        ) : (
          <View style={styles.chart}>
            {points.map((point, index) => {
              const height = max > 0 ? Math.max(6, (point.total / max) * 72) : 6;
              const latestPoint = index === points.length - 1;
              return (
                <View key={point.weekOf} style={styles.column}>
                  <Text style={styles.total}>{point.total.toLocaleString()}</Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: latestPoint ? colors.gold : colors.navyMuted,
                      },
                    ]}
                  />
                  <Text style={styles.label}>{point.weekLabel}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  section: {
    ...typography.overline,
    color: colors.textMuted,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  change: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.success,
  },
  changeDown: {
    color: colors.warning,
  },
  card: {
    minHeight: 124,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  chart: {
    height: 100,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  total: {
    fontSize: 9,
    lineHeight: 12,
    color: colors.textMuted,
    marginBottom: 3,
  },
  bar: {
    width: "68%",
    minWidth: 12,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  label: {
    fontSize: 9,
    lineHeight: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  empty: {
    ...typography.footnote,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
