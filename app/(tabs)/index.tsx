import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/src/lib/session";
import { isAdmin, isLeadPastor } from "@/src/lib/auth";
import { colors, radius, spacing } from "@/src/theme/tokens";

export default function HomeScreen() {
  const { user } = useAuth();
  const admin = isAdmin(user);
  const leadPastor = isLeadPastor(user);

  return (
    <View style={styles.root}>
      <Text style={styles.greeting}>Welcome, {user?.name?.split(" ")[0] ?? "leader"}</Text>
      <Text style={styles.role}>{user?.role?.replace(/_/g, " ")}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>HQ mobile (v1)</Text>
        <Text style={styles.cardBody}>
          This build focuses on admin and Lead Pastor workflows. Use the tabs below
          for pastors, org structure, and summary approvals.
        </Text>
      </View>

      {admin ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>• Pastors — onboard, reassign, deactivate</Text>
          <Text style={styles.hintText}>• Org — hierarchy and create state/zone/branch</Text>
          <Text style={styles.hintText}>• Summaries — monthly rollups by month</Text>
        </View>
      ) : null}

      {leadPastor ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>• Approvals — national monthly sign-off</Text>
          <Text style={styles.hintText}>• Summaries — monthly rollups by month</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.navy,
  },
  role: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    color: colors.textMuted,
    fontSize: 14,
    textTransform: "capitalize",
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    marginTop: spacing.sm,
    gap: 6,
  },
  hintText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
});
