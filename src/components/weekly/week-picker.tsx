import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatWeekEndingLabel, shiftWeekOf } from "@repo/types";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export function WeekPicker({
  weekOf,
  onChange,
}: {
  weekOf: string;
  onChange: (weekOf: string) => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous week"
        onPress={() => onChange(shiftWeekOf(weekOf, -1))}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={20} color={colors.navy} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.kicker}>Week ending</Text>
        <Text style={styles.label}>{formatWeekEndingLabel(weekOf)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next week"
        onPress={() => onChange(shiftWeekOf(weekOf, 1))}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.navy} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
  copy: {
    flex: 1,
    alignItems: "center",
  },
  kicker: {
    ...typography.caption,
    color: colors.textMuted,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.navy,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});
