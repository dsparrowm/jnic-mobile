import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { HqHomeTask } from "@repo/types";
import { api, type AuthUser } from "@/src/lib/api";
import { formatCount, plural } from "@/src/lib/format";
import { HomeHero } from "@/src/components/home/home-hero";
import { HomeSkeleton } from "@/src/components/home/home-states";
import { AttentionList } from "@/src/components/home/attention-list";
import { NotificationBell } from "@/src/components/notifications/notification-bell";
import { SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { colors, fonts, layout, radius, spacing, typography } from "@/src/theme/tokens";

type AdminOverview = {
  users: { total: number; active: number; pending: number; deactivated: number };
  org: {
    regions: number;
    states: number;
    zones: number;
    districts: number;
    branches: number;
  };
  directorates: { total: number; directorsSeated: number; members: number };
  unread: number;
};

function Kpi({
  label,
  value,
  delta,
  tone,
  divider,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "up" | "down" | "muted";
  divider?: boolean;
}) {
  return (
    <View style={[styles.kpi, divider && styles.kpiDivider]}>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.kpiLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[
          styles.kpiDelta,
          tone === "up"
            ? styles.kpiUp
            : tone === "down"
              ? styles.kpiDown
              : styles.kpiMuted,
        ]}
        numberOfLines={1}
      >
        {delta}
      </Text>
    </View>
  );
}

function ManageRow({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.manageRow} onPress={onPress}>
      <View style={styles.manageIcon}>
        <Ionicons name={icon} size={18} color={colors.goldText} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.manageTitle}>{title}</Text>
        <Text style={styles.manageDetail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

export function AdminHome({ user }: { user: AuthUser }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstFocus = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [pastors, tree, directorates, notifications] = await Promise.all([
        api.listPastors({ perPage: 1 }),
        api.getOrgTree(),
        api.listDirectorates(),
        api.listNotifications(),
      ]);
      const states = [
        ...tree.unassignedStates,
        ...tree.regions.flatMap((r) => r.states),
      ];
      const zones = states.flatMap((s) => s.zones);
      const districts = zones.flatMap((z) => z.districts);
      const branches =
        states.flatMap((s) => s.branches ?? []).length +
        zones.flatMap((z) => z.branches ?? []).length +
        districts.flatMap((d) => d.branches ?? []).length;
      setData({
        users: pastors.summary,
        org: {
          regions: tree.regions.length,
          states: states.length,
          zones: zones.length,
          districts: districts.length,
          branches,
        },
        directorates: {
          total: directorates.length,
          directorsSeated: directorates.filter((d) => d.leadership.director)
            .length,
          members: directorates.reduce((n, d) => n + d.memberCount, 0),
        },
        unread: notifications.unreadCount,
      });
      setError(null);
    } catch {
      setError("Could not load the admin overview.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
      }
      void refresh();
    }, [refresh]),
  );

  const tasks: HqHomeTask[] = [];
  if (data) {
    if (data.users.pending > 0) {
      tasks.push({
        kind: "PENDING_ONBOARDING",
        title: "Onboarding pending",
        description: `${data.users.pending} ${data.users.pending === 1 ? "person has" : "people have"} not activated their account.`,
        count: data.users.pending,
        severity: "WARNING",
      });
    }
    const vacant = data.directorates.total - data.directorates.directorsSeated;
    if (vacant > 0) {
      tasks.push({
        kind: "DIRECTORATE_VACANCIES",
        title: "Director seats vacant",
        description: `${vacant} of ${data.directorates.total} directorates have no director seated.`,
        count: vacant,
        severity: "URGENT",
      });
    }
  }

  const openTask = (kind: HqHomeTask["kind"]) => {
    if (kind === "PENDING_ONBOARDING") {
      router.navigate("/pastors" as never);
    } else if (kind === "DIRECTORATE_VACANCIES") {
      router.push({
        pathname: "/org",
        params: { view: "directorates" },
      } as never);
    }
  };

  return (
    <View style={styles.root}>
      <HomeHero
        user={user}
        branchName="Administration"
        topInset={insets.top}
        tone="light"
        trailing={
          <NotificationBell
            unreadCount={data?.unread ?? 0}
            onPress={() => router.push("/notifications" as never)}
            tone="light"
          />
        }
      />
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void refresh();
            }}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        <View style={styles.body}>
          {loading && !data ? <HomeSkeleton /> : null}
          {error && !data ? (
            <SurfaceCard>
              <Text style={styles.errorText}>{error}</Text>
            </SurfaceCard>
          ) : null}

          {data ? (
            <>
              <AttentionList tasks={tasks} onTaskPress={openTask} />

              <SurfaceCard style={styles.kpiCard}>
                <View style={styles.kpiStrip}>
                  <Kpi
                    label="Accounts"
                    value={formatCount(data.users.active)}
                    delta={`${data.users.pending} pending`}
                    tone={data.users.pending > 0 ? "muted" : "up"}
                  />
                  <Kpi
                    label="Directors"
                    value={`${data.directorates.directorsSeated}/${data.directorates.total}`}
                    delta={
                      data.directorates.directorsSeated ===
                      data.directorates.total
                        ? "all seated"
                        : `${data.directorates.total - data.directorates.directorsSeated} vacant`
                    }
                    tone={
                      data.directorates.directorsSeated ===
                      data.directorates.total
                        ? "up"
                        : "down"
                    }
                    divider
                  />
                  <Kpi
                    label="Branches"
                    value={formatCount(data.org.branches)}
                    delta={`${plural(data.org.states, "state")} · ${plural(data.org.zones, "zone")}`}
                    tone="muted"
                    divider
                  />
                </View>
              </SurfaceCard>

              <SectionHeader title="Manage" />
              <SurfaceCard style={styles.manageCard}>
                <ManageRow
                  icon="people-outline"
                  title="People"
                  detail={`${data.users.active} active · ${data.users.deactivated} deactivated`}
                  onPress={() => router.navigate("/pastors" as never)}
                />
                <View style={styles.rowDivider} />
                <ManageRow
                  icon="business-outline"
                  title="Territory"
                  detail={`${plural(data.org.regions, "region")} · ${plural(data.org.states, "state")} · ${plural(data.org.zones, "zone")} · ${plural(data.org.districts, "district")} · ${plural(data.org.branches, "branch")}`}
                  onPress={() => router.navigate("/org" as never)}
                />
                <View style={styles.rowDivider} />
                <ManageRow
                  icon="layers-outline"
                  title="Directorates"
                  detail={`${plural(data.directorates.members, "member")} across ${plural(data.directorates.total, "directorate")}`}
                  onPress={() =>
                    router.push({
                      pathname: "/org",
                      params: { view: "directorates" },
                    } as never)
                  }
                />
              </SurfaceCard>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  flex: { flex: 1 },
  body: {
    paddingHorizontal: layout.screenPad,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  kpiCard: { padding: spacing.md },
  kpiStrip: { flexDirection: "row" },
  kpi: { flex: 1, gap: 2 },
  kpiDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
  },
  kpiValue: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  kpiDelta: { fontSize: 11, lineHeight: 14, fontWeight: "600" },
  kpiUp: { color: colors.success },
  kpiDown: { color: colors.error },
  kpiMuted: { color: colors.textMuted },
  manageCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  manageIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.navyMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  manageTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  manageDetail: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 36 + spacing.sm,
  },
  errorText: { ...typography.body, color: colors.error, textAlign: "center" },
});
