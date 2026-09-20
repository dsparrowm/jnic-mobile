import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export function ScreenSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View accessibilityLabel="Loading content" style={styles.skeletonWrap}>
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={[
            styles.skeleton,
            index === 0 ? styles.skeletonLead : styles.skeletonRow,
          ]}
        />
      ))}
    </View>
  );
}

export function InlineNotice({
  message,
  tone = "error",
}: {
  message: string;
  tone?: "error" | "warning" | "info";
}) {
  const config = {
    error: {
      icon: "alert-circle" as const,
      foreground: colors.error,
      background: colors.errorSoft,
    },
    warning: {
      icon: "warning" as const,
      foreground: colors.warning,
      background: colors.warningSoft,
    },
    info: {
      icon: "information-circle" as const,
      foreground: colors.info,
      background: colors.infoSoft,
    },
  }[tone];

  return (
    <View
      accessible
      accessibilityRole="alert"
      style={[styles.notice, { backgroundColor: config.background }]}
    >
      <Ionicons name={config.icon} size={18} color={config.foreground} />
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

export function ScreenErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorCard}>
      <View style={styles.errorIcon}>
        <Ionicons name="cloud-offline-outline" size={24} color={colors.error} />
      </View>
      <Text style={styles.errorTitle}>Couldn’t load this page</Text>
      <Text style={styles.errorBody}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export function EmptyPanel({
  icon = "sparkles-outline",
  title,
  body,
}: {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body?: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={22} color={colors.gold} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWrap: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  skeleton: {
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.lg,
  },
  skeletonLead: {
    height: 88,
  },
  skeletonRow: {
    height: 72,
  },
  notice: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  noticeText: {
    ...typography.footnote,
    color: colors.textPrimary,
    flex: 1,
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
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
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  retryText: {
    ...typography.bodyStrong,
    color: colors.textOnNavy,
  },
  pressed: {
    opacity: 0.8,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.goldSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    ...typography.footnote,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
