import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, ApiError, type MonthlySummaryRecord } from "@/src/lib/api";
import { EmptyState } from "@/src/components/ui";
import { MonthPicker, StatusPill } from "@/src/components/premium/controls";
import { PremiumHeader } from "@/src/components/premium/screen";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function SummariesScreen() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [items, setItems] = useState<MonthlySummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.listMonthlySummaries(month, year);
      setItems(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load summaries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, year]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  }

  return (
    <View style={styles.root}>
      <PremiumHeader
        title="Summaries"
        subtitle="National monthly rollups"
        icon="stats-chart"
        right={<StatusPill label={`${items.length} scopes`} tone="warning" />}
      />
      <MonthPicker
        month={month}
        year={year}
        monthNames={MONTH_NAMES}
        onPrevious={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
      />

      {error ? <InlineNotice message={error} /> : null}

      {loading ? (
        <ScreenSkeleton rows={4} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.navy}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No summaries"
              body="Nothing rolled up for this month yet."
            />
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
              ]}
            >
              <View style={styles.rowTop}>
                <Text style={styles.cardTitle}>
                  {item.scopeName ?? item.scopeType}
                </Text>
                <StatusPill
                  label={item.status.replace(/_/g, " ")}
                  tone={item.status === "APPROVED" ? "success" : "warning"}
                />
              </View>
              <Text style={styles.cardMeta}>
                {MONTH_NAMES[item.month - 1]} {item.year} · Updated rollup
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingVertical: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: layout.screenPad,
    paddingTop: spacing.xs,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  monthCenter: { alignItems: "center" },
  monthLabel: {
    ...typography.title3,
    color: colors.navy,
  },
  yearLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  monthBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  monthBtnText: {
    fontSize: 22,
    color: colors.navy,
    fontWeight: "600",
  },
  row: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowTop: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowFirst: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  rowLast: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.footnote,
    marginTop: 4,
    color: colors.textMuted,
  },
  error: {
    ...typography.footnote,
    color: colors.error,
    marginBottom: spacing.sm,
  },
});
