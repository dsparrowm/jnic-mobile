import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, typography } from "@/src/theme/tokens";

export function NotificationBell({
  unreadCount,
  onPress,
  tone = "light",
}: {
  unreadCount: number;
  onPress: () => void;
  tone?: "light" | "navy";
}) {
  const onNavy = tone === "navy";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        onNavy ? styles.buttonNavy : styles.buttonLight,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={unreadCount > 0 ? "notifications" : "notifications-outline"}
        size={22}
        color={onNavy ? colors.gold : colors.navy}
      />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLight: {
    backgroundColor: colors.bgSurface,
  },
  buttonNavy: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  pressed: {
    opacity: 0.85,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    color: colors.navy,
  },
});
