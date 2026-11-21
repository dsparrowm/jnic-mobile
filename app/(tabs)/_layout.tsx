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
        <ActivityIndicator color={colors.goldText} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const admin = isAdmin(user);
  const leadPastor = isLeadPastor(user);
  const hq = isHqUser(user);
  const hrPersonnel = user.hrPersonnel === true;

  // Pastors: Home · Reports · Library · Profile
  // HQ keeps ops tabs; Library is pastor-facing HQ content
  // Seated HR personnel get the people desk regardless of role
  const allowed = hq
    ? [
        "index",
        "weekly",
        ...(admin ? ["pastors", "org"] : []),
        ...(leadPastor ? ["approvals", "summaries"] : []),
        "profile",
      ]
    : [
        "index",
        "weekly",
        ...(hrPersonnel ? ["pastors"] : []),
        "library",
        "profile",
      ];

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
        options={{
          title: "People",
          href: admin || hrPersonnel ? "/pastors" : null,
        }}
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
