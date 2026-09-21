import { StyleSheet, Text, View } from "react-native";
import type { WeeklyReportAttendance, WeeklyReportFinance } from "@repo/types";
import { formatCount, formatMoney } from "@/src/lib/format";
import { SurfaceCard } from "@/src/components/premium/screen";
import { colors, spacing, typography } from "@/src/theme/tokens";

export function TotalsCard({
  title,
  attendance,
  finance,
}: {
  title: string;
  attendance: WeeklyReportAttendance;
  finance: WeeklyReportFinance;
}) {
  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        <Stat label="Adults" value={formatCount(attendance.adultCount)} />
        <Stat label="Teenagers" value={formatCount(attendance.teenageCount)} />
        <Stat label="Children" value={formatCount(attendance.childrenCount)} />
        <Stat label="Tithe" value={formatMoney(finance.tithe, finance.currency)} />
        <Stat label="Offering" value={formatMoney(finance.offering, finance.currency)} />
        <Stat label="Other" value={formatMoney(finance.other, finance.currency)} />
      </View>
    </SurfaceCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  stat: {
    width: "30%",
    minWidth: 90,
    flexGrow: 1,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.navy,
    marginTop: 2,
  },
});
