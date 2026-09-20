import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Role, type HqHomeTaskKind } from "@repo/types";
import { AttentionList } from "@/src/components/home/attention-list";
import { AttendanceTrend } from "@/src/components/home/attendance-trend";
import { HomeHero } from "@/src/components/home/home-hero";
import { HomeMetrics } from "@/src/components/home/home-metrics";
import {
  HomeErrorState,
  HomeSkeleton,
  RefreshErrorBanner,
} from "@/src/components/home/home-states";
import { RecentActivity } from "@/src/components/home/recent-activity";
import { WeeklyHealthCard } from "@/src/components/home/weekly-health-card";
import { useHomeDashboard } from "@/src/hooks/use-home-dashboard";
import { useAuth } from "@/src/lib/session";
import { colors, layout, spacing } from "@/src/theme/tokens";

const TASK_ROUTES: Record<HqHomeTaskKind, "/pastors" | "/summaries" | "/approvals"> = {
  PENDING_ONBOARDING: "/pastors",
  MISSED_REPORTS: "/summaries",
  PENDING_SUMMARY_APPROVALS: "/approvals",
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    data,
    loading,
    refreshing,
    error,
    refreshError,
    refresh,
    retry,
  } = useHomeDashboard();

  const openPrimaryAction = () => {
    const route = data?.role === Role.LEAD_PASTOR ? "/approvals" : "/summaries";
    router.navigate(route as never);
  };

  const openTask = (kind: HqHomeTaskKind) => {
    router.navigate(TASK_ROUTES[kind] as never);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        <HomeHero
          user={user}
          weekLabel={data?.weekLabel}
          topInset={insets.top}
        />

        <View style={styles.sheet}>
          {loading && !data ? <HomeSkeleton /> : null}
          {error && !data ? (
            <HomeErrorState message={error} onRetry={() => void retry()} />
          ) : null}

          {data ? (
            <>
              {refreshError ? <RefreshErrorBanner message={refreshError} /> : null}
              <WeeklyHealthCard
                dashboard={data}
                onPress={openPrimaryAction}
              />
              <HomeMetrics dashboard={data} />
              <AttentionList tasks={data.tasks} onTaskPress={openTask} />
              <AttendanceTrend points={data.attendanceTrend} />
              <RecentActivity
                items={data.recentActivity.items}
                unreadCount={data.recentActivity.unreadCount}
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
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  sheet: {
    marginTop: -24,
    paddingHorizontal: layout.screenPad,
    gap: spacing.md,
  },
});
