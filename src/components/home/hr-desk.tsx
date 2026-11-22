import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import type { AuthUser } from "@/src/lib/api";
import { SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { colors, fonts, radius, spacing, typography } from "@/src/theme/tokens";

function ManageRow({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.manageRow} onPress={onPress}>
      <View style={styles.manageIcon}>
        <Ionicons name={icon} size={18} color={colors.goldText} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.manageTitle}>{title}</Text>
        <Text style={styles.manageDetail} numberOfLines={2}>
          {detail}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

type Row = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  href: string;
};

const PERSONNEL_ROWS: Row[] = [
  {
    icon: "people-outline",
    title: "People",
    detail:
      "Roster of pastors, workers and unit leaders — reassign, deactivate",
    href: "/pastors",
  },
  {
    icon: "person-add-outline",
    title: "Onboard someone",
    detail:
      "Recruit and deploy a pastor, worker or member — sends their invite",
    href: "/pastors?onboard=1",
  },
  {
    icon: "git-network-outline",
    title: "Directorates",
    detail:
      "Seat directors, desk heads and members across all ten directorates",
    href: "/org?view=directorates",
  },
];

const CASES_ROW: Row = {
  icon: "shield-checkmark-outline",
  title: "Case registers",
  detail:
    "Welfare and discipline cases — confidential, counts feed your D-reports",
  href: "/cases",
};

const APPRAISALS_ROW: Row = {
  icon: "star-half-outline",
  title: "Appraisals",
  detail: "Mid-year and year-end records for pastors and workers",
  href: "/appraisals",
};

/** HR desk card — rows keyed by the caller's desk, not just leadership. */
export function HrDeskCard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const access = user.hrAccess ?? {
    personnel: user.hrPersonnel === true,
    welfare: user.hrPersonnel === true,
    discipline: user.hrPersonnel === true,
    appraisals: user.hrPersonnel === true,
  };
  const rows: Row[] = [
    ...(access.personnel ? PERSONNEL_ROWS : []),
    ...(access.welfare || access.discipline ? [CASES_ROW] : []),
    ...(access.appraisals ? [APPRAISALS_ROW] : []),
  ];
  if (rows.length === 0) return null;

  return (
    <>
      <SectionHeader title="HR desk" />
      <SurfaceCard style={styles.manageCard}>
        {rows.map((row, idx) => (
          <View key={row.href}>
            {idx > 0 ? <View style={styles.rowDivider} /> : null}
            <ManageRow
              icon={row.icon}
              title={row.title}
              detail={row.detail}
              onPress={() => router.push(row.href as never)}
            />
          </View>
        ))}
      </SurfaceCard>
    </>
  );
}

const styles = StyleSheet.create({
  manageCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  manageIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.navyMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  manageTitle: {
    ...typography.body,
    fontWeight: "600",
    fontFamily: fonts.display,
    color: colors.textPrimary,
  },
  manageDetail: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 36 + spacing.sm,
  },
});
