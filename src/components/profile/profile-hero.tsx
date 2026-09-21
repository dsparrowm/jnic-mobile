import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { formatRole } from "@/src/lib/format";
import type { AuthUser } from "@/src/lib/api";
import { Avatar } from "@/src/components/ui";
import { StatusPill } from "@/src/components/premium/controls";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

export function ProfileHero({
  user,
  title,
  meta,
  topInset,
  imageUri,
  uploading,
  onPhotoPress,
}: {
  user: AuthUser | null;
  title: string;
  meta: string;
  topInset: number;
  imageUri?: string | null;
  uploading?: boolean;
  onPhotoPress: () => void;
}) {
  return (
    <View style={[styles.hero, { paddingTop: topInset + spacing.md }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        onPress={onPhotoPress}
        disabled={uploading}
        style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
      >
        <Avatar
          name={user?.name}
          imageUri={imageUri ?? user?.profilePicUrl}
          size={80}
        />
        <View style={styles.cameraBadge}>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.navy} />
          ) : (
            <Ionicons name="camera" size={14} color={colors.navy} />
          )}
        </View>
      </Pressable>

      <Text style={styles.name} numberOfLines={2}>
        {user?.name ?? "Pastor"}
      </Text>
      <StatusPill label={formatRole(user?.role)} tone="warning" />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {meta ? (
        <Text style={styles.meta} numberOfLines={2}>
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    backgroundColor: colors.bgBase,
    paddingHorizontal: layout.screenPad,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  avatarWrap: {
    marginBottom: spacing.sm,
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bgBase,
  },
  name: {
    ...typography.title2,
    color: colors.navy,
    textAlign: "center",
  },
  title: {
    ...typography.callout,
    color: colors.navy,
    fontWeight: "600",
    marginTop: spacing.xs,
    textAlign: "center",
  },
  meta: {
    ...typography.footnote,
    color: colors.textMuted,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.9,
  },
});
