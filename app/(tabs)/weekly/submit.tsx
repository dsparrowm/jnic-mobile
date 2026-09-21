import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  computeWeekOf,
  formatWeekEndingLabel,
  getTodayInLagos,
  type WeeklyReportRecord,
} from "@repo/types";
import { api, ApiError } from "@/src/lib/api";
import { canSubmitWeekly } from "@/src/lib/auth";
import { useAuth } from "@/src/lib/session";
import { PrimaryButton } from "@/src/components/ui";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { SurfaceCard } from "@/src/components/premium/screen";
import { WeeklyReportFields, type WeeklyFormValues } from "@/src/components/weekly/weekly-form";
import { WeeklyStackBar } from "@/src/components/weekly/stack-bar";
import { formatCount, formatMoney } from "@/src/lib/format";
import { colors, layout, spacing, typography } from "@/src/theme/tokens";

export default function WeeklySubmitScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ weekOf?: string }>();
  const weekOf = params.weekOf || computeWeekOf(getTodayInLagos());
  const defaultServiceDate = useMemo(() => weekOf, [weekOf]);
  const [report, setReport] = useState<WeeklyReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<WeeklyReportRecord | null>(null);

  const allowed = canSubmitWeekly(user);
  const branchName = report?.branch.name ?? user?.branchName ?? null;

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await api.listWeeklyReports({ weekOf, perPage: 1 });
      setReport(response.items[0] ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this report.");
    } finally {
      setLoading(false);
    }
  }, [weekOf]);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    void load();
  }, [allowed, load]);

  async function onSubmit(values: WeeklyFormValues) {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...values, currency: "NGN" as const };
      const saved = report
        ? await api.updateWeeklyReport(report.id, payload)
        : await api.createWeeklyReport(payload);
      setReport(saved);
      setReceipt(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this report.");
    } finally {
      setSaving(false);
    }
  }

  const attendance = receipt?.attendance;
  const finance = receipt?.finance;
  const people =
    (attendance?.adultCount ?? 0) +
    (attendance?.teenageCount ?? 0) +
    (attendance?.childrenCount ?? 0);
  const income =
    (finance?.tithe ?? 0) + (finance?.offering ?? 0) + (finance?.other ?? 0);

  return (
    <View style={styles.root}>
      <WeeklyStackBar
        title={receipt ? "Report sent" : report ? "Update report" : "Submit report"}
        subtitle={
          branchName
            ? `${branchName} · week ending ${formatWeekEndingLabel(weekOf)}`
            : formatWeekEndingLabel(weekOf)
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: spacing.xxl + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheet}>
            {!allowed ? (
              <InlineNotice message="Your account is not assigned a branch for weekly submit." />
            ) : null}
            {loading ? <ScreenSkeleton /> : null}
            {!loading && allowed && receipt ? (
              <SurfaceCard style={styles.receipt}>
                <Text style={styles.receiptKicker}>
                  {receipt.branch.name} · week ending {formatWeekEndingLabel(receipt.weekOf)}
                </Text>
                <Text style={styles.receiptTitle}>Your zonal pastor has this week</Text>
                <View style={styles.receiptRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.totalsLabel}>Attendance</Text>
                    <Text style={styles.totalsValue}>{formatCount(people)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.totalsLabel}>Income</Text>
                    <Text style={styles.totalsValue}>{formatMoney(income, finance?.currency)}</Text>
                  </View>
                </View>
                <PrimaryButton
                  label="Back to Home"
                  onPress={() => {
                    router.replace("/");
                  }}
                />
              </SurfaceCard>
            ) : null}
            {!loading && allowed && !receipt ? (
              <WeeklyReportFields
                existingReport={report}
                defaultServiceDate={defaultServiceDate}
                branchName={branchName}
                loading={saving}
                error={error}
                onSubmit={onSubmit}
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
  },
  sheet: {
    paddingHorizontal: layout.screenPad,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  receipt: {
    padding: spacing.md,
    gap: spacing.md,
  },
  receiptKicker: {
    ...typography.footnote,
    color: colors.textMuted,
  },
  receiptTitle: {
    ...typography.title3,
    color: colors.navy,
  },
  receiptRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  totalsLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  totalsValue: {
    ...typography.title3,
    color: colors.navy,
    marginTop: 2,
  },
});
