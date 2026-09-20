import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, ApiError, type MonthlySummaryRecord } from "@/src/lib/api";
import { EmptyState, PrimaryButton } from "@/src/components/ui";
import { MonthPicker, StatusPill } from "@/src/components/premium/controls";
import { PremiumHeader, SectionHeader } from "@/src/components/premium/screen";
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

export default function ApprovalsScreen() {
  const now = new Date();
  const [pending, setPending] = useState<MonthlySummaryRecord[]>([]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summaries, setSummaries] = useState<MonthlySummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [pendingRes, listRes] = await Promise.all([
        api.listPendingMonthlyApprovals(),
        api.listMonthlySummaries(month, year),
      ]);
      setPending(pendingRes.items);
      setSummaries(listRes.items);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load summaries",
      );
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

  function approve(item: MonthlySummaryRecord) {
    Alert.alert(
      "Approve national summary?",
      `${MONTH_NAMES[item.month - 1]} ${item.year} — ${item.scopeName ?? item.scopeType}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => {
            void (async () => {
              setApprovingId(item.id);
              try {
                await api.approveMonthlySummary(item.id);
                await load();
              } catch (err) {
                Alert.alert(
                  "Error",
                  err instanceof ApiError ? err.message : "Approve failed",
                );
              } finally {
                setApprovingId(null);
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <PremiumHeader
        title="Approvals"
        subtitle="National monthly summaries waiting for sign-off"
        icon="checkmark-done"
        right={<StatusPill label={`${pending.length} pending`} tone={pending.length ? "warning" : "success"} />}
      />

      {error ? <InlineNotice message={error} /> : null}

      {loading ? (
        <ScreenSkeleton rows={4} />
      ) : (
        <FlatList
          data={pending}
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
          ListHeaderComponent={
            <View>
              <SectionHeader title="Pending decisions" meta={`${pending.length}`} />
              {pending.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <EmptyState
                    title="All clear"
                    body="Nothing waiting for approval right now."
                  />
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>
                  {MONTH_NAMES[item.month - 1]} {item.year}
                </Text>
                <StatusPill label="Needs sign-off" tone="warning" />
              </View>
              <Text style={styles.cardMeta}>
                {item.scopeName ?? item.scopeType} summary
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <PrimaryButton
                  label="Approve"
                  loading={approvingId === item.id}
                  onPress={() => approve(item)}
                />
              </View>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.history}>
              <SectionHeader title="Monthly history" />
              <MonthPicker
                month={month}
                year={year}
                monthNames={MONTH_NAMES}
                onPrevious={() => shiftMonth(-1)}
                onNext={() => shiftMonth(1)}
              />
              {summaries.length === 0 ? (
                <Text style={styles.emptyLine}>No summaries for this month.</Text>
              ) : (
                summaries.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.mutedRow,
                      index === 0 && styles.rowFirst,
                      index === summaries.length - 1 && styles.rowLast,
                      index !== summaries.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle}>
                        {item.scopeName ?? item.scopeType}
                      </Text>
                      <StatusPill
                        label={item.status.replace(/_/g, " ")}
                        tone={item.status === "APPROVED" ? "success" : "warning"}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          }
          contentContainerStyle={{ paddingBottom: spacing.xl }}
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
  history: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sub: {
    ...typography.callout,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  section: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  cardTop: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionInline: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldSoft,
  },
  mutedRow: {
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
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
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  monthBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  monthBtnText: {
    fontSize: 22,
    color: colors.navy,
    fontWeight: "600",
  },
  emptyWrap: { marginBottom: spacing.md },
  emptyLine: {
    ...typography.footnote,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  error: {
    ...typography.footnote,
    color: colors.error,
    marginBottom: spacing.sm,
  },
});
