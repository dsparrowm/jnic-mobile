import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StateSummaryResponse } from "@repo/types";
import { StatusPill } from "@/src/components/premium/controls";
import { SurfaceCard } from "@/src/components/premium/screen";
import { rollupLabel, rollupTone } from "@/src/components/weekly/status";
import { colors, spacing, typography } from "@/src/theme/tokens";

export function StateZoneAttention({
  state,
  onPress,
}: {
  state: StateSummaryResponse;
  onPress: () => void;
}) {
  const waiting = state.zones.filter((zone) => !zone.forwarded);
  if (waiting.length === 0) return null;

  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>Needs attention</Text>
      <Text style={styles.body}>
        {waiting.length === 1
          ? "1 zone has not forwarded this week."
          : `${waiting.length} zones have not forwarded this week.`}
      </Text>
      {waiting.map((zone) => (
        <Pressable
          key={zone.zone.id}
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Text style={styles.zone}>{zone.zone.name}</Text>
          <StatusPill
            label={rollupLabel(zone.rollup.status)}
            tone={rollupTone(zone.rollup.status)}
          />
        </Pressable>
      ))}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  body: {
    ...typography.footnote,
    color: colors.textMuted,
  },
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  zone: {
    ...typography.callout,
    color: colors.textPrimary,
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
