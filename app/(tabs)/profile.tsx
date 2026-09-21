import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { ProfileHero } from "@/src/components/profile/profile-hero";
import {
  ProfileInfoRow,
  ProfileLinkRow,
  ProfileSection,
} from "@/src/components/profile/profile-section";
import { ScreenErrorState, ScreenSkeleton } from "@/src/components/premium/states";
import { api, ApiError, type UserRecord } from "@/src/lib/api";
import { buildAssignmentView } from "@/src/lib/assignment";
import { isAdmin, isHqUser, isLeadPastor } from "@/src/lib/auth";
import { formatMemberSince } from "@/src/lib/format";
import { useProfilePicture } from "@/src/hooks/use-profile-picture";
import { useAuth } from "@/src/lib/session";
import { colors, layout, spacing, typography } from "@/src/theme/tokens";

export default function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadProfile = useCallback(async () => {
    setError(null);
    try {
      const me = await api.getMe();
      setProfile(me);
      await refreshUser();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const { uploading, previewUri, pickAndUpload } = useProfilePicture(loadProfile);

  async function onLogout() {
    setBusy(true);
    try {
      await signOut();
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  }

  const assignment = buildAssignmentView(profile ?? user);
  const appVersion = Constants.expoConfig?.version ?? "0.1.0";

  const shortcuts = [
    {
      label: "Notifications",
      onPress: () => router.push("/notifications" as never),
    },
    {
      label: "Weekly reports",
      onPress: () => router.navigate("/weekly" as never),
    },
    ...(!isHqUser(user)
      ? [
          {
            label: "Library",
            onPress: () => router.navigate("/library" as never),
          },
        ]
      : []),
    ...(isAdmin(user)
      ? [
          {
            label: "Pastors",
            onPress: () => router.navigate("/pastors" as never),
          },
        ]
      : []),
    ...(isLeadPastor(user)
      ? [
          {
            label: "Summaries",
            onPress: () => router.navigate("/summaries" as never),
          },
        ]
      : []),
  ];

  return (
    <View style={styles.root}>
      <ProfileHero
        user={user}
        title={assignment.title}
        meta={assignment.meta}
        topInset={insets.top}
        imageUri={previewUri ?? profile?.profilePicUrl ?? user?.profilePicUrl}
        uploading={uploading}
        onPhotoPress={() => void pickAndUpload()}
      />
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xxl + insets.bottom },
        ]}
      >
        {loading && !profile ? <ScreenSkeleton /> : null}
        {error && !profile ? (
          <ScreenErrorState message={error} onRetry={() => void loadProfile()} />
        ) : null}

        {profile ? (
          <View style={styles.body}>
            <ProfileSection title="Account">
              <ProfileInfoRow label="Email" value={profile.email} />
              {profile.phone ? (
                <ProfileInfoRow label="Phone" value={profile.phone} />
              ) : null}
              <ProfileInfoRow
                label="Member since"
                value={formatMemberSince(profile.createdAt)}
                last
              />
            </ProfileSection>

            <ProfileSection title="Assignment">
              <View style={styles.assignmentBody}>
                <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                {assignment.meta ? (
                  <Text style={styles.assignmentMeta}>{assignment.meta}</Text>
                ) : null}
                {assignment.footnote ? (
                  <Text style={styles.assignmentFootnote}>
                    {assignment.footnote}
                  </Text>
                ) : null}
              </View>
            </ProfileSection>

            <ProfileSection title="App">
              {shortcuts.map((item, index) => (
                <ProfileLinkRow
                  key={item.label}
                  label={item.label}
                  onPress={item.onPress}
                  last={index === shortcuts.length - 1}
                />
              ))}
            </ProfileSection>

            <ProfileSection title="Session">
              <ProfileLinkRow
                label={busy ? "Signing out…" : "Sign out"}
                onPress={() => void onLogout()}
                destructive
                last
              />
            </ProfileSection>

            <Text style={styles.footer}>JNLOP · v{appVersion}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  body: {
    paddingHorizontal: layout.screenPad,
    gap: spacing.lg,
  },
  assignmentBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  assignmentTitle: {
    ...typography.callout,
    color: colors.navy,
    fontWeight: "700",
  },
  assignmentMeta: {
    ...typography.footnote,
    color: colors.textMuted,
  },
  assignmentFootnote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
