import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api, ApiError, type QuarterlyCouncilResponse } from "@/src/lib/api";
import { SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { EmptyPanel, InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { StatusPill } from "@/src/components/premium/controls";
import { WeeklyStackBar } from "@/src/components/weekly/stack-bar";
import { formatCount, formatMoney, humanizeStatus } from "@/src/lib/format";
import { colors, spacing, typography } from "@/src/theme/tokens";

const QUARTERS = [1, 2, 3, 4];

export default function CouncilScreen() {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<QuarterlyCouncilResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api.getQuarterlyCouncil(quarter, year));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load council view",
      );
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [quarter, year]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const n = (k: string) => Number(data?.totals?.[k] ?? 0) || 0;
  const income = n("tithe") + n("offering") + n("other");
  const people = n("men") + n("women") + n("youth") + n("children");
  const currency =
    typeof data?.totals?.currency === "string" ? data.totals.currency : "NGN";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <WeeklyStackBar
        title="Quarterly council"
        subtitle="B5 assembled view · Senior Pastor and council"
      />

      <View style={styles.quarterRow}>
        {QUARTERS.map((q) => (
          <Pressable
            key={q}
            onPress={() => setQuarter(q)}
            style={[styles.quarterChip, q === quarter && styles.quarterChipActive]}
          >
            <Text
              style={[
                styles.quarterChipText,
                q === quarter && styles.quarterChipTextActive,
              ]}
            >
              Q{q}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setYear((y) => y - 1)}
          style={styles.quarterChip}
        >
          <Text style={styles.quarterChipText}>{year - 1}</Text>
        </Pressable>
        <Text style={styles.yearLabel}>{year}</Text>
        <Pressable
          onPress={() => setYear((y) => y + 1)}
          style={styles.quarterChip}
        >
          <Text style={styles.quarterChipText}>{year + 1}</Text>
        </Pressable>
      </View>

      {error ? <InlineNotice message={error} /> : null}

      {loading && !data ? (
        <ScreenSkeleton rows={4} />
      ) : !data ? (
        <EmptyPanel
          icon="albums-outline"
          title="No council data"
          body="Nothing has rolled up for this quarter yet."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.gold}
            />
          }
        >
          <SurfaceCard style={styles.card}>
            <Text style={styles.cardTitle}>{data.label} totals</Text>
            <View style={styles.statRow}>
              <Stat label="Attendance" value={formatCount(people)} />
              <Stat label="Visitors" value={formatCount(n("visitors"))} />
              <Stat label="Converts" value={formatCount(n("converts"))} />
              <Stat label="New churches" value={formatCount(n("newChurches"))} />
              <Stat label="Income" value={formatMoney(income, currency)} />
            </View>
          </SurfaceCard>

          {data.months.length > 0 ? (
            <>
              <SectionHeader title="Months" />
              <SurfaceCard style={styles.card}>
                {data.months.map((m, i) => {
                  const t = m.totals as Record<string, unknown>;
                  const mn = (k: string) => Number(t[k] ?? 0) || 0;
                  return (
                    <View
                      key={m.month}
                      style={[styles.monthRow, i > 0 && styles.monthDivider]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.monthName}>{m.monthLabel}</Text>
                        <Text style={styles.monthMeta}>
                          {formatCount(mn("men") + mn("women") + mn("youth") + mn("children"))} attendance
                          {m.filing.filed
                            ? ` · filed by ${m.filing.filedByName ?? "scope pastor"}`
                            : " · B4 not filed"}
                        </Text>
                      </View>
                      <StatusPill
                        label={humanizeStatus(m.status)}
                        tone={m.status === "APPROVED" ? "success" : "warning"}
                      />
                    </View>
                  );
                })}
              </SurfaceCard>
            </>
          ) : null}

          <SectionHeader title="Territory filings" />
          <SurfaceCard style={styles.card}>
            {data.territoryFilings.length === 0 ? (
              <Text style={styles.monthMeta}>No territory summaries yet.</Text>
            ) : (
              data.territoryFilings.map((f, i) => (
                <View
                  key={`${f.scopeType}-${f.scopeId}`}
                  style={[styles.monthRow, i > 0 && styles.monthDivider]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.monthName}>{f.scopeName}</Text>
                    <Text style={styles.monthMeta}>
                      {f.filed
                        ? `Filed by ${f.filedByName ?? "scope pastor"}`
                        : "Awaiting filing"}
                    </Text>
                  </View>
                  <Ionicons
                    name={f.filed ? "checkmark-circle" : "time-outline"}
                    size={18}
                    color={f.filed ? colors.success : colors.textMuted}
                  />
                </View>
              ))
            )}
          </SurfaceCard>

          <SectionHeader title="Directorate reports" />
          <SurfaceCard style={styles.card}>
            {data.directorateReports.length === 0 ? (
              <Text style={styles.monthMeta}>
                No directorate reports this quarter.
              </Text>
            ) : (
              data.directorateReports.map((d, i) => (
                <View
                  key={d.directorateId}
                  style={[styles.monthRow, i > 0 && styles.monthDivider]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.monthName}>{d.name}</Text>
                    <Text style={styles.monthMeta}>
                      {d.submitted} submitted · {d.reviewed} reviewed
                    </Text>
                  </View>
                </View>
              ))
            )}
          </SurfaceCard>
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  quarterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  quarterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  quarterChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  quarterChipText: { ...typography.caption, color: colors.textMuted },
  quarterChipTextActive: { color: colors.goldForeground, fontWeight: "700" },
  yearLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { padding: spacing.md, gap: spacing.sm },
  cardTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  stat: { minWidth: 90, gap: 2 },
  statValue: { ...typography.title3, color: colors.textPrimary },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  monthRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  monthDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle },
  monthName: { ...typography.body, color: colors.textPrimary },
  monthMeta: { ...typography.footnote, color: colors.textMuted, marginTop: 1 },
});
