import { StyleSheet, Text, View } from "react-native";
import { formatRole, greetingName, timeOfDayGreeting } from "@/src/lib/format";
import type { AuthUser } from "@/src/lib/api";
import { Avatar } from "@/src/components/ui";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

export function HomeHero({
  user,
  weekLabel,
  topInset,
}: {
  user: AuthUser | null;
  weekLabel?: string;
  topInset: number;
}) {
  return (
    <View style={[styles.hero, { paddingTop: topInset + spacing.md }]}>
      <View style={styles.identity}>
        <Avatar
          name={user?.name}
          imageUri={user?.profilePicUrl}
          size={46}
        />
        <View style={styles.copy}>
          <Text style={styles.greeting}>{timeOfDayGreeting()}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {greetingName(user)}
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText} numberOfLines={1}>
            {user ? formatRole(user.role) : "HQ"}
          </Text>
        </View>
      </View>
      <Text style={styles.week}>
        {weekLabel ? `Week ending ${weekLabel}` : "National operations overview"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: layout.screenPad,
    paddingBottom: 42,
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
  greeting: {
    ...typography.footnote,
    color: colors.textOnNavyMuted,
  },
  name: {
    ...typography.title2,
    color: colors.textOnNavy,
  },
  roleBadge: {
    maxWidth: 108,
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
