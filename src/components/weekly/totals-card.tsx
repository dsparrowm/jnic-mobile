import { StyleSheet, Text, View } from "react-native";
import type { WeeklyReportAttendance, WeeklyReportFinance } from "@repo/types";
import { formatCount, formatMoney } from "@/src/lib/format";
import { SurfaceCard } from "@/src/components/premium/screen";
import { colors, fonts, spacing, typography } from "@/src/theme/tokens";

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
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Attendance</Text>
        <View style={styles.grid}>
          <Stat label="Men" value={formatCount(attendance.menCount)} />
          <Stat label="Women" value={formatCount(attendance.womenCount)} />
          <Stat label="Youth" value={formatCount(attendance.youthCount)} />
          <Stat label="Children" value={formatCount(attendance.childrenCount)} />
          <Stat label="Midweek" value={formatCount(attendance.midweekAttendance ?? 0)} />
          <Stat label="Visitors" value={formatCount(attendance.firstTimeVisitors ?? 0)} />
          <Stat label="New converts" value={formatCount(attendance.newConverts ?? 0)} />
          <Stat label="Follow-ups" value={formatCount(attendance.followUpVisits ?? 0)} />
          <Stat label="Units active" value={formatCount(attendance.unitsActive ?? 0)} />
          <Stat label="Outreaches" value={formatCount(attendance.outreachHeld ?? 0)} />
        </View>
      </View>
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Finance</Text>
        <View style={styles.grid}>
          <Stat label="Tithe" value={formatMoney(finance.tithe, finance.currency)} />
          <Stat label="Offering" value={formatMoney(finance.offering, finance.currency)} />
          <Stat label="Other" value={formatMoney(finance.other, finance.currency)} />
        </View>
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
  group: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  groupLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
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
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 21,
    color: colors.textPrimary,
    marginTop: 2,
  },
});
