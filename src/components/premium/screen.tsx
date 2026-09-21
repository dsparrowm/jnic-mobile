import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, radius, shadow, spacing, typography } from "@/src/theme/tokens";

export function PremiumHeader({
  title,
  subtitle,
  icon,
  right,
  tone = "light",
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  right?: React.ReactNode;
  tone?: "navy" | "light";
}) {
  const insets = useSafeAreaInsets();
  const light = tone === "light";
  return (
    <View
      style={[
        styles.header,
        light && styles.headerLight,
        { paddingTop: insets.top + spacing.md },
      ]}
    >
      <View style={styles.headerRow}>
        {icon ? (
          <View style={[styles.iconWell, light && styles.iconWellLight]}>
            <Ionicons
              name={icon}
              size={19}
              color={light ? colors.navy : colors.gold}
            />
          </View>
        ) : null}
        <View style={styles.headerCopy}>
          <Text style={[styles.title, light && styles.titleLight]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, light && styles.subtitleLight]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function SurfaceCard({
  children,
  style,
  elevated = false,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}) {
  return (
    <View style={[styles.surface, elevated && shadow.soft, style]}>
      {children}
    </View>
  );
}

export function SectionHeader({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{title}</Text>
      {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -layout.screenPad,
    paddingHorizontal: layout.screenPad,
    paddingBottom: 38,
    backgroundColor: colors.navy,
    marginBottom: -16,
  },
  headerLight: {
    backgroundColor: colors.bgBase,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  headerRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWell: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.goldSoft,
  },
  iconWellLight: {
    backgroundColor: colors.bgSubtle,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.title1,
    color: colors.textOnNavy,
  },
  titleLight: {
    color: colors.navy,
  },
  subtitle: {
    ...typography.footnote,
    color: colors.textOnNavyMuted,
    marginTop: 2,
  },
  subtitleLight: {
    color: colors.textMuted,
  },

  surface: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  sectionRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  section: {
    ...typography.overline,
    color: colors.textMuted,
  },
  sectionMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
