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
import { api, type AuthUser } from "@/src/lib/api";
import { HomeHero } from "@/src/components/home/home-hero";
import { HomeSkeleton } from "@/src/components/home/home-states";
import { NotificationBell } from "@/src/components/notifications/notification-bell";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

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

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ManageCard({
  icon,
  title,
  subtitle,
  onPress,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Ionicons name={icon} size={16} color={colors.goldText} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
      <Pressable style={styles.cardLink} onPress={onPress}>
        <Text style={styles.cardLinkText}>{subtitle}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.goldText} />
      </Pressable>
    </View>
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
        void refresh();
        return;
      }
      void refresh();
    }, [refresh]),
  );

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
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {data ? (
            <>
              <ManageCard
                icon="people-outline"
                title="People"
                subtitle="Open pastor directory"
                onPress={() => router.navigate("/pastors" as never)}
              >
                <StatRow label="Active accounts" value={data.users.active} />
                <StatRow
                  label="Pending onboarding"
                  value={data.users.pending}
                />
                <StatRow label="Deactivated" value={data.users.deactivated} />
              </ManageCard>

              <ManageCard
                icon="business-outline"
                title="Territory"
                subtitle="Manage structure"
                onPress={() => router.navigate("/org" as never)}
              >
                <StatRow label="Regions" value={data.org.regions} />
                <StatRow label="States" value={data.org.states} />
                <StatRow label="Zones" value={data.org.zones} />
                <StatRow label="Districts" value={data.org.districts} />
                <StatRow label="Branches" value={data.org.branches} />
              </ManageCard>

              <ManageCard
                icon="layers-outline"
                title="Directorates"
                subtitle="Manage directorates"
                onPress={() =>
                  router.push({
                    pathname: "/org",
                    params: { view: "directorates" },
                  } as never)
                }
              >
                <StatRow
                  label="Directors seated"
                  value={data.directorates.directorsSeated}
                />
                <StatRow
                  label="Total members"
                  value={data.directorates.members}
                />
                <StatRow
                  label="Directorates"
                  value={data.directorates.total}
                />
              </ManageCard>
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
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  statLabel: { ...typography.caption, color: colors.textMuted },
  statValue: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    marginTop: spacing.sm,
  },
  cardLinkText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.goldText,
  },
  errorCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
  },
  errorText: { ...typography.body, color: colors.error },
});
