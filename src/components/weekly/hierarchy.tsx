import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type {
  NationalStateSummary,
  RollupInfo,
  StateZoneSummary,
  ZoneSummaryResponse,
} from "@repo/types";
import { StatusPill } from "@/src/components/premium/controls";
import { SurfaceCard } from "@/src/components/premium/screen";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";
import { BranchRows } from "./branch-rows";
import { rollupLabel, rollupTone } from "./status";

function RollupPill({ rollup }: { rollup: RollupInfo }) {
  return <StatusPill label={rollupLabel(rollup.status)} tone={rollupTone(rollup.status)} />;
}

export function ZoneCard({
  zone,
  onOpenReport,
  defaultOpen = true,
}: {
  zone: Pick<ZoneSummaryResponse, "zone" | "rollup" | "summary" | "branches"> | StateZoneSummary;
  onOpenReport: (reportId: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const forwarded = "forwarded" in zone ? zone.forwarded : true;
  const name = zone.zone.name;

  return (
    <SurfaceCard>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.head, pressed && styles.pressed]}
      >
        <View style={styles.headCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{name}</Text>
            <RollupPill rollup={zone.rollup} />
          </View>
          <Text style={styles.meta}>
            {forwarded
              ? `${zone.summary.submitted} sent · ${zone.summary.pending} waiting · ${zone.summary.missed} late`
              : "Awaiting zone forward"}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {open ? (
        forwarded ? (
          <BranchRows branches={zone.branches} onOpenReport={onOpenReport} />
        ) : (
          <Text style={styles.awaiting}>
            Branch details appear after the zonal pastor forwards this week.
          </Text>
        )
      ) : null}
    </SurfaceCard>
  );
}

export function StateCard({
  state,
  onOpenReport,
}: {
  state: NationalStateSummary;
  onOpenReport: (reportId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.stateWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.stateHead, pressed && styles.pressed]}
      >
        <View style={styles.headCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{state.state.name}</Text>
            <RollupPill rollup={state.rollup} />
          </View>
          <Text style={styles.meta}>
            {state.summary.submitted} sent · {state.summary.pending} waiting ·{" "}
            {state.summary.missed} late
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {open
        ? state.zones.map((zone) => (
            <ZoneCard
              key={zone.zone.id}
              zone={zone}
              onOpenReport={onOpenReport}
              defaultOpen={false}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  awaiting: {
    ...typography.footnote,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  stateWrap: {
    gap: spacing.sm,
  },
  stateHead: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
    borderRadius: radius.md,
  },
});
