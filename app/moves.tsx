import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  api,
  ApiError,
  type PersonnelMoveRecord,
} from "@/src/lib/api";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { SurfaceCard } from "@/src/components/premium/screen";
import { StatusPill } from "@/src/components/premium/controls";
import { WeeklyStackBar } from "@/src/components/weekly/stack-bar";
import { colors, layout, spacing, typography } from "@/src/theme/tokens";

const KIND_META: Record<
  PersonnelMoveRecord["kind"],
  { label: string; tone: "info" | "warning" | "success" | "neutral" }
> = {
  TERRITORY: { label: "Territory", tone: "info" },
  SEAT: { label: "Directorate seat", tone: "warning" },
  UNIT: { label: "Unit", tone: "success" },
  STATUS: { label: "Status", tone: "neutral" },
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MovesScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [moves, setMoves] = useState<PersonnelMoveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setMoves(await api.listUserMoves(id));
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to load move history",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <View style={styles.root}>
      <WeeklyStackBar
        title="Move history"
        subtitle={name ? `${name} — every posted move` : undefined}
      />
      {error ? <InlineNotice message={error} /> : null}
      {loading ? (
        <ScreenSkeleton rows={5} />
      ) : moves.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No moves yet</Text>
          <Text style={styles.emptyBody}>
            Transfers, seat changes and status changes will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <SurfaceCard style={styles.flushCard}>
            {moves.map((m, idx) => {
              const meta = KIND_META[m.kind];
              return (
                <View
                  key={m.id}
                  style={[styles.moveRow, idx > 0 && styles.rowDivider]}
                >
                  <StatusPill label={meta.label} tone={meta.tone} />
                  <Text style={styles.summary}>{m.summary}</Text>
                  {m.note ? <Text style={styles.note}>{m.note}</Text> : null}
                  <Text style={styles.meta}>
                    {`by ${m.actor.name} · ${formatWhen(m.createdAt)}`}
                  </Text>
                </View>
              );
            })}
          </SurfaceCard>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  body: {
    paddingHorizontal: layout.screenPad,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  flushCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  moveRow: { paddingVertical: spacing.sm, gap: spacing.xs },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  summary: { ...typography.body, color: colors.textPrimary },
  note: { ...typography.caption, color: colors.textMuted, fontStyle: "italic" },
  meta: { ...typography.caption, color: colors.textMuted },
  empty: {
    padding: layout.screenPad,
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.title3, color: colors.textPrimary },
  emptyBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
