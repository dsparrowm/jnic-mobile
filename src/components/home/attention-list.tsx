import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  HqHomeTask,
  HqHomeTaskKind,
  HqHomeTaskSeverity,
} from "@repo/types";
import { colors, fonts, radius, spacing, typography } from "@/src/theme/tokens";

const severityTone: Record<
  HqHomeTaskSeverity,
  { foreground: string; background: string; label: string }
> = {
  INFO: {
    foreground: colors.info,
    background: colors.infoSoft,
    label: "Review",
  },
  WARNING: {
    foreground: colors.warning,
    background: colors.warningSoft,
    label: "Pending",
  },
  URGENT: {
    foreground: colors.error,
    background: colors.errorSoft,
    label: "Urgent",
  },
};

export function AttentionList({
  tasks,
  onTaskPress,
}: {
  tasks: HqHomeTask[];
  onTaskPress: (kind: HqHomeTaskKind) => void;
}) {
  return (
    <View>
      <View style={styles.sectionRow}>
        <Text style={styles.section}>Needs attention</Text>
        {tasks.length > 0 ? (
          <Text style={styles.sectionMeta}>
            {tasks.length} {tasks.length === 1 ? "item" : "items"}
          </Text>
        ) : null}
      </View>
      {tasks.length === 0 ? (
        <View style={styles.clear}>
          <View style={styles.clearIcon}>
            <Ionicons name="checkmark" size={18} color={colors.success} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>You’re all caught up</Text>
            <Text style={styles.description}>
              There are no urgent HQ actions right now.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.list}>
          {tasks.map((task, index) => {
            const tone = severityTone[task.severity];
            return (
              <Pressable
                key={task.kind}
                accessibilityRole="button"
                accessibilityLabel={`${task.title}, ${task.count}. ${task.description}`}
                onPress={() => onTaskPress(task.kind)}
                style={({ pressed }) => [
                  styles.row,
                  index < tasks.length - 1 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.num}>{task.count}</Text>
                <View style={styles.copy}>
                  <Text style={styles.title}>{task.title}</Text>
                  <Text style={styles.description} numberOfLines={2}>
                    {task.description}
                  </Text>
                </View>
                <View
                  style={[styles.sevTag, { backgroundColor: tone.background }]}
                >
                  <Text style={[styles.sevText, { color: tone.foreground }]}>
                    {tone.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  section: {
    ...typography.overline,
    letterSpacing: 1.6,
    color: colors.textMuted,
  },
  sectionMeta: {
    ...typography.caption,
    fontFamily: fonts.display,
    color: colors.textMuted,
  },
  list: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  pressed: {
    opacity: 0.75,
  },
  num: {
    minWidth: 28,
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "right",
    color: colors.gold,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  sevTag: {
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  sevText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  clear: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  clearIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
