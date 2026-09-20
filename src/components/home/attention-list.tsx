import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  HqHomeTask,
  HqHomeTaskKind,
  HqHomeTaskSeverity,
} from "@repo/types";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

const severityTone: Record<
  HqHomeTaskSeverity,
  { foreground: string; background: string }
> = {
  INFO: { foreground: colors.info, background: colors.infoSoft },
  WARNING: { foreground: colors.warning, background: colors.warningSoft },
  URGENT: { foreground: colors.error, background: colors.errorSoft },
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
      <Text style={styles.section}>Needs attention</Text>
      <View style={styles.list}>
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
          tasks.map((task, index) => {
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
                <View style={[styles.taskIcon, { backgroundColor: tone.background }]}>
                  <Ionicons
                    name={task.severity === "URGENT" ? "alert" : "time"}
                    size={17}
                    color={tone.foreground}
                  />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.title}>{task.title}</Text>
                  <Text style={styles.description} numberOfLines={2}>
                    {task.description}
                  </Text>
                </View>
                <View style={[styles.count, { backgroundColor: tone.background }]}>
                  <Text style={[styles.countText, { color: tone.foreground }]}>
                    {task.count}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  list: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  row: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  pressed: {
    backgroundColor: colors.bgSubtle,
  },
  taskIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
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
  count: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    ...typography.caption,
    fontWeight: "700",
  },
  clear: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
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
