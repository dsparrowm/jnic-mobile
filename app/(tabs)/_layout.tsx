import { Redirect, Tabs } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ActivityIndicator, View } from "react-native";
import { isAdmin, isLeadPastor } from "@/src/lib/auth";
import { useAuth } from "@/src/lib/session";
import { colors } from "@/src/theme/tokens";

function TabIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return (
    <FontAwesome size={22} style={{ marginBottom: -2 }} name={props.name} color={props.color} />
  );
}

export default function TabsLayout() {
  const { user, loading, isHq } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!isHq) {
    return <Redirect href="/unavailable" />;
  }

  const admin = isAdmin(user);
  const leadPastor = isLeadPastor(user);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSurface },
        headerTintColor: colors.navy,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="pastors"
        options={{
          title: "Pastors",
          href: admin ? "/pastors" : null,
          tabBarIcon: ({ color }) => <TabIcon name="users" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="org"
        options={{
          title: "Org",
          href: admin ? "/org" : null,
          tabBarIcon: ({ color }) => <TabIcon name="sitemap" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: "Approvals",
          href: leadPastor ? "/approvals" : null,
          tabBarIcon: ({ color }) => (
            <TabIcon name="check-square-o" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="summaries"
        options={{
          title: "Summaries",
          tabBarIcon: ({ color }) => (
            <TabIcon name="bar-chart" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon name="user" color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
