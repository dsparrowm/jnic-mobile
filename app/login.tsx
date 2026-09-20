import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ApiError } from "@/src/lib/api";
import { useAuth } from "@/src/lib/session";
import { Field, PrimaryButton } from "@/src/components/ui";
import { colors, spacing, typography } from "@/src/theme/tokens";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Unable to sign in. Check your connection and try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = email.trim().length > 3 && password.length >= 8 && !submitting;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.orbTop} />
      <View style={styles.orbMid} />
      <View style={styles.orbGold} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + spacing.xl,
              paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <Image
              source={require("../assets/images/jnic-logo-transparent.png")}
              accessibilityLabel="Jubilee Nation International Churches"
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>JNLOP</Text>
          </View>

          <View style={styles.form}>
            <Field
              tone="onNavy"
              label="Email"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@jnic.org"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
            />

            <View style={styles.passwordHead}>
              <Text style={styles.passwordLabel}>Password</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                accessibilityState={{ expanded: showPassword }}
                hitSlop={8}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
            <Field
              tone="onNavy"
              label=""
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={() => {
                if (canSubmit) void onSubmit();
              }}
              returnKeyType="go"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              label="Sign in"
              onPress={() => void onSubmit()}
              loading={submitting}
              disabled={!canSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  orbTop: {
    position: "absolute",
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.goldGlow,
  },
  orbMid: {
    position: "absolute",
    top: 120,
    left: -90,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.navyGlow,
  },
  orbGold: {
    position: "absolute",
    bottom: "28%",
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.whiteGlow,
  },
  brandBlock: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 104,
    height: 80,
    marginBottom: spacing.md,
  },
  brand: {
    ...typography.display,
    color: colors.textOnNavy,
  },
  form: {
    width: "100%",
  },
  passwordHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  passwordLabel: {
    ...typography.caption,
    color: colors.textOnNavyMuted,
  },
  showPasswordText: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.gold,
  },
  error: {
    ...typography.footnote,
    color: colors.error,
    marginBottom: spacing.md,
  },
});
