import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, radius, shadow, spacing, typography } from "@/src/theme/tokens";

export function PremiumHeader({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerRow}>
        {icon ? (
          <View style={styles.iconWell}>
            <Ionicons name={icon} size={19} color={colors.gold} />
          </View>
        ) : null}
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.title1,
    color: colors.textOnNavy,
  },
  subtitle: {
    ...typography.footnote,
    color: colors.textOnNavyMuted,
    marginTop: 2,
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
