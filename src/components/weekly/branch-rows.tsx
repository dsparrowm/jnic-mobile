import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  sortBranchesForReview,
  type ReportCountSummary,
  type ZoneReportBranchRow,
} from "@repo/types";
import { StatusPill } from "@/src/components/premium/controls";
import { SurfaceCard } from "@/src/components/premium/screen";
import { formatCount, formatMoney } from "@/src/lib/format";
import { colors, spacing, typography } from "@/src/theme/tokens";
import { submissionLabel, submissionTone } from "./status";

export function CountSummary({ summary }: { summary: ReportCountSummary }) {
  return (
    <View style={styles.counts}>
      <Count label="Branches" value={summary.total} />
      <Count label="Submitted" value={summary.submitted} />
      <Count label="Pending" value={summary.pending} />
      <Count label="Missed" value={summary.missed} />
    </View>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

export function BranchRows({
  branches,
  onOpenReport,
}: {
  branches: ZoneReportBranchRow[];
  onOpenReport: (reportId: string) => void;
}) {
  return (
    <View style={styles.list}>
      {sortBranchesForReview(branches).map((row) => {
        const report = row.report;
        const people = report?.attendance
          ? report.attendance.adultCount +
            report.attendance.teenageCount +
            report.attendance.childrenCount
          : null;
        const income = report?.finance
          ? report.finance.tithe + report.finance.offering + report.finance.other
          : null;
        return (
          <Pressable
            key={row.branch.id}
            accessibilityRole={report ? "button" : undefined}
            accessibilityLabel={`${row.branch.name}, ${submissionLabel(row.submissionState)}`}
            disabled={!report}
            onPress={() => {
              if (report) onOpenReport(report.id);
            }}
            style={({ pressed }) => [styles.row, pressed && report && styles.pressed]}
          >
            <View style={styles.rowCopy}>
              <Text style={styles.branch}>{row.branch.name}</Text>
              <Text style={styles.meta}>
                {report
                  ? `${formatCount(people ?? 0)} people · ${formatMoney(income ?? 0, report.finance?.currency)}`
                  : "No report yet"}
              </Text>
            </View>
            <StatusPill
              label={row.missed ? "Late" : submissionLabel(row.submissionState)}
              tone={row.missed ? "danger" : submissionTone(row.submissionState)}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export function SummaryStrip({ summary }: { summary: ReportCountSummary }) {
  return (
    <SurfaceCard style={styles.strip}>
      <CountSummary summary={summary} />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  counts: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  count: {
    flex: 1,
    alignItems: "center",
  },
  countValue: {
    ...typography.title3,
    color: colors.navy,
  },
  countLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  strip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  list: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  branch: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.85,
  },
});
