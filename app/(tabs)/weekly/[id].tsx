import { useCallback, useEffect, useRef, useState } from "react";
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
import { formatWeekEndingLabel, type WeeklyReportRecord } from "@repo/types";
import { api, ApiError } from "@/src/lib/api";
import { canLeaveFeedback, canSubmitWeekly } from "@/src/lib/auth";
import { useAuth } from "@/src/lib/session";
import { GhostButton } from "@/src/components/ui";
import { StatusPill } from "@/src/components/premium/controls";
import { SurfaceCard } from "@/src/components/premium/screen";
import {
  InlineNotice,
  ScreenErrorState,
  ScreenSkeleton,
} from "@/src/components/premium/states";
import { FeedbackThread } from "@/src/components/weekly/feedback-thread";
import { WeeklyStackBar } from "@/src/components/weekly/stack-bar";
import { TotalsCard } from "@/src/components/weekly/totals-card";
import { reportStatusLabel, reportStatusTone } from "@/src/components/weekly/status";
import { colors, layout, spacing, typography } from "@/src/theme/tokens";

export default function WeeklyReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [report, setReport] = useState<WeeklyReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToComposer = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      setReport(await api.getWeeklyReport(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const ownReport = Boolean(user && report && report.submittedById === user.id);
  const showEdit = ownReport && canSubmitWeekly(user) && report?.editable;

  return (
    <View style={styles.root}>
      <WeeklyStackBar
        title="Report"
        subtitle={
          report
            ? `${report.branch.name} · week ending ${formatWeekEndingLabel(report.weekOf)}`
            : undefined
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: spacing.xxl + insets.bottom },
          ]}
        >
        <View style={styles.sheet}>
            {loading ? <ScreenSkeleton /> : null}
            {error && !report ? (
              <ScreenErrorState message={error} onRetry={() => void load()} />
            ) : null}
            {error && report ? <InlineNotice message={error} /> : null}

            {report ? (
              <>
                <SurfaceCard style={styles.identity}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.branch}>{report.branch.name}</Text>
                      <Text style={styles.meta}>
                        {report.submittedBy.name} · week ending{" "}
                        {formatWeekEndingLabel(report.weekOf)}
                      </Text>
                    </View>
                    <StatusPill
                      label={reportStatusLabel(report.status)}
                      tone={reportStatusTone(report.status)}
                    />
                  </View>
                </SurfaceCard>

                {report.attendance && report.finance ? (
                  <TotalsCard
                    title="Attendance and finance"
                    attendance={report.attendance}
                    finance={report.finance}
                  />
                ) : null}

                {showEdit ? (
                  <GhostButton
                    label="Edit report"
                    onPress={() =>
                      router.push({
                        pathname: "/weekly/submit",
                        params: { weekOf: report.weekOf },
                      })
                    }
                  />
                ) : null}

                <FeedbackThread
                  reportId={report.id}
                  currentUserId={user?.id}
                  canCompose={canLeaveFeedback(user)}
                  onComposerFocus={scrollToComposer}
                />
              </>
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
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  sheet: {
    paddingHorizontal: layout.screenPad,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  identity: {
    padding: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  branch: {
    ...typography.title3,
    color: colors.navy,
  },
  meta: {
    ...typography.footnote,
    color: colors.textMuted,
    marginTop: 2,
  },
});
