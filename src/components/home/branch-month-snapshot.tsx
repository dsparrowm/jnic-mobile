import { StyleSheet, Text, View } from "react-native";
import type { PastorHomeMonthSnapshot } from "@repo/types";
import { SurfaceCard } from "@/src/components/premium/screen";
import { formatMoney } from "@/src/lib/format";
import { colors, spacing, typography } from "@/src/theme/tokens";

export function BranchMonthSnapshot({
  month,
  unitLabel = "Sundays",
}: {
  month: PastorHomeMonthSnapshot;
  unitLabel?: string;
}) {
  const currency = month.totals.currency;

  return (
    <View style={styles.root}>
      <Text style={styles.section}>{month.label} snapshot</Text>
      <SurfaceCard style={styles.card}>
        <Text style={styles.headline}>
          {month.weeksReported} of {month.weeksExpected} {unitLabel} reported
        </Text>
        <Text style={styles.meta}>
          Tithe {formatMoney(month.totals.tithe, currency)} · Offering{" "}
          {formatMoney(month.totals.offering, currency)}
        </Text>
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  section: {
    ...typography.overline,
    color: colors.textMuted,
  },
  card: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  headline: {
    ...typography.callout,
    color: colors.navy,
    fontWeight: "600",
  },
  meta: {
    ...typography.footnote,
    color: colors.textMuted,
  },
});
