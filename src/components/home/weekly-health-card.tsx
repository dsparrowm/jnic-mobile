import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Role, type HqDashboardResponse } from "@repo/types";
import { colors, radius, shadow, spacing, typography } from "@/src/theme/tokens";

export function WeeklyHealthCard({
  dashboard,
  onPress,
}: {
  dashboard: HqDashboardResponse;
  onPress: () => void;
}) {
  const { submitted, total, missed } = dashboard.weeklyReporting;
  const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;
  const hasCoverage = total > 0;
  const isHealthy = missed === 0;
  const action =
    dashboard.role === Role.ADMIN ? "View summaries" : "Open approvals";

  return (
    <View style={[styles.card, shadow.soft]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.overline}>Weekly health</Text>
          <Text style={styles.value}>
            {submitted}
            <Text style={styles.valueMuted}>/{total}</Text>
          </Text>
          <Text style={styles.label}>HQ-visible branch reports</Text>
        </View>
        <View
          style={[
            styles.status,
            {
              backgroundColor: !hasCoverage
                ? colors.infoSoft
                : isHealthy
                  ? colors.successSoft
                  : colors.warningSoft,
            },
          ]}
        >
          <Ionicons
            name={!hasCoverage ? "time" : isHealthy ? "checkmark-circle" : "alert-circle"}
            size={16}
            color={!hasCoverage ? colors.info : isHealthy ? colors.success : colors.warning}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: !hasCoverage
                  ? colors.info
                  : isHealthy
                    ? colors.success
                    : colors.warning,
              },
            ]}
          >
            {!hasCoverage ? "Awaiting data" : isHealthy ? "On track" : `${missed} missed`}
          </Text>
        </View>
      </View>

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Weekly report coverage"
        accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent}%` }}
        style={styles.progressTrack}
      >
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressText}>{percent}% coverage</Text>
        <Text style={styles.progressText}>{dashboard.weekLabel}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action}
        onPress={onPress}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      >
        <Text style={styles.actionText}>{action}</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.gold} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  overline: {
    ...typography.overline,
    color: colors.textMuted,
  },
  value: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.navy,
    marginTop: 2,
  },
  valueMuted: {
    color: colors.textMuted,
  },
  label: {
    ...typography.footnote,
    color: colors.textMuted,
  },
  status: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: 10,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "700",
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.full,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  progressFill: {
    height: "100%",
    minWidth: 3,
    backgroundColor: colors.gold,
    borderRadius: radius.full,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  action: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    ...typography.footnote,
    fontWeight: "700",
    color: colors.navy,
  },
});
