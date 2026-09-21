import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatRoleShort, greetingName, timeOfDayGreeting } from "@/src/lib/format";
import type { AuthUser } from "@/src/lib/api";
import { isHqUser } from "@/src/lib/auth";
import { Avatar } from "@/src/components/ui";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

export function HomeHero({
  user,
  weekLabel,
  topInset,
  branchName,
  location,
  tone = "navy",
  statusLine,
  trailing,
}: {
  user: AuthUser | null;
  weekLabel?: string;
  topInset: number;
  branchName?: string | null;
  location?: string | null;
  tone?: "navy" | "light";
  statusLine?: string | null;
  trailing?: ReactNode;
}) {
  const light = tone === "light";
  const name = greetingName(user);

  if (light) {
    const subtitle = branchName ?? statusLine;

    return (
      <View style={[styles.lightHero, { paddingTop: topInset + spacing.md }]}>
        {trailing ? (
          <View style={[styles.trailingAnchor, { top: topInset + spacing.sm }]}>
            {trailing}
          </View>
        ) : null}
        <View
          style={[
            styles.identity,
            trailing ? styles.identityWithTrailing : undefined,
          ]}
        >
          <Avatar name={user?.name} imageUri={user?.profilePicUrl} size={44} />
          <View style={styles.copy}>
            <Text style={styles.lightGreeting}>
              {timeOfDayGreeting()}, {name}
            </Text>
            {subtitle ? (
              <Text style={styles.lightSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {location ? (
              <Text style={styles.lightMeta} numberOfLines={1}>
                {location}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.hero, { paddingTop: topInset + spacing.md }]}>
      {trailing ? (
        <View style={[styles.trailingAnchor, { top: topInset + spacing.sm }]}>
          {trailing}
        </View>
      ) : null}
      <View
        style={[
          styles.identity,
          trailing ? styles.identityWithTrailing : undefined,
        ]}
      >
        <Avatar name={user?.name} imageUri={user?.profilePicUrl} size={46} />
        <View style={styles.copy}>
          <Text style={styles.greeting}>{timeOfDayGreeting()}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText} numberOfLines={1}>
            {user ? formatRoleShort(user.role) : "HQ"}
          </Text>
        </View>
      </View>
      <Text style={styles.week}>
        {[
          branchName ?? user?.branchName,
          weekLabel
            ? `Week ending ${weekLabel}`
            : isHqUser(user)
              ? "National operations overview"
              : "Loading this week…",
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    backgroundColor: colors.navy,
    paddingHorizontal: layout.screenPad,
    paddingBottom: spacing.lg,
  },
  lightHero: {
    position: "relative",
    backgroundColor: colors.bgBase,
    paddingHorizontal: layout.screenPad,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  trailingAnchor: {
    position: "absolute",
    right: layout.screenPad,
    zIndex: 1,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  identityWithTrailing: {
    paddingRight: 48,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    ...typography.footnote,
    color: colors.textOnNavyMuted,
  },
  name: {
    ...typography.title2,
    color: colors.textOnNavy,
  },
  lightGreeting: {
    ...typography.title3,
    color: colors.navy,
  },
  lightSubtitle: {
    ...typography.callout,
    color: colors.navy,
    marginTop: 2,
  },
  lightMeta: {
    ...typography.footnote,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.goldSoft,
  },
  roleText: {
    ...typography.overline,
    color: colors.gold,
  },
  week: {
    ...typography.caption,
    color: colors.textOnNavyMuted,
    marginTop: spacing.md,
  },
});
