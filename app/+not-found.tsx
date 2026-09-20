import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "@/src/components/ui";
import { EmptyPanel } from "@/src/components/premium/states";
import { colors, layout, spacing } from "@/src/theme/tokens";

export default function NotFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
    >
      <EmptyPanel
        icon="compass-outline"
        title="Page not found"
        body="This destination is unavailable or may have moved."
      />
      <PrimaryButton
        label="Return home"
        tone="navy"
        onPress={() => router.replace("/")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: layout.screenPad,
    backgroundColor: colors.bgBase,
  },
});
