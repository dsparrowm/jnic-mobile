import { Pressable, StyleSheet, Text, View } from "react-native";
import { Role, type HqDashboardResponse } from "@repo/types";
import { ProgressRing } from "@/src/components/progress-ring";
import { formatShortWeekLabel } from "@/src/lib/format";
import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "@/src/theme/tokens";

export function WeeklyHealthCard({
  dashboard,
  onPress,
}: {
  dashboard: HqDashboardResponse;
  onPress: () => void;
}) {
  const { submitted, total } = dashboard.weeklyReporting;
  const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;
  const week = formatShortWeekLabel(dashboard.weekLabel);
  const action =
    dashboard.role === Role.ADMIN ? "Open reports" : "Open approvals";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Weekly health. ${submitted} of ${total} branch reports received, ${percent} percent coverage. ${action}.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadow.soft,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Weekly report coverage"
        accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent}%` }}
      >
        <ProgressRing
          percent={percent}
          size={74}
          strokeWidth={5}
          color={colors.gold}
          trackColor={colors.bgSubtle}
        >
          <Text style={styles.percent}>{percent}%</Text>
          <Text style={styles.percentLabel}>coverage</Text>
        </ProgressRing>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>Weekly health</Text>
        <Text style={styles.description}>
          {submitted} of {total} branch reports received for {week}.
        </Text>
        <Text style={styles.link}>{action} →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  cardPressed: {
    opacity: 0.8,
  },
  percent: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  percentLabel: {
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  description: {
    ...typography.footnote,
    color: colors.textMuted,
  },
  link: {
    ...typography.footnote,
    fontWeight: "700",
    color: colors.goldText,
    marginTop: 2,
  },
});
