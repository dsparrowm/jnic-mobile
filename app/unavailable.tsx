import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/src/lib/session";
import { formatRole } from "@/src/lib/format";
import { PrimaryButton } from "@/src/components/ui";
import { StatusPill } from "@/src/components/premium/controls";
import { SurfaceCard } from "@/src/components/premium/screen";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

export default function UnavailableScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
          paddingHorizontal: layout.screenPad,
        },
      ]}
    >
      <StatusBar style="light" />
      <View style={styles.icon}>
        <Ionicons name="shield-checkmark" size={26} color={colors.gold} />
      </View>
      <StatusPill label="Leadership access" tone="warning" />
      <Text style={styles.title}>This mobile workspace is built for HQ</Text>
      <Text style={styles.body}>
        Branch, zonal, and state reporting currently stays on the web app.
      </Text>
      <SurfaceCard style={styles.identity}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>{formatRole(user?.role)}</Text>
      </SurfaceCard>
      <PrimaryButton
        label="Sign out"
        loading={busy}
        onPress={() => void onLogout()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navyDeep,
    justifyContent: "center",
    alignItems: "stretch",
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title1,
    color: colors.textOnNavy,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.callout,
    color: colors.textOnNavyMuted,
    marginBottom: spacing.lg,
  },
  identity: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  role: {
    ...typography.footnote,
    color: colors.textMuted,
    marginTop: 2,
  },
});
