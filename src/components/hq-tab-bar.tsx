import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "expo-router/tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/src/theme/tokens";

type IonName = React.ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<string, { active: IonName; inactive: IonName }> = {
  index: { active: "home", inactive: "home-outline" },
  pastors: { active: "people", inactive: "people-outline" },
  org: { active: "business", inactive: "business-outline" },
  approvals: { active: "checkmark-circle", inactive: "checkmark-circle-outline" },
  summaries: { active: "stats-chart", inactive: "stats-chart-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

export function HqTabBar({
  state,
  descriptors,
  navigation,
  allowed,
}: BottomTabBarProps & { allowed: string[] }) {
  const insets = useSafeAreaInsets();
  const visible = state.routes.filter((route) => allowed.includes(route.name));

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.dock, shadow.float]}>
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
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.iconWell, focused && styles.iconWellActive]}>
                <Ionicons
                  name={focused ? icons.active : icons.inactive}
                  size={20}
                  color={focused ? colors.navy : "rgba(248,250,252,0.55)"}
                />
              </View>
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
    backgroundColor: colors.bgBase,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.navyDeep,
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 8,
    minHeight: 64,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconWell: {
    width: 36,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWellActive: {
    backgroundColor: colors.gold,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: "rgba(248,250,252,0.5)",
  },
  labelActive: {
    color: colors.gold,
  },
});
