import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Role, type HqHomeTaskKind, type NotificationRecord } from "@repo/types";
import { AttentionList } from "@/src/components/home/attention-list";
import { AttendanceTrend } from "@/src/components/home/attendance-trend";
import { HomeHero } from "@/src/components/home/home-hero";
import { HomeMetrics } from "@/src/components/home/home-metrics";
import {
  HomeErrorState,
  HomeSkeleton,
  RefreshErrorBanner,
} from "@/src/components/home/home-states";
import { PastorHome } from "@/src/components/home/pastor-home";
import { RecentActivity } from "@/src/components/home/recent-activity";
import { WeeklyHealthCard } from "@/src/components/home/weekly-health-card";
import { NotificationBell } from "@/src/components/notifications/notification-bell";
import { useHomeDashboard } from "@/src/hooks/use-home-dashboard";
import { api } from "@/src/lib/api";
import { openNotificationTarget } from "@/src/lib/notifications";
import { useAuth } from "@/src/lib/session";
import { colors, layout, spacing } from "@/src/theme/tokens";

const TASK_ROUTES: Record<HqHomeTaskKind, "/pastors" | "/weekly" | "/approvals"> = {
  PENDING_ONBOARDING: "/pastors",
  MISSED_REPORTS: "/weekly",
  PENDING_SUMMARY_APPROVALS: "/approvals",
};

function HqHome() {
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
    const route = data?.role === Role.LEAD_PASTOR ? "/approvals" : "/weekly";
    router.navigate(route as never);
  };

  const openTask = (kind: HqHomeTaskKind) => {
    router.navigate(TASK_ROUTES[kind] as never);
  };

  const openNotifications = () => router.push("/notifications" as never);

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

  return (
    <View style={styles.root}>
      <HomeHero
        user={user}
        tone="light"
        branchName={
          user?.role === Role.LEAD_PASTOR ? "Lead Pastor" : "Headquarters"
        }
        location={
          data?.weekLabel
            ? `Week ending ${data.weekLabel}`
            : "National operations"
        }
        topInset={insets.top}
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

export default function HomeScreen() {
  const { user, isHq } = useAuth();
  if (user && !isHq) {
    return <PastorHome user={user} />;
  }
  return <HqHome />;
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
    paddingBottom: spacing.xxl,
  },
  sheet: {
    paddingHorizontal: layout.screenPad,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
});
