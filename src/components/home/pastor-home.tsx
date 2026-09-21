import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NotificationRecord } from "@repo/types";
import { AttendanceTrend } from "@/src/components/home/attendance-trend";
import { BranchHomeMetrics } from "@/src/components/home/branch-home-metrics";
import { BranchMonthSnapshot } from "@/src/components/home/branch-month-snapshot";
import { HomeHero } from "@/src/components/home/home-hero";
import {
  HomeErrorState,
  HomeSkeleton,
  RefreshErrorBanner,
} from "@/src/components/home/home-states";
import { RecentActivity } from "@/src/components/home/recent-activity";
import { ReportNudgeBanner } from "@/src/components/home/report-nudge-banner";
import { StateActionNudge } from "@/src/components/home/state-action-nudge";
import { StateZoneAttention } from "@/src/components/home/state-zone-attention";
import { ZoneActionNudge } from "@/src/components/home/zone-action-nudge";
import { ScopeHomeMetrics, ZoneHomeMetrics } from "@/src/components/home/zone-home-metrics";
import { NotificationBell } from "@/src/components/notifications/notification-bell";
import { ExceptionCard } from "@/src/components/weekly/exceptions";
import { usePastorHome } from "@/src/hooks/use-pastor-home";
import { api, type AuthUser } from "@/src/lib/api";
import { canSubmitWeekly, isStatePastor, isZonalPastor } from "@/src/lib/auth";
import { openNotificationTarget } from "@/src/lib/notifications";
import { useAuth } from "@/src/lib/session";
import { colors, layout, spacing } from "@/src/theme/tokens";

export function PastorHome({ user }: { user: AuthUser }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const { data, loading, refreshing, error, refreshError, refresh, retry } =
    usePastorHome(user);
  const canSubmit = canSubmitWeekly(user);
  const zonal = isZonalPastor(user);
  const statePastor = isStatePastor(user);
  const branchName =
    data?.branch?.name ?? user.branchName ?? null;
  const branchLocation = [data?.branch?.zoneName, data?.branch?.stateName]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    if (user.branchId && !user.branchName) {
      void refreshUser();
    }
  }, [refreshUser, user.branchId, user.branchName]);

  const openReports = () => router.navigate("/weekly" as never);
  const openNotifications = () => router.push("/notifications" as never);

  const openReportNudge = () => {
    if (!data) return;
    const { thisWeek } = data;

    if (!thisWeek.report && thisWeek.submissionState === "PENDING") {
      router.push({
        pathname: "/weekly/submit",
        params: { weekOf: thisWeek.weekOf },
      });
      return;
    }

    if (thisWeek.report && !thisWeek.report.editable) {
      router.navigate(`/weekly/${thisWeek.report.id}` as never);
      return;
    }

    openReports();
  };

  const openNotification = useCallback(
    async (item: NotificationRecord) => {
      if (!item.readAt) {
        try {
          await api.markNotificationRead(item.id);
          void refresh();
        } catch {
          // Non-blocking — still open the linked screen.
        }
      }
      openNotificationTarget(item, (href) => router.navigate(href as never));
    },
    [refresh, router],
  );

  const heroSubtitle = statePastor
    ? data?.state?.state.name ?? user.stateName ?? null
    : zonal
      ? data?.zone?.zone.name ?? user.zoneName ?? branchName
      : branchName;

  const heroLocation = statePastor
    ? branchName
    : zonal
      ? (user.stateName ?? branchLocation) || null
      : branchLocation || null;

  const branchTrendSubtitle = branchName
    ? `Last six weeks · ${branchName}`
    : "Last six weeks";

  return (
    <View style={styles.root}>
      <HomeHero
        user={user}
        branchName={heroSubtitle}
        location={heroLocation}
        topInset={insets.top}
        tone="light"
        trailing={
          <NotificationBell
            unreadCount={data?.recentActivity.unreadCount ?? 0}
            onPress={openNotifications}
            tone="light"
          />
        }
      />
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.xxl + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        <View style={styles.body}>
          {loading && !data ? <HomeSkeleton /> : null}
          {error && !data ? (
            <HomeErrorState message={error} onRetry={() => void retry()} />
          ) : null}

          {data ? (
            <>
              {refreshError ? <RefreshErrorBanner message={refreshError} /> : null}

              {data.zone ? (
                <>
                  <ZoneActionNudge zone={data.zone} onPress={openReports} />
                  <ZoneHomeMetrics zone={data.zone} />
                  <ExceptionCard
                    branches={data.zone.branches}
                    onOpenReport={(reportId) =>
                      router.navigate(`/weekly/${reportId}` as never)
                    }
                  />
                  {(data.zoneAttendanceTrend ?? []).length > 0 ? (
                    <AttendanceTrend
                      points={data.zoneAttendanceTrend ?? []}
                      subtitle={
                        data.zone?.zone.name
                          ? `Last six weeks · ${data.zone.zone.name}`
                          : "Last six weeks"
                      }
                    />
                  ) : null}
                  {data.zoneMonth ? (
                    <BranchMonthSnapshot
                      month={data.zoneMonth}
                      unitLabel="branches"
                    />
                  ) : null}
                </>
              ) : null}

              {data.state ? (
                <>
                  <StateActionNudge state={data.state} onPress={openReports} />
                  <ScopeHomeMetrics
                    section={`This week · ${data.state.state.name}`}
                    attendance={data.state.totals.attendance}
                    finance={data.state.totals.finance}
                  />
                  <StateZoneAttention state={data.state} onPress={openReports} />
                  {(data.stateAttendanceTrend ?? []).length > 0 ? (
                    <AttendanceTrend
                      points={data.stateAttendanceTrend ?? []}
                      subtitle={`Last six weeks · ${data.state.state.name}`}
                    />
                  ) : null}
                  {data.stateMonth ? (
                    <BranchMonthSnapshot
                      month={data.stateMonth}
                      unitLabel="branches"
                    />
                  ) : null}
                </>
              ) : null}

              {canSubmit && data.branch ? (
                <ReportNudgeBanner
                  report={data.thisWeek.report}
                  submissionState={data.thisWeek.submissionState}
                  weekLabel={data.thisWeek.weekLabel}
                  onPress={openReportNudge}
                />
              ) : null}

              {data.branch && canSubmit ? (
                <>
                  <BranchHomeMetrics report={data.thisWeek.report} />
                  <AttendanceTrend
                    points={data.attendanceTrend}
                    subtitle={branchTrendSubtitle}
                  />
                  {data.month ? <BranchMonthSnapshot month={data.month} /> : null}
                </>
              ) : null}

              <RecentActivity
                items={data.recentActivity.items}
                unreadCount={data.recentActivity.unreadCount}
                onItemPress={(item) => void openNotification(item)}
                onSeeAllPress={openNotifications}
              />
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
  scrollContent: {
    flexGrow: 1,
  },
  body: {
    paddingHorizontal: layout.screenPad,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
