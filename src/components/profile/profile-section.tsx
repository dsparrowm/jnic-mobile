import type { ReactNode } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SurfaceCard } from "@/src/components/premium/screen";
import { colors, spacing, typography } from "@/src/theme/tokens";

export function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{title}</Text>
      <SurfaceCard style={styles.card}>{children}</SurfaceCard>
    </View>
  );
}

export function ProfileInfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && styles.lastRow]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function ProfileLinkRow({
  label,
  onPress,
  destructive = false,
  last = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkRow,
        last && styles.lastRow,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.linkLabel, destructive && styles.destructive]}>
        {label}
      </Text>
      {!destructive ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  label: {
    ...typography.overline,
    color: colors.textMuted,
  },
  card: {
    padding: 0,
    overflow: "hidden",
  },
  infoRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    gap: 2,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  infoValue: {
    ...typography.callout,
    color: colors.navy,
  },
  linkRow: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  linkLabel: {
    ...typography.callout,
    color: colors.navy,
    fontWeight: "600",
  },
  destructive: {
    color: colors.error,
  },
  pressed: {
    opacity: 0.85,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
