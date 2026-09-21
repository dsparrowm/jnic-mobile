import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePathname } from "expo-router";
import type { BottomTabBarProps } from "expo-router/tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/src/theme/tokens";

type IonName = React.ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<string, { active: IonName; inactive: IonName }> = {
  index: { active: "home", inactive: "home-outline" },
  weekly: { active: "document-text", inactive: "document-text-outline" },
  library: { active: "library", inactive: "library-outline" },
  pastors: { active: "people", inactive: "people-outline" },
  org: { active: "business", inactive: "business-outline" },
  approvals: { active: "checkmark-circle", inactive: "checkmark-circle-outline" },
  summaries: { active: "stats-chart", inactive: "stats-chart-outline" },
  profile: { active: "person-circle", inactive: "person-circle-outline" },
};

function nestedIndex(route: BottomTabBarProps["state"]["routes"][number]): number {
  const nested = route.state;
  if (!nested || typeof nested.index !== "number") return 0;
  return nested.index;
}

export function HqTabBar({
  state,
  descriptors,
  navigation,
  allowed,
}: BottomTabBarProps & { allowed: string[] }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const visible = state.routes.filter((route) => allowed.includes(route.name));
  const hideDock = pathname.startsWith("/weekly/");
  if (hideDock) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      <View style={styles.dock}>
        {visible.map((route) => {
          const focused = state.routes[state.index]?.key === route.key;
          const label = descriptors[route.key].options.title ?? route.name;
          const icons = ICONS[route.name] ?? ICONS.index;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={String(label)}
              accessibilityState={focused ? { selected: true } : {}}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (event.defaultPrevented) return;
                if (route.name === "weekly" || focused || nestedIndex(route) > 0) {
                  navigation.navigate(route.name, { screen: "index" });
                  return;
                }
                navigation.navigate(route.name, route.params);
              }}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
            >
              <Ionicons
                name={focused ? icons.active : icons.inactive}
                size={22}
                color={focused ? colors.gold : colors.textMuted}
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgSurface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.gold,
    fontWeight: "600",
  },
});
