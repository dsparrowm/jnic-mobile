import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NotificationRecord } from "@repo/types";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

function formatActivityDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function RecentActivity({
  items,
  unreadCount,
  onItemPress,
  onSeeAllPress,
}: {
  items: NotificationRecord[];
  unreadCount: number;
  onItemPress?: (item: NotificationRecord) => void;
  onSeeAllPress?: () => void;
}) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.section}>Recent activity</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 ? (
            <Text style={styles.unread}>{unreadCount} unread</Text>
          ) : null}
          {onSeeAllPress ? (
            <Pressable
              accessibilityRole="button"
              onPress={onSeeAllPress}
              hitSlop={8}
            >
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.card}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-outline" size={20} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No recent activity</Text>
            <Text style={styles.emptyBody}>
              Feedback and report forwarding updates will appear here.
            </Text>
          </View>
        ) : (
          items.map((item, index) => {
            const row = (
              <>
                <View style={styles.timeline}>
                  <View style={[styles.dot, !item.readAt && styles.dotUnread]} />
                  {index < items.length - 1 ? <View style={styles.line} /> : null}
                </View>
                <View style={styles.copy}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.date}>{formatActivityDate(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.body} numberOfLines={2}>
                    {item.body}
                  </Text>
                </View>
              </>
            );
            return onItemPress ? (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.readAt ? "" : "Unread. "}${item.title}. ${item.body}`}
                onPress={() => onItemPress(item)}
                style={({ pressed }) => [
                  styles.row,
                  index < items.length - 1 && styles.divider,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {row}
              </Pressable>
            ) : (
              <View
                key={item.id}
                accessible
                accessibilityLabel={`${item.readAt ? "" : "Unread. "}${item.title}. ${item.body}`}
                style={[styles.row, index < items.length - 1 && styles.divider]}
              >
                {row}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  seeAll: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: "700",
  },
  section: {
    ...typography.overline,
    color: colors.textMuted,
  },
  unread: {
    ...typography.caption,
    color: colors.info,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  row: {
    minHeight: 70,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  timeline: {
    width: 22,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: 5,
  },
  dotUnread: {
    backgroundColor: colors.gold,
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: colors.borderSubtle,
    marginTop: 4,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
  },
  body: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  empty: {
    alignItems: "center",
    padding: spacing.lg,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
});
