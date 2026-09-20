import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { formatRole } from "@/src/lib/format";
import { useAuth } from "@/src/lib/session";
import {
  Avatar,
  PrimaryButton,
  Screen,
} from "@/src/components/ui";
import { StatusPill } from "@/src/components/premium/controls";
import { PremiumHeader, SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    setBusy(true);
    try {
      await signOut();
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen padded={false}>
      <View style={styles.root}>
        <PremiumHeader
          title="Your profile"
          subtitle="Account and mobile access"
          icon="person"
        />
        <SurfaceCard style={styles.identity} elevated>
          <Avatar name={user?.name} imageUri={user?.profilePicUrl} size={72} />
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <StatusPill label={formatRole(user?.role)} tone="warning" />
          </View>
        </SurfaceCard>

      <View style={styles.body}>
        <SectionHeader title="Connection" />
        <SurfaceCard style={styles.connection}>
          <View>
            <Text style={styles.connectionTitle}>JNLOP services</Text>
            <Text style={styles.connectionBody}>Securely connected and ready</Text>
          </View>
          <StatusPill label="Online" tone="success" />
        </SurfaceCard>

        <View style={styles.signOut}>
          <SectionHeader title="Session" />
          <PrimaryButton
            label="Sign out"
            tone="danger"
            loading={busy}
            onPress={() => void onLogout()}
          />
        </View>
      </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: layout.screenPad,
    backgroundColor: colors.bgBase,
  },
  identity: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    padding: spacing.md,
  },
  identityCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  name: {
    ...typography.title2,
    color: colors.navy,
  },
  email: {
    ...typography.callout,
    color: colors.textMuted,
    marginTop: 2,
  },
  body: {
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  connection: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
  },
  connectionTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  connectionBody: {
    ...typography.footnote,
    color: colors.textMuted,
    marginTop: 2,
  },
  signOut: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.errorSoft,
  },
});
