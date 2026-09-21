import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RollupStatus, formatWeekEndingLabel, type ZoneSummaryResponse } from "@repo/types";
import { StatusPill } from "@/src/components/premium/controls";
import { SurfaceCard } from "@/src/components/premium/screen";
import { rollupLabel, rollupTone } from "@/src/components/weekly/status";
import { colors, spacing, typography } from "@/src/theme/tokens";

function zoneNudgeCopy(zone: ZoneSummaryResponse) {
  const { summary, rollup } = zone;
  const weekLabel = formatWeekEndingLabel(zone.weekOf);

  if (rollup?.status === RollupStatus.STALE) {
    return {
      pill: rollupLabel(RollupStatus.STALE),
      tone: rollupTone(RollupStatus.STALE),
      title: "Needs re-forward",
      meta: "A branch updated after you forwarded",
    };
  }

  if (rollup?.status === RollupStatus.FORWARDED) {
    return {
      pill: rollupLabel(RollupStatus.FORWARDED),
      tone: rollupTone(RollupStatus.FORWARDED),
      title: "Forwarded to state",
      meta: `Week ending ${weekLabel}`,
    };
  }

  if (summary.missed > 0) {
    return {
      pill: "Follow up",
      tone: "danger" as const,
      title: `${summary.missed} missed · ${summary.submitted} sent`,
      meta: `Week ending ${weekLabel}`,
    };
  }

  if (summary.pending > 0) {
    return {
      pill: "Waiting",
      tone: "warning" as const,
      title: `${summary.pending} waiting · ${summary.submitted} sent`,
      meta: `Week ending ${weekLabel}`,
    };
  }

  return {
    pill: rollupLabel(RollupStatus.IN_REVIEW),
    tone: rollupTone(RollupStatus.IN_REVIEW),
    title: "Ready to forward",
    meta: `${summary.submitted} sent · 0 missed`,
  };
}

export function ZoneActionNudge({
  zone,
  onPress,
}: {
  zone: ZoneSummaryResponse;
  onPress: () => void;
}) {
  const copy = zoneNudgeCopy(zone);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.92 }]}
    >
      <SurfaceCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <View style={styles.top}>
              <StatusPill label={copy.pill} tone={copy.tone} />
              <Text style={styles.title}>{copy.title}</Text>
            </View>
            <Text style={styles.meta}>{copy.meta}</Text>
          </View>
          <View style={styles.trailing}>
            <Text style={styles.action}>Reports</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </View>
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  title: {
    ...typography.callout,
    color: colors.navy,
    fontWeight: "600",
  },
  meta: {
    ...typography.footnote,
    color: colors.textMuted,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  action: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
});
