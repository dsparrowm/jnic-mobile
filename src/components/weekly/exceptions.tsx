import { Pressable, StyleSheet, Text, View } from "react-native";
import { outstandingBranches, type ZoneReportBranchRow } from "@repo/types";
import { StatusPill } from "@/src/components/premium/controls";
import { SurfaceCard } from "@/src/components/premium/screen";
import { colors, spacing, typography } from "@/src/theme/tokens";
import { submissionLabel, submissionTone } from "./status";

export function ExceptionCard({
  branches,
  onOpenReport,
}: {
  branches: ZoneReportBranchRow[];
  onOpenReport: (reportId: string) => void;
}) {
  const rows = outstandingBranches(branches);
  if (rows.length === 0) return null;

  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>Needs attention</Text>
      <Text style={styles.body}>
        {rows.length === 1
          ? "1 branch has not sent this week."
          : `${rows.length} branches have not sent this week.`}
      </Text>
      {rows.map((row) => (
        <Pressable
          key={row.branch.id}
          accessibilityRole={row.report ? "button" : undefined}
          disabled={!row.report}
          onPress={() => {
            if (row.report) onOpenReport(row.report.id);
          }}
          style={({ pressed }) => [styles.row, pressed && row.report && styles.pressed]}
        >
          <Text style={styles.branch}>{row.branch.name}</Text>
          <StatusPill
            label={row.missed ? "Late" : submissionLabel(row.submissionState)}
            tone={row.missed ? "danger" : submissionTone(row.submissionState)}
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
  branch: {
    ...typography.callout,
    color: colors.textPrimary,
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
