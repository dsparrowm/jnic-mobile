import { useCallback } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import type { NotificationRecord } from "@repo/types";
import { PremiumHeader } from "@/src/components/premium/screen";
import { ScreenErrorState, ScreenSkeleton } from "@/src/components/premium/states";
import { GhostButton } from "@/src/components/ui";
import { useNotifications } from "@/src/hooks/use-notifications";
import { openNotificationTarget } from "@/src/lib/notifications";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationRecord;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.dot, !item.readAt && styles.dotUnread]} />
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, !item.readAt && styles.titleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.time}>{formatNotificationTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.body} numberOfLines={3}>
          {item.body}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    items,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh,
    retry,
    markRead,
  } = useNotifications();

  const handlePress = useCallback(
    async (item: NotificationRecord) => {
      await markRead(item.id);
      openNotificationTarget(item, (href) => router.navigate(href as never));
    },
    [markRead, router],
  );

  return (
    <View style={styles.root}>
      <PremiumHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread`
            : "Feedback and report updates"
        }
        icon="notifications-outline"
        tone="light"
      />
      <View style={styles.toolbar}>
        <GhostButton label="Back" onPress={() => router.back()} />
      </View>

      {loading && items.length === 0 ? <ScreenSkeleton /> : null}
      {error && items.length === 0 ? (
        <ScreenErrorState message={error} onRetry={() => void retry()} />
      ) : null}

      {!loading || items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              tintColor={colors.gold}
              colors={[colors.gold]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyBody}>
                Feedback, forwarding updates, and report reminders will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => void handlePress(item)}
            />
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: layout.screenPad,
  },
  toolbar: {
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  rowPressed: {
    opacity: 0.9,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: 6,
  },
  dotUnread: {
    backgroundColor: colors.gold,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textMuted,
  },
  titleUnread: {
    color: colors.textPrimary,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  body: {
    ...typography.footnote,
    color: colors.textMuted,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    ...typography.title3,
    color: colors.navy,
  },
  emptyBody: {
    ...typography.footnote,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
