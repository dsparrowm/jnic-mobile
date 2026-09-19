import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, ApiError, type MonthlySummaryRecord } from "@/src/lib/api";
import { colors, radius, spacing } from "@/src/theme/tokens";

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
      <Text style={styles.heading}>Approvals</Text>
      <Text style={styles.sub}>National monthly summaries pending Lead Pastor sign-off</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.lg }} />
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
              <Text style={styles.section}>Pending approval</Text>
              {pending.length === 0 ? (
                <Text style={styles.empty}>Nothing waiting for approval.</Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {MONTH_NAMES[item.month - 1]} {item.year}
              </Text>
              <Text style={styles.cardMeta}>
                {item.scopeName ?? item.scopeType} · {item.status}
              </Text>
              <Pressable
                style={[
                  styles.primaryBtn,
                  approvingId === item.id && { opacity: 0.6 },
                ]}
                disabled={approvingId === item.id}
                onPress={() => approve(item)}
              >
                {approvingId === item.id ? (
                  <ActivityIndicator color={colors.goldForeground} />
                ) : (
                  <Text style={styles.primaryBtnText}>Approve</Text>
                )}
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            <View style={{ marginTop: spacing.lg }}>
              <View style={styles.monthRow}>
                <Pressable onPress={() => shiftMonth(-1)} style={styles.monthBtn}>
                  <Text style={styles.monthBtnText}>‹</Text>
                </Pressable>
                <Text style={styles.section}>
                  {MONTH_NAMES[month - 1]} {year}
                </Text>
                <Pressable onPress={() => shiftMonth(1)} style={styles.monthBtn}>
                  <Text style={styles.monthBtnText}>›</Text>
                </Pressable>
              </View>
              {summaries.length === 0 ? (
                <Text style={styles.empty}>No summaries for this month.</Text>
              ) : (
                summaries.map((item) => (
                  <View key={item.id} style={styles.cardMuted}>
                    <Text style={styles.cardTitle}>
                      {item.scopeName ?? item.scopeType}
                    </Text>
                    <Text style={styles.cardMeta}>{item.status}</Text>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  heading: { fontSize: 22, fontWeight: "700", color: colors.navy },
  sub: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
    marginTop: 2,
  },
  section: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardMuted: {
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontWeight: "600", color: colors.textPrimary, fontSize: 16 },
  cardMeta: { marginTop: 4, color: colors.textMuted, fontSize: 13 },
  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.goldForeground, fontWeight: "600" },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  monthBtnText: { fontSize: 20, color: colors.navy, fontWeight: "600" },
  empty: { color: colors.textMuted, marginBottom: spacing.md },
  error: { color: colors.error, marginBottom: spacing.sm },
});
