import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyPanel } from "@/src/components/premium/states";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

export function ScreenTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screenTitle, { paddingTop: insets.top + 6 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.screenTitleText}>{title}</Text>
        {subtitle ? <Text style={styles.screenTitleSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Screen({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  return (
    <View
      style={[
        styles.screen,
        padded && { paddingHorizontal: layout.screenPad },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Overline({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <Text style={[styles.overline, light && { color: colors.textOnNavyMuted }]}>
      {children}
    </Text>
  );
}

export function Field({
  label,
  style,
  onFocus,
  onBlur,
  tone = "default",
  ...props
}: TextInputProps & { label: string; tone?: "default" | "onNavy" }) {
  const [focused, setFocused] = useState(false);
  const onNavy = tone === "onNavy";
  return (
    <View style={styles.field}>
      {label ? (
        <Text style={[styles.fieldLabel, onNavy && styles.fieldLabelOnNavy]}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={onNavy ? colors.textOnNavyMuted : colors.textMuted}
        style={[
          styles.fieldInput,
          onNavy && styles.fieldInputOnNavy,
          focused && (onNavy ? styles.fieldInputOnNavyFocused : styles.fieldInputFocused),
          style,
        ]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
        accessibilityLabel={props.accessibilityLabel ?? label}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  tone = "gold",
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: "gold" | "navy" | "danger";
}) {
  const bg =
    tone === "navy" ? colors.navy : tone === "danger" ? colors.error : colors.gold;
  const fg = tone === "gold" ? colors.goldForeground : colors.textOnNavy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: bg },
        (disabled || loading) && { opacity: 0.45 },
        pressed && !disabled && { opacity: 0.88, transform: [{ scale: 0.985 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.primaryBtnText, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.ghostBtn,
        pressed && { backgroundColor: colors.bgSubtle },
      ]}
    >
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(active) }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.chipRow}
    >
      {children}
    </ScrollView>
  );
}

export function ListRow({
  title,
  subtitle,
  meta,
  onPress,
  trailing,
  first,
  last,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.listRow,
        first && styles.listRowFirst,
        last && styles.listRowLast,
        !last && styles.listRowDivider,
        pressed && onPress && { backgroundColor: colors.bgSubtle },
      ]}
    >
      <View style={styles.listRowBody}>
        <Text style={styles.listRowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.listRowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text style={styles.listRowMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

export function Group({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return <EmptyPanel title={title} body={body} />;
}

export function Avatar({
  name,
  imageUri,
  size = 48,
}: {
  name?: string | null;
  imageUri?: string | null;
  size?: number;
}) {
  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";
  return (
    <View
      accessibilityLabel={`${name || "User"} profile picture`}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initials}</Text>
      )}
    </View>
  );
}

export function StatusDot({ color }: { color: string }) {
  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  screenTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  screenTitleText: {
    ...typography.title1,
    color: colors.navy,
  },
  screenTitleSub: {
    ...typography.footnote,
    color: colors.textMuted,
    marginTop: 2,
  },
  overline: {
    ...typography.overline,
    color: colors.textMuted,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  fieldInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  fieldInputFocused: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.gold,
  },
  fieldLabelOnNavy: {
    color: colors.textOnNavyMuted,
  },
  fieldInputOnNavy: {
    color: colors.textOnNavy,
    backgroundColor: colors.navyMuted,
    borderColor: colors.goldBorder,
  },
  fieldInputOnNavyFocused: {
    backgroundColor: colors.navyMuted,
    borderColor: colors.gold,
  },
  primaryBtn: {
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  primaryBtnText: {
    ...typography.bodyStrong,
  },
  ghostBtn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  ghostBtnText: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  chipScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 4,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    flexGrow: 0,
    alignSelf: "center",
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.textOnNavy,
  },
  group: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.bgSurface,
  },
  listRowFirst: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  listRowLast: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  listRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  listRowBody: {
    flex: 1,
    minWidth: 0,
  },
  listRowTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  listRowSubtitle: {
    ...typography.footnote,
    color: colors.textMuted,
    marginTop: 2,
  },
  listRowMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    ...typography.callout,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  avatar: {
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarText: {
    color: colors.gold,
    fontWeight: "700",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
