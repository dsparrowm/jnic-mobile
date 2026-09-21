import { StyleSheet, Text, View } from "react-native";
import type { PastorHomeWeekReport } from "@repo/types";
import { SurfaceCard } from "@/src/components/premium/screen";
import { formatCount, formatMoney } from "@/src/lib/format";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

function MetricCell({
  label,
  value,
  money = false,
  currency = "NGN",
}: {
  label: string;
  value: number | null | undefined;
  money?: boolean;
  currency?: string;
}) {
  const display =
    value == null
      ? "—"
      : money
        ? formatMoney(value, currency)
        : formatCount(value);

  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {display}
      </Text>
    </View>
  );
}

export function BranchHomeMetrics({
  report,
}: {
  report: PastorHomeWeekReport | null;
}) {
  const attendance = report?.attendance;
  const finance = report?.finance;
  const currency = finance?.currency ?? "NGN";

  return (
    <View style={styles.root}>
      <Text style={styles.section}>This week</Text>
      <SurfaceCard style={styles.card}>
        <View style={styles.row}>
          <MetricCell label="Adults" value={attendance?.adultCount} />
          <MetricCell label="Teens" value={attendance?.teenageCount} />
          <MetricCell label="Children" value={attendance?.childrenCount} />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <MetricCell label="Tithe" value={finance?.tithe} money currency={currency} />
          <MetricCell label="Offering" value={finance?.offering} money currency={currency} />
          <MetricCell
            label="Total"
            value={
              finance
                ? finance.tithe + finance.offering + finance.other
                : undefined
            }
            money
            currency={currency}
          />
        </View>
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
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.callout,
    color: colors.navy,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
});
