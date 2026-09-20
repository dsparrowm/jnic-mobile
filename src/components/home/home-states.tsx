import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export function HomeSkeleton() {
  return (
    <View accessibilityLabel="Loading operations overview" style={styles.skeletonWrap}>
      <View style={[styles.skeleton, styles.skeletonHero]} />
      <View style={styles.skeletonRow}>
        {Array.from({ length: 3 }, (_, index) => (
          <View key={index} style={[styles.skeleton, styles.skeletonMetric]} />
        ))}
      </View>
      <View style={[styles.skeleton, styles.skeletonList]} />
    </View>
  );
}

export function HomeErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.error}>
      <View style={styles.errorIcon}>
        <Ionicons name="cloud-offline-outline" size={24} color={colors.error} />
      </View>
      <Text style={styles.errorTitle}>Overview unavailable</Text>
      <Text style={styles.errorBody}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export function RefreshErrorBanner({ message }: { message: string }) {
  return (
    <View accessible accessibilityRole="alert" style={styles.banner}>
      <Ionicons name="warning-outline" size={18} color={colors.warning} />
      <Text style={styles.bannerText} numberOfLines={2}>
        {message} Showing the latest available data.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWrap: {
    gap: spacing.md,
  },
  skeleton: {
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.lg,
  },
  skeletonHero: {
    height: 180,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  skeletonMetric: {
    flex: 1,
    height: 96,
  },
  skeletonList: {
    height: 126,
  },
  error: {
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.errorSoft,
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  errorBody: {
    ...typography.footnote,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  retry: {
    minHeight: 44,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    marginTop: spacing.md,
  },
  retryPressed: {
    opacity: 0.82,
  },
  retryText: {
    ...typography.bodyStrong,
    color: colors.textOnNavy,
  },
  banner: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  bannerText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
});
