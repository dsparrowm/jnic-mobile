import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  RollupStatus,
  computeWeekOf,
  getTodayInLagos,
  outstandingBranches,
  type NationalSummaryResponse,
  type StateSummaryResponse,
  type WeeklyReportRecord,
  type ZoneReportBranchRow,
  type ZoneSummaryResponse,
} from "@repo/types";
import { api, ApiError } from "@/src/lib/api";
import {
  canSubmitWeekly,
  isHqUser,
  isStatePastor,
  isZonalPastor,
} from "@/src/lib/auth";
import { useAuth } from "@/src/lib/session";
import { PrimaryButton } from "@/src/components/ui";
import { StatusPill } from "@/src/components/premium/controls";
import { SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import {
  EmptyPanel,
  InlineNotice,
  ScreenSkeleton,
} from "@/src/components/premium/states";
import { SummaryStrip } from "@/src/components/weekly/branch-rows";
import { ExceptionCard } from "@/src/components/weekly/exceptions";
import { StateCard, ZoneCard } from "@/src/components/weekly/hierarchy";
import { TotalsCard } from "@/src/components/weekly/totals-card";
import { ReportsHero } from "@/src/components/weekly/reports-hero";
import { WeekPicker } from "@/src/components/weekly/week-picker";
import {
  reportStatusLabel,
  reportStatusTone,
  rollupLabel,
  rollupTone,
} from "@/src/components/weekly/status";
import { colors, layout, spacing, typography } from "@/src/theme/tokens";

export default function WeeklyIndexScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [weekOf, setWeekOf] = useState(() => computeWeekOf(getTodayInLagos()));
  const [branchReport, setBranchReport] = useState<WeeklyReportRecord | null>(null);
  const [zone, setZone] = useState<ZoneSummaryResponse | null>(null);
  const [state, setState] = useState<StateSummaryResponse | null>(null);
  const [national, setNational] = useState<NationalSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forwarding, setForwarding] = useState(false);

  const canSubmit = canSubmitWeekly(user);
  const zonal = isZonalPastor(user);
  const statePastor = isStatePastor(user);
  const hq = isHqUser(user);

  const load = useCallback(async () => {
    setError(null);
    try {
      const tasks: Promise<unknown>[] = [];
      if (canSubmit) {
        tasks.push(
          api.listWeeklyReports({ weekOf, perPage: 1 }).then((res) => {
            setBranchReport(res.items[0] ?? null);
          }),
        );
      } else {
        setBranchReport(null);
      }
      if (zonal) {
        tasks.push(api.getZoneSummary(weekOf).then(setZone));
      } else {
        setZone(null);
      }
      if (statePastor) {
        tasks.push(api.getStateSummary(weekOf).then(setState));
      } else {
        setState(null);
      }
      if (hq) {
        tasks.push(api.getNationalSummary(weekOf).then(setNational));
      } else {
        setNational(null);
      }
      await Promise.all(tasks);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this week.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canSubmit, hq, statePastor, weekOf, zonal]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  function openReport(id: string) {
    router.push(`/weekly/${id}`);
  }

  function confirmForward(kind: "zone" | "state", outstanding: ZoneReportBranchRow[]) {
    const waiting = outstanding.map((row) => row.branch.name);
    const coverage =
      waiting.length > 0
        ? `${waiting.length} still waiting: ${waiting.slice(0, 4).join(", ")}${
            waiting.length > 4 ? "…" : ""
          }. Forward anyway?`
        : "All in-scope reports are in. This sends the week upstream.";
    Alert.alert(
      kind === "zone" ? "Forward zone report?" : "Forward state report?",
      `${coverage} You can re-forward later if a late report makes it stale.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Forward",
          onPress: () => {
            void (async () => {
              setForwarding(true);
              setError(null);
              try {
                if (kind === "zone") {
                  setZone(await api.forwardZoneReport(weekOf));
                } else {
                  setState(await api.forwardStateReport(weekOf));
                }
              } catch (err) {
                setError(
                  err instanceof ApiError ? err.message : "Could not forward this week.",
                );
              } finally {
                setForwarding(false);
              }
            })();
          },
        },
      ],
    );
  }

  const subtitle = hq
    ? "National weekly reports"
    : zonal
      ? "Zone weekly reports"
      : statePastor
        ? "State weekly reports"
        : "Your weekly report";

  const heroMeta = [
    user?.branchName,
    [user?.zoneName, user?.stateName].filter(Boolean).join(" · "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.root}>
      <ReportsHero
        user={user}
        title="Reports"
        subtitle={subtitle}
        meta={heroMeta || null}
        topInset={insets.top}
        tone="light"
      />
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: spacing.xxl + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        <View style={styles.body}>
          <SurfaceCard style={styles.weekCard}>
            <WeekPicker weekOf={weekOf} onChange={setWeekOf} />
          </SurfaceCard>
          {error ? <InlineNotice message={error} /> : null}
          {loading ? <ScreenSkeleton /> : null}

          {!loading && canSubmit ? (
            <>
              <SectionHeader title="My branch" />
              <SurfaceCard style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kicker}>
                    {user?.branchName ?? branchReport?.branch.name ?? "My branch"}
                  </Text>
                  <Text style={styles.cardTitle}>
                    {branchReport ? "Report submitted" : "No report yet"}
                  </Text>
                </View>
                {branchReport ? (
                  <StatusPill
                    label={reportStatusLabel(branchReport.status)}
                    tone={reportStatusTone(branchReport.status)}
                  />
                ) : (
                  <StatusPill label="Due" tone="warning" />
                )}
              </View>
              <PrimaryButton
                label={branchReport ? "Open my report" : "Submit report"}
                onPress={() => {
                  if (branchReport) {
                    router.push(`/weekly/${branchReport.id}`);
                    return;
                  }
                  router.push({
                    pathname: "/weekly/submit",
                    params: { weekOf },
                  });
                }}
              />
            </SurfaceCard>
            </>
          ) : null}

          {!loading && zone ? (
            <>
              <SectionHeader title="Zone review" meta={zone.zone.name} />
              <ExceptionCard branches={zone.branches} onOpenReport={openReport} />
              <SummaryStrip summary={zone.summary} />
              {zone.summary.submitted > 0 ? (
                <TotalsCard
                  title="Zone totals"
                  attendance={zone.totals.attendance}
                  finance={zone.totals.finance}
                />
              ) : null}
              <View style={styles.forwardRow}>
                <StatusPill
                  label={rollupLabel(zone.rollup.status)}
                  tone={rollupTone(zone.rollup.status)}
                />
                <PrimaryButton
                  label={
                    zone.rollup.status === RollupStatus.FORWARDED
                      ? "Re-forward to state"
                      : "Forward to state"
                  }
                  loading={forwarding}
                  disabled={forwarding}
                  onPress={() => confirmForward("zone", outstandingBranches(zone.branches))}
                />
              </View>
              <ZoneCard zone={zone} onOpenReport={openReport} />
            </>
          ) : null}

          {!loading && state ? (
            <>
              <SectionHeader title="State review" meta={state.state.name} />
              <ExceptionCard
                branches={state.zones.flatMap((item) => item.branches)}
                onOpenReport={openReport}
              />
              <SummaryStrip summary={state.summary} />
              {state.summary.submitted > 0 ? (
                <TotalsCard
                  title="State totals"
                  attendance={state.totals.attendance}
                  finance={state.totals.finance}
                />
              ) : null}
              <View style={styles.forwardRow}>
                <StatusPill
                  label={rollupLabel(state.rollup.status)}
                  tone={rollupTone(state.rollup.status)}
                />
                <PrimaryButton
                  label={
                    state.rollup.status === RollupStatus.FORWARDED
                      ? "Re-forward to HQ"
                      : "Forward to HQ"
                  }
                  loading={forwarding}
                  disabled={forwarding}
                  onPress={() =>
                    confirmForward(
                      "state",
                      outstandingBranches(state.zones.flatMap((item) => item.branches)),
                    )
                  }
                />
              </View>
              {state.zones.map((item) => (
                <ZoneCard
                  key={item.zone.id}
                  zone={item}
                  onOpenReport={openReport}
                />
              ))}
            </>
          ) : null}

          {!loading && hq && national ? (
            <>
              <SectionHeader title="National overview" />
              <ExceptionCard
                branches={national.states.flatMap((item) =>
                  item.zones.flatMap((zoneItem) => zoneItem.branches),
                )}
                onOpenReport={openReport}
              />
              <SummaryStrip summary={national.summary} />
              {national.summary.submitted > 0 ? (
                <TotalsCard
                  title="National totals"
                  attendance={national.totals.attendance}
                  finance={national.totals.finance}
                />
              ) : null}
              {national.states.length === 0 ? (
                <EmptyPanel
                  icon="flag-outline"
                  title="Nothing forwarded yet"
                  body="State reports appear here after state pastors forward the week. Coverage gaps stay with the state until then."
                />
              ) : (
                national.states.map((item) => (
                  <StateCard
                    key={item.state.id}
                    state={item}
                    onOpenReport={openReport}
                  />
                ))
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
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
  body: {
    paddingHorizontal: layout.screenPad,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  weekCard: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  card: {
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  kicker: {
    ...typography.overline,
    color: colors.textMuted,
  },
  cardTitle: {
    ...typography.title3,
    color: colors.navy,
    marginTop: 2,
  },
  forwardRow: {
    gap: spacing.sm,
  },
});
