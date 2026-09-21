import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { isAdmin, isHqUser, isLeadPastor } from "@/src/lib/auth";
import { useAuth } from "@/src/lib/session";
import { HqTabBar } from "@/src/components/hq-tab-bar";
import { colors } from "@/src/theme/tokens";

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bgBase,
        }}
      >
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const admin = isAdmin(user);
  const leadPastor = isLeadPastor(user);
  const hq = isHqUser(user);

  // Pastors: Home · Reports · Library · Profile
  // HQ keeps ops tabs; Library is pastor-facing HQ content
  const allowed = hq
    ? [
        "index",
        "weekly",
        ...(admin ? ["pastors", "org"] : []),
        ...(leadPastor ? ["approvals", "summaries"] : []),
        "profile",
      ]
    : ["index", "weekly", "library", "profile"];

  return (
    <Tabs
      backBehavior="initialRoute"
      tabBar={(props) => <HqTabBar {...props} allowed={allowed} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="weekly" options={{ title: "Reports" }} />
      <Tabs.Screen
        name="library"
        options={{ title: "Library", href: hq ? null : "/library" }}
      />
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
        options={{ title: "Summaries", href: leadPastor ? "/summaries" : null }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
