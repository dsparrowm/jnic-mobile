import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, ApiError, type MonthlySummaryRecord } from "@/src/lib/api";
import { EmptyState, Field, GhostButton, PrimaryButton } from "@/src/components/ui";
import { MonthPicker, StatusPill } from "@/src/components/premium/controls";
import { PremiumHeader, SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { BottomSheet } from "@/src/components/premium/bottom-sheet";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import { formatCount, formatMoney, humanizeStatus } from "@/src/lib/format";
import { colors, fonts, layout, radius, spacing, typography } from "@/src/theme/tokens";

function totalsPreview(totals: MonthlySummaryRecord["totals"]) {
  if (!totals) return null;
  const num = (key: string) => Number(totals[key] ?? 0) || 0;
  const attendance = num("adult") + num("teenage") + num("children");
  const income = num("tithe") + num("offering") + num("other");
  const currency = typeof totals.currency === "string" ? totals.currency : undefined;
  return { attendance, income, currency };
}

function TotalsPreview({ record }: { record: MonthlySummaryRecord }) {
  const preview = totalsPreview(record.totals);
  if (!preview) return null;
  return (
    <View style={styles.previewRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.previewLabel}>Attendance</Text>
        <Text style={styles.previewValue}>{formatCount(preview.attendance)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.previewLabel}>Income</Text>
        <Text style={styles.previewValue}>
          {formatMoney(preview.income, preview.currency)}
        </Text>
      </View>
    </View>
  );
}

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
  const [confirmItem, setConfirmItem] = useState<MonthlySummaryRecord | null>(null);
  const [returnItem, setReturnItem] = useState<MonthlySummaryRecord | null>(null);
  const [returnNote, setReturnNote] = useState("");
  const [returningId, setReturningId] = useState<string | null>(null);

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

  function openReturn(item: MonthlySummaryRecord) {
    setReturnNote("");
    setReturnItem(item);
  }

  function returnSummary(item: MonthlySummaryRecord) {
    const note = returnNote.trim();
    void (async () => {
      setReturningId(item.id);
      try {
        await api.returnMonthlySummary(item.id, note || undefined);
        setReturnItem(null);
        setReturnNote("");
        await load();
      } catch (err) {
        Alert.alert(
          "Error",
          err instanceof ApiError ? err.message : "Return failed",
        );
      } finally {
        setReturningId(null);
      }
    })();
  }

  function approve(item: MonthlySummaryRecord) {
    setConfirmItem(null);
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
              tintColor={colors.gold}
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
                <Text style={styles.cardPeriod}>
                  {MONTH_NAMES[item.month - 1]} {item.year}
                </Text>
              </View>
              <Text style={styles.cardMeta}>
                {item.scopeName ?? item.scopeType} summary
              </Text>
              <TotalsPreview record={item} />
              <View style={styles.actionPair}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Review & approve"
                    loading={approvingId === item.id}
                    onPress={() => setConfirmItem(item)}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Return for changes"
                  disabled={returningId === item.id}
                  onPress={() => openReturn(item)}
                  style={({ pressed }) => [
                    styles.returnBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.returnBtnText}>Return</Text>
                </Pressable>
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
                        label={humanizeStatus(item.status)}
                        tone={
                          item.status === "APPROVED"
                            ? "success"
                            : item.status === "RETURNED"
                              ? "danger"
                              : "warning"
                        }
                      />
                    </View>
                    {item.status === "RETURNED" && item.returnNote ? (
                      <Text style={styles.cardMeta}>“{item.returnNote}”</Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          }
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        />
      )}

      <BottomSheet
        visible={confirmItem !== null}
        onClose={() => setConfirmItem(null)}
      >
        {confirmItem ? (
          <>
            <SheetHeader
              title={`${MONTH_NAMES[confirmItem.month - 1]} ${confirmItem.year}`}
              subtitle={`${confirmItem.scopeName ?? confirmItem.scopeType} summary`}
              onClose={() => setConfirmItem(null)}
              closeDisabled={approvingId === confirmItem.id}
            />
            <SurfaceCard style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <TotalsPreview record={confirmItem} />
              {totalsPreview(confirmItem.totals) === null ? (
                <Text style={styles.cardMeta}>
                  Totals are not available for this summary yet.
                </Text>
              ) : null}
            </SurfaceCard>
            <PrimaryButton
              label="Approve summary"
              loading={approvingId === confirmItem.id}
              onPress={() => approve(confirmItem)}
            />
            <GhostButton
              label="Go back"
              disabled={approvingId === confirmItem.id}
              onPress={() => setConfirmItem(null)}
            />
          </>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={returnItem !== null}
        onClose={() => {
          if (!returningId) setReturnItem(null);
        }}
      >
        {returnItem ? (
          <>
            <SheetHeader
              title={`Return ${MONTH_NAMES[returnItem.month - 1]} ${returnItem.year}?`}
              subtitle="The summary goes back for rework — optionally with a note."
              onClose={() => setReturnItem(null)}
              closeDisabled={returningId === returnItem.id}
            />
            <Field
              label="Reason (optional)"
              placeholder="e.g. Figures look low for a revival month…"
              value={returnNote}
              onChangeText={setReturnNote}
              multiline
              numberOfLines={3}
              style={{ minHeight: 72, textAlignVertical: "top" }}
            />
            <PrimaryButton
              label="Return for changes"
              tone="danger"
              loading={returningId === returnItem.id}
              onPress={() => returnSummary(returnItem)}
            />
            <GhostButton
              label="Go back"
              disabled={returningId === returnItem.id}
              onPress={() => setReturnItem(null)}
            />
          </>
        ) : null}
      </BottomSheet>
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
    color: colors.textPrimary,
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
  cardPeriod: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
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
    color: colors.textPrimary,
    fontWeight: "600",
  },
  actionPair: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  returnBtn: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.error,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  returnBtnText: {
    ...typography.bodyStrong,
    color: colors.error,
  },
  previewRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  previewLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  previewValue: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
    color: colors.textPrimary,
    marginTop: 2,
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
