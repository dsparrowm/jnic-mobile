import { StyleSheet, Text, View } from "react-native";
import type { AuthUser } from "@/src/lib/api";
import { Avatar } from "@/src/components/ui";
import { formatRoleShort } from "@/src/lib/format";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

export function ReportsHero({
  user,
  title,
  subtitle,
  meta,
  topInset,
  tone = "light",
}: {
  user: AuthUser | null;
  title: string;
  subtitle?: string;
  meta?: string | null;
  topInset: number;
  tone?: "navy" | "light";
}) {
  const light = tone === "light";

  if (light) {
    return (
      <View style={[styles.lightHero, { paddingTop: topInset + spacing.md }]}>
        <View style={styles.identity}>
          <Avatar name={user?.name} imageUri={user?.profilePicUrl} size={44} />
          <View style={styles.copy}>
            <Text style={styles.lightTitle}>{title}</Text>
            {subtitle ? (
              <Text style={styles.lightSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {meta ? (
              <Text style={styles.lightMeta} numberOfLines={1}>
                {meta}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.navyHero, { paddingTop: topInset + spacing.md }]}>
      <View style={styles.identity}>
        <Avatar name={user?.name} imageUri={user?.profilePicUrl} size={46} />
        <View style={styles.copy}>
          <Text style={styles.navyTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.navySubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText} numberOfLines={1}>
            {user ? formatRoleShort(user.role) : "HQ"}
          </Text>
        </View>
      </View>
      {meta ? <Text style={styles.navyMeta}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lightHero: {
    backgroundColor: colors.bgBase,
    paddingHorizontal: layout.screenPad,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  navyHero: {
    backgroundColor: colors.navy,
    paddingHorizontal: layout.screenPad,
    paddingBottom: spacing.lg,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  lightTitle: {
    ...typography.title2,
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
  navyTitle: {
    ...typography.title2,
    color: colors.textOnNavy,
  },
  navySubtitle: {
    ...typography.footnote,
    color: colors.textOnNavyMuted,
    marginTop: 2,
  },
  navyMeta: {
    ...typography.caption,
    color: colors.textOnNavyMuted,
    marginTop: spacing.md,
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
});
