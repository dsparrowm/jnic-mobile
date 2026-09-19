import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/session";
import { colors, radius, spacing } from "@/src/theme/tokens";

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
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.role?.replace(/_/g, " ")}</Text>
      </View>

      <Text style={styles.apiLabel}>API</Text>
      <Text style={styles.apiValue}>{api.getApiUrl()}</Text>

      <Pressable style={styles.button} onPress={onLogout} disabled={busy}>
        {busy ? (
          <ActivityIndicator color={colors.goldForeground} />
        ) : (
          <Text style={styles.buttonText}>Sign out</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.navy,
  },
  meta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
  },
  apiLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.textMuted,
  },
  apiValue: {
    marginTop: 4,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
    fontSize: 13,
  },
  button: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: colors.goldForeground,
    fontWeight: "600",
    fontSize: 16,
  },
});
