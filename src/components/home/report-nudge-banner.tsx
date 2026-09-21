import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  BranchSubmissionState,
  PastorHomeWeekReport,
} from "@repo/types";
import { StatusPill } from "@/src/components/premium/controls";
import { SurfaceCard } from "@/src/components/premium/screen";
import {
  reportStatusLabel,
  submissionLabel,
  submissionTone,
  reportStatusTone,
} from "@/src/components/weekly/status";
import { colors, spacing, typography } from "@/src/theme/tokens";

function nudgeCopy(
  report: PastorHomeWeekReport | null,
  submissionState: BranchSubmissionState,
  weekLabel: string,
) {
  if (submissionState === "MISSED") {
    return {
      pill: submissionLabel(submissionState),
      tone: submissionTone(submissionState),
      title: "Last week not submitted",
      meta: "Open Reports to catch up",
    };
  }

  if (!report && submissionState === "PENDING") {
    return {
      pill: submissionLabel(submissionState),
      tone: submissionTone(submissionState),
      title: "Submit this week’s report",
      meta: `Week ending ${weekLabel}`,
    };
  }

  if (report) {
    const pill = report.editable
      ? submissionLabel("SUBMITTED")
      : reportStatusLabel(report.status);
    const tone = report.editable
      ? submissionTone("SUBMITTED")
      : reportStatusTone(report.status);

    return {
      pill,
      tone,
      title: report.editable ? "Weekly report submitted" : "Report with your leaders",
      meta: `Week ending ${weekLabel}`,
    };
  }

  return {
    pill: submissionLabel(submissionState),
    tone: submissionTone(submissionState),
    title: "Weekly report",
    meta: `Week ending ${weekLabel}`,
  };
}

export function ReportNudgeBanner({
  report,
  submissionState,
  weekLabel,
  onPress,
}: {
  report: PastorHomeWeekReport | null;
  submissionState: BranchSubmissionState;
  weekLabel: string;
  onPress: () => void;
}) {
  const copy = nudgeCopy(report, submissionState, weekLabel);

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
