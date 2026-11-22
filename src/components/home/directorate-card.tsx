import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { api, type AuthUser } from "@/src/lib/api";
import { SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { colors, fonts, radius, spacing, typography } from "@/src/theme/tokens";

const OFFICE_LABELS: Record<string, string> = {
  DIRECTOR: "Director",
  DEPUTY_DIRECTOR: "Deputy Director",
  SECRETARY: "Secretary",
  DESK_HEAD: "Desk Head",
  DEPUTY_DESK_HEAD: "Deputy Desk Head",
  MEMBER: "Member",
};

/** Directorate line for dual-seat people — their seat + link to the roster. */
export function DirectorateCard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const directorate = user.directorate;
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    if (!directorate) return;
    api
      .listMyReportTemplates()
      .then((templates) => setDueCount(templates.length))
      .catch(() => setDueCount(null));
  }, [directorate]);

  if (!directorate) return null;

  const seat = OFFICE_LABELS[directorate.office] ?? directorate.office;
  const desk = directorate.deskName ? ` · ${directorate.deskName}` : "";

  return (
    <>
      <SectionHeader title="Directorate" />
      <SurfaceCard style={styles.card}>
        <Pressable
          style={styles.row}
          onPress={() =>
            router.push(`/directorates/${directorate.directorateId}` as never)
          }
        >
          <View style={styles.icon}>
            <Ionicons name="layers-outline" size={18} color={colors.goldText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{directorate.directorateName}</Text>
            <Text style={styles.detail} numberOfLines={2}>
              {seat}
              {desk}
            </Text>
            {dueCount !== null && dueCount > 0 ? (
              <Text style={styles.due}>
                {dueCount} report{dueCount === 1 ? "" : "s"} due from you
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      </SurfaceCard>
    </>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.navyMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.body,
    fontWeight: "600",
    fontFamily: fonts.display,
    color: colors.textPrimary,
  },
  detail: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  due: { ...typography.caption, color: colors.goldText, marginTop: 3 },
});
