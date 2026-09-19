import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/session";
import { colors, radius, spacing } from "@/src/theme/tokens";

export default function UnavailableScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function onLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Mobile HQ access only</Text>
      <Text style={styles.body}>
        Signed in as {user?.name} ({user?.role?.replace(/_/g, " ")}). JNLOP mobile
        v1 is for Admin and Lead Pastor. Open the web app for pastor reporting and
        hierarchy views.
      </Text>
      <Pressable style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.gold,
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
