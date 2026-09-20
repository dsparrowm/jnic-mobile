import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "info" | "danger" | "neutral";
}) {
  const config = {
    success: { foreground: colors.success, background: colors.successSoft },
    warning: { foreground: colors.warning, background: colors.warningSoft },
    info: { foreground: colors.info, background: colors.infoSoft },
    danger: { foreground: colors.error, background: colors.errorSoft },
    neutral: { foreground: colors.textMuted, background: colors.bgSubtle },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: config.background }]}>
      <Text style={[styles.pillText, { color: config.foreground }]}>{label}</Text>
    </View>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        style={styles.searchInput}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText("")}
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function MonthPicker({
  month,
  year,
  monthNames,
  onPrevious,
  onNext,
}: {
  month: number;
  year: number;
  monthNames: string[];
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.month}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        onPress={onPrevious}
        style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={20} color={colors.navy} />
      </Pressable>
      <View style={styles.monthCopy}>
        <Text style={styles.monthLabel}>{monthNames[month - 1]}</Text>
        <Text style={styles.yearLabel}>{year}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next month"
        onPress={onNext}
        style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.navy} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 26,
    alignSelf: "flex-start",
    justifyContent: "center",
    borderRadius: radius.full,
    paddingHorizontal: 9,
  },
  pillText: {
    ...typography.caption,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  search: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  searchInput: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
  },
  month: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  monthCopy: {
    alignItems: "center",
  },
  monthLabel: {
    ...typography.title3,
    color: colors.navy,
  },
  yearLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
