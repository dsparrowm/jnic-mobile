import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
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

export function HrDeskCard() {
  const router = useRouter();
  return (
    <>
      <SectionHeader title="HR desk" />
      <SurfaceCard style={styles.manageCard}>
        <ManageRow
          icon="people-outline"
          title="People"
          detail="Roster of pastors, workers and unit leaders — reassign, deactivate"
          onPress={() => router.push("/pastors" as never)}
        />
        <View style={styles.rowDivider} />
        <ManageRow
          icon="person-add-outline"
          title="Onboard someone"
          detail="Recruit and deploy a pastor, worker or member — sends their invite"
          onPress={() => router.push("/pastors?onboard=1" as never)}
        />
        <View style={styles.rowDivider} />
        <ManageRow
          icon="git-network-outline"
          title="Directorates"
          detail="Seat directors, desk heads and members across all ten directorates"
          onPress={() => router.push("/org?view=directorates" as never)}
        />
        <View style={styles.rowDivider} />
        <ManageRow
          icon="shield-checkmark-outline"
          title="Case registers"
          detail="Welfare and discipline cases — confidential, counts feed your D-reports"
          onPress={() => router.push("/cases" as never)}
        />
        <View style={styles.rowDivider} />
        <ManageRow
          icon="star-half-outline"
          title="Appraisals"
          detail="Mid-year and year-end records for pastors and workers"
          onPress={() => router.push("/appraisals" as never)}
        />
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
