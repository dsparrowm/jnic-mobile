import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { AuthProvider, useAuth } from "@/src/lib/session";
import { colors } from "@/src/theme/tokens";

function PhonePreview({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") return <>{children}</>;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.previewBackdrop,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 390,
          height: 844,
          maxHeight: "100%",
          overflow: "hidden",
          borderRadius: 32,
          backgroundColor: colors.bgBase,
          borderWidth: 8,
          borderColor: colors.previewBorder,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "login";
    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, loading, segments, router]);

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
        <StatusBar style="light" />
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <PhonePreview>
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bgBase },
              animation: "fade",
            }}
          >
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="notifications"
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen name="unavailable" />
          </Stack>
        </AuthGate>
      </PhonePreview>
    </AuthProvider>
  );
}
