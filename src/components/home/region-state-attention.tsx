import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RegionSummaryResponse } from "@repo/types";
import { StatusPill } from "@/src/components/premium/controls";
import { SurfaceCard } from "@/src/components/premium/screen";
import { rollupLabel, rollupTone } from "@/src/components/weekly/status";
import { colors, spacing, typography } from "@/src/theme/tokens";

export function RegionStateAttention({
  region,
  onPress,
}: {
  region: RegionSummaryResponse;
  onPress: () => void;
}) {
  const waiting = region.states.filter((state) => !state.forwarded);
  if (waiting.length === 0) return null;

  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>Needs attention</Text>
      <Text style={styles.body}>
        {waiting.length === 1
          ? "1 state has not forwarded this week."
          : `${waiting.length} states have not forwarded this week.`}
      </Text>
      {waiting.map((state) => (
        <Pressable
          key={state.state.id}
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Text style={styles.state}>{state.state.name}</Text>
          <StatusPill
            label={rollupLabel(state.rollup.status)}
            tone={rollupTone(state.rollup.status)}
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
    color: colors.textPrimary,
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
  state: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
