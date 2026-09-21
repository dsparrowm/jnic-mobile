import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Screen } from "@/src/components/ui";
import { PremiumHeader, SurfaceCard } from "@/src/components/premium/screen";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

export default function LibraryScreen() {
  return (
    <Screen padded={false}>
      <View style={styles.root}>
        <PremiumHeader
          title="Library"
          subtitle="Sermons and books from HQ"
          icon="library-outline"
          tone="light"
        />
        <SurfaceCard style={styles.card} elevated>
          <View style={styles.iconWell}>
            <Ionicons name="book-outline" size={28} color={colors.gold} />
          </View>
          <Text style={styles.badge}>Coming soon</Text>
          <Text style={styles.title}>Gospel sermons and books</Text>
          <Text style={styles.body}>
            HQ will publish sermons you can watch for free and books you can
            purchase here. This shelf stays empty until that catalog is ready.
          </Text>
        </SurfaceCard>
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
  card: {
    marginTop: spacing.sm,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.goldSoft,
    marginBottom: spacing.xs,
  },
  badge: {
    ...typography.overline,
    color: colors.gold,
  },
  title: {
    ...typography.title3,
    color: colors.navy,
    textAlign: "center",
  },
  body: {
    ...typography.callout,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 320,
  },
});
