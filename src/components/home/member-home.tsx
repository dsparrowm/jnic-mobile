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
import {
  api,
  type AuthUser,
  type MyReportTemplate,
  type TemplateReportRecord,
} from "@/src/lib/api";
import type { NotificationRecord } from "@repo/types";
import { openNotificationTarget } from "@/src/lib/notifications";
import { HomeHero } from "@/src/components/home/home-hero";
import { HomeSkeleton } from "@/src/components/home/home-states";
import { RecentActivity } from "@/src/components/home/recent-activity";
import { NotificationBell } from "@/src/components/notifications/notification-bell";
import { EmptyPanel } from "@/src/components/premium/states";
import { SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { StatusPill } from "@/src/components/premium/controls";
import { colors, fonts, layout, radius, spacing, typography } from "@/src/theme/tokens";

const OFFICE_LABELS: Record<string, string> = {
  DIRECTOR: "Director",
  DEPUTY_DIRECTOR: "Deputy Director",
  SECRETARY: "Secretary",
  DESK_HEAD: "Desk Head",
  DEPUTY_DESK_HEAD: "Deputy Desk Head",
  REGIONAL_COORDINATOR: "Regional Coordinator",
  MEMBER: "Member",
};

function reportsToLabel(office: string | undefined): string {
  switch (office) {
    case "DIRECTOR":
    case "DEPUTY_DIRECTOR":
    case "SECRETARY":
      return "Resident Pastor";
    case "DESK_HEAD":
    case "DEPUTY_DESK_HEAD":
      return "Your directorate director";
    case "REGIONAL_COORDINATOR":
      return "Your desk head and director";
    default:
      return "Your desk head";
  }
}

function cadenceLabel(t: MyReportTemplate): string {
  const due =
    t.cadence === "WEEKLY"
      ? "Mondays"
      : t.dueDay
        ? `${t.dueDay}th monthly`
        : t.cadence.toLowerCase();
  return `${t.code} · ${due}`;
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
        <Text style={styles.manageDetail} numberOfLines={2}>
          {detail}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

type MemberData = {
  templates: MyReportTemplate[];
  queue: TemplateReportRecord[];
  activity: NotificationRecord[];
  unread: number;
};

export function MemberHome({ user }: { user: AuthUser }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstFocus = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [templates, queue, notifications] = await Promise.all([
        api.listMyReportTemplates().catch(() => [] as MyReportTemplate[]),
        api.listTemplateReviewQueue().catch(() => [] as TemplateReportRecord[]),
        api.listNotifications().catch(() => ({ items: [], unreadCount: 0 })),
      ]);
      setData({
        templates,
        queue,
        activity: notifications.items,
        unread: notifications.unreadCount,
      });
      setError(null);
    } catch {
      setError("Could not load your directorate home.");
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

  const directorate = user.directorate ?? null;
  const openDuties = () => router.push("/weekly/duties" as never);
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
        branchName={directorate?.directorateName ?? "Directorate member"}
        location={user.branchName ?? null}
        topInset={insets.top}
        tone="light"
        trailing={
          <NotificationBell
            unreadCount={data?.unread ?? 0}
            onPress={openNotifications}
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
              {directorate ? (
                <>
                  <SectionHeader title="My directorate" />
                  <SurfaceCard style={styles.card}>
                    <Pressable
                      style={styles.row}
                      onPress={() =>
                        directorate.directorateId
                          ? router.push(
                              `/directorates/${directorate.directorateId}` as never,
                            )
                          : undefined
                      }
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.kicker}>{directorate.directorateName}</Text>
                        <Text style={styles.cardTitle}>
                          {OFFICE_LABELS[directorate.office] ?? directorate.office}
                          {directorate.deskName ? ` · ${directorate.deskName}` : ""}
                        </Text>
                        <Text style={styles.captionLine}>
                          You report to {reportsToLabel(directorate.office)}.
                        </Text>
                      </View>
                      {directorate.directorateId ? (
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.textMuted}
                        />
                      ) : null}
                    </Pressable>
                  </SurfaceCard>
                </>
              ) : null}

              {data.templates.length > 0 ? (
                <>
                  <SectionHeader title="Due from me" />
                  <SurfaceCard style={styles.manageCard}>
                    {data.templates.map((t, idx) => (
                      <View key={t.id}>
                        {idx > 0 ? <View style={styles.rowDivider} /> : null}
                        <ManageRow
                          icon="document-text-outline"
                          title={t.name}
                          detail={`${cadenceLabel(t)} · ${t.scopes
                            .map((s) => s.label)
                            .join(", ")}`}
                          onPress={openDuties}
                        />
                      </View>
                    ))}
                  </SurfaceCard>
                </>
              ) : null}

              {data.queue.length > 0 ? (
                <SurfaceCard style={styles.card}>
                  <Pressable style={styles.row} onPress={openDuties}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.kicker}>Review queue</Text>
                      <Text style={styles.cardTitle}>
                        {data.queue.length}{" "}
                        {data.queue.length === 1 ? "report awaits" : "reports await"}{" "}
                        your review
                      </Text>
                    </View>
                    <StatusPill label="To review" tone="warning" />
                  </Pressable>
                </SurfaceCard>
              ) : null}

              {!directorate && data.templates.length === 0 ? (
                <EmptyPanel
                  icon="layers-outline"
                  title="No directorate seat yet"
                  body="You have no directorate assignment. Ask your administrator or the HR desk to seat you in a directorate."
                />
              ) : null}

              <RecentActivity
                items={data.activity}
                unreadCount={data.unread}
                onItemPress={openNotification}
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
  root: { flex: 1, backgroundColor: colors.bgBase },
  flex: { flex: 1 },
  body: {
    paddingHorizontal: layout.screenPad,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: { padding: spacing.md },
  manageCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  kicker: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.goldText,
  },
  cardTitle: {
    ...typography.body,
    fontFamily: fonts.display,
    color: colors.textPrimary,
    marginTop: 2,
  },
  captionLine: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
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
