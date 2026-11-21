import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Role } from "@repo/types";
import {
  api,
  ApiError,
  type MonthlySummaryRecord,
} from "@/src/lib/api";
import { useAuth } from "@/src/lib/session";
import { isHqUser } from "@/src/lib/auth";
import { showAppAlert } from "@/src/components/premium/app-alert";
import { EmptyState, Field, GhostButton, PrimaryButton } from "@/src/components/ui";
import { BottomSheet } from "@/src/components/premium/bottom-sheet";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import { MonthPicker, StatusPill } from "@/src/components/premium/controls";
import { PremiumHeader } from "@/src/components/premium/screen";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { formatCount, formatMoney, humanizeStatus } from "@/src/lib/format";
import { colors, fonts, layout, radius, spacing, typography } from "@/src/theme/tokens";

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
  const router = useRouter();
  const { user } = useAuth();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [items, setItems] = useState<MonthlySummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filing, setFiling] = useState<MonthlySummaryRecord | null>(null);
  const [newChurches, setNewChurches] = useState("");
  const [welfareNote, setWelfareNote] = useState("");
  const [plansNote, setPlansNote] = useState("");
  const [saving, setSaving] = useState(false);

  function canFile(item: MonthlySummaryRecord): boolean {
    if (!user) return false;
    if (item.filing?.filedAt || item.status === "APPROVED") return false;
    if (item.scopeType === "ZONE") {
      return user.role === Role.ZONAL_PASTOR && user.zoneId === item.scopeId;
    }
    if (item.scopeType === "STATE") {
      return user.role === Role.STATE_PASTOR && user.stateId === item.scopeId;
    }
    if (item.scopeType === "REGION") {
      return user.role === Role.REGIONAL_PASTOR && user.regionId === item.scopeId;
    }
    if (item.scopeType === "HQ") return isHqUser(user);
    return false;
  }

  function openFiling(item: MonthlySummaryRecord) {
    setFiling(item);
    setNewChurches(
      item.filing?.newChurches ? String(item.filing.newChurches) : "",
    );
    setWelfareNote(item.filing?.welfareNote ?? "");
    setPlansNote(item.filing?.plansNote ?? "");
  }

  async function sendFiling() {
    if (!filing) return;
    setSaving(true);
    try {
      await api.fileMonthlySummary(filing.id, {
        newChurches: newChurches.trim() ? Number(newChurches.trim()) : undefined,
        welfareNote: welfareNote.trim() || undefined,
        plansNote: plansNote.trim() || undefined,
      });
      setFiling(null);
      await load();
    } catch (err) {
      void showAppAlert(
        "Could not file",
        err instanceof ApiError ? err.message : "Check your entries and retry.",
      );
    } finally {
      setSaving(false);
    }
  }

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
        right={
          isHqUser(user) ? (
            <Pressable
              onPress={() => router.push("/council" as never)}
              style={styles.councilLink}
            >
              <Text style={styles.councilLinkText}>Council</Text>
            </Pressable>
          ) : (
            <StatusPill label={`${items.length} scopes`} tone="info" />
          )
        }
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
              tintColor={colors.gold}
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
                  label={humanizeStatus(item.status)}
                  tone={item.status === "APPROVED" ? "success" : "warning"}
                />
              </View>
              <Text style={styles.cardMeta}>
                {MONTH_NAMES[item.month - 1]} {item.year}
                {item.reportingRate != null
                  ? ` · ${item.reportingRate}% branches filed`
                  : ""}
              </Text>
              {item.scopeType !== "BRANCH" ? (
                <Text style={styles.filingLine}>
                  {item.filing?.filedAt
                    ? `B4 filed by ${item.filing.filedByName ?? "scope pastor"}`
                    : "B4 not filed"}
                </Text>
              ) : null}
              {(() => {
                const t = item.totals;
                if (!t) return null;
                const n = (k: string) => Number(t[k] ?? 0) || 0;
                const people = n("adult") + n("teenage") + n("children") + n("men") + n("women") + n("youth");
                const income = n("tithe") + n("offering") + n("other");
                return (
                  <Text style={styles.cardFigures}>
                    {people > 0 ? `${formatCount(people)} attendance` : ""}
                    {people > 0 && income > 0 ? " · " : ""}
                    {income > 0
                      ? formatMoney(income, typeof t.currency === "string" ? t.currency : undefined)
                      : ""}
                  </Text>
                );
              })()}
              {canFile(item) ? (
                <Pressable
                  onPress={() => openFiling(item)}
                  style={styles.fileBtn}
                >
                  <Text style={styles.fileBtnText}>File B4</Text>
                </Pressable>
              ) : null}
            </View>
          )}
          contentContainerStyle={{ paddingVertical: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm }}
        />
      )}

      <BottomSheet
        visible={!!filing}
        onClose={() => setFiling(null)}
        scrollable
      >
        {filing ? (
          <View style={styles.filingSheet}>
            <SheetHeader
              title="File B4 report"
              subtitle={`${filing.scopeName ?? filing.scopeType} · ${MONTH_NAMES[filing.month - 1]} ${filing.year}`}
              onClose={() => setFiling(null)}
            />
            <Field
              label="New churches planted"
              value={newChurches}
              onChangeText={setNewChurches}
              keyboardType="number-pad"
              placeholder="0"
            />
            <Field
              label="Welfare notes"
              value={welfareNote}
              onChangeText={setWelfareNote}
              multiline
              placeholder="Pastoral care, welfare concerns…"
            />
            <Field
              label="Plans for next month"
              value={plansNote}
              onChangeText={setPlansNote}
              multiline
              placeholder="Outreaches, openings, initiatives…"
            />
            <PrimaryButton
              label={saving ? "Filing…" : "File B4 report"}
              onPress={sendFiling}
              loading={saving}
            />
            <GhostButton label="Cancel" onPress={() => setFiling(null)} />
          </View>
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
    color: colors.textPrimary,
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
    color: colors.textPrimary,
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
  cardFigures: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 21,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.footnote,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  councilLink: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  councilLinkText: {
    ...typography.bodyStrong,
    color: colors.goldText,
  },
  filingLine: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  fileBtn: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
  },
  fileBtnText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.goldForeground,
  },
  filingSheet: {
    gap: spacing.sm,
  },
});
