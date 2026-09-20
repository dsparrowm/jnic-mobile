import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { isAdmin, isLeadPastor } from "@/src/lib/auth";
import { useAuth } from "@/src/lib/session";
import { HqTabBar } from "@/src/components/hq-tab-bar";
import { colors } from "@/src/theme/tokens";

export default function TabsLayout() {
  const { user, loading, isHq } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.navy,
        }}
      >
        <ActivityIndicator color={colors.gold} />
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
  const allowed = [
    "index",
    ...(admin ? ["pastors", "org"] : []),
    ...(leadPastor ? ["approvals", "summaries"] : []),
    "profile",
  ];

  return (
    <Tabs
      backBehavior="initialRoute"
      tabBar={(props) => <HqTabBar {...props} allowed={allowed} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen
        name="pastors"
        options={{ title: "Pastors", href: admin ? "/pastors" : null }}
      />
      <Tabs.Screen
        name="org"
        options={{ title: "Org", href: admin ? "/org" : null }}
      />
      <Tabs.Screen
        name="approvals"
        options={{ title: "Approve", href: leadPastor ? "/approvals" : null }}
      />
      <Tabs.Screen
        name="summaries"
        options={{ title: "Reports", href: leadPastor ? "/summaries" : null }}
      />
      <Tabs.Screen name="profile" options={{ title: "You" }} />
    </Tabs>
  );
}
