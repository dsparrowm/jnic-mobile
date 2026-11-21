import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  api,
  type MyReportTemplate,
  type TemplateReportRecord,
} from "@/src/lib/api";
import { useAuth } from "@/src/lib/session";
import { Field, GhostButton, PrimaryButton } from "@/src/components/ui";
import { BottomSheet } from "@/src/components/premium/bottom-sheet";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { WeeklyStackBar } from "@/src/components/weekly/stack-bar";
import { colors, fonts, radius, spacing, typography } from "@/src/theme/tokens";

function periodKeyFor(cadence: MyReportTemplate["cadence"]): string {
  const now = new Date();
  const y = now.getFullYear();
  if (cadence === "WEEKLY") {
    const start = new Date(Date.UTC(y, 0, 1));
    const week = Math.ceil(
      (((now.getTime() - start.getTime()) / 86400000 + start.getUTCDay() + 1) /
        7),
    );
    return `${y}-W${String(week).padStart(2, "0")}`;
  }
  if (cadence === "MONTHLY") return `${y}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (cadence === "QUARTERLY") return `${y}-Q${Math.floor(now.getMonth() / 3) + 1}`;
  return String(y);
}

function cadenceLabel(t: MyReportTemplate): string {
  const due =
    t.cadence === "WEEKLY"
      ? "Mondays"
      : t.dueDay
        ? `${t.dueDay}${t.dueDay === 3 ? "rd" : "th"} monthly`
        : t.cadence.toLowerCase();
  return `${t.code} · ${due}`;
}

export default function DutiesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState<MyReportTemplate[]>([]);
  const [queue, setQueue] = useState<TemplateReportRecord[]>([]);
  const [mine, setMine] = useState<TemplateReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<MyReportTemplate | null>(null);
  const [scopeIdx, setScopeIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, q, m] = await Promise.all([
        api.listMyReportTemplates(),
        api.listTemplateReviewQueue(),
        api.listMyTemplateReports(),
      ]);
      setTemplates(t);
      setQueue(q);
      setMine(m);
    } catch {
      setError("Could not load directorate reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openSubmit(t: MyReportTemplate) {
    setSubmitting(t);
    setScopeIdx(0);
    setAnswers({});
    setFormError(null);
  }

  async function sendReport() {
    if (!submitting) return;
    const scope = submitting.scopes[scopeIdx];
    if (!scope) return;
    const missing = submitting.fields.filter((f) => !answers[f.key]?.trim());
    if (missing.length > submitting.fields.length) return;
    setSaving(true);
    setFormError(null);
    try {
      await api.submitTemplateReport(submitting.id, {
        periodKey: periodKeyFor(submitting.cadence),
        scope: { serviceUnitId: scope.serviceUnitId, deskId: scope.deskId },
        data: answers,
      });
      setSubmitting(null);
      await load();
    } catch {
      setFormError("Could not submit. Check your entries and retry.");
    } finally {
      setSaving(false);
    }
  }

  async function review(reportId: string) {
    try {
      await api.reviewTemplateReport(reportId);
      await load();
    } catch {
      setError("Could not record the review.");
    }
  }

  if (!user) return null;

  return (
    <View style={styles.root}>
      <WeeklyStackBar
        title="Directorate duties"
        subtitle="Reports for your desk, unit and directorate seats"
      />
      {loading ? (
        <ScreenSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        >
          {error ? <InlineNotice message={error} /> : null}

          <SectionHeader title="Due from me" />
          {templates.length === 0 ? (
            <SurfaceCard>
              <Text style={styles.emptyTitle}>
                {user.directorate
                  ? `You are ${user.directorate.office
                      .toLowerCase()
                      .replace(/_/g, " ")} — ${user.directorate.directorateName}`
                  : "No directorate seat yet"}
              </Text>
              <Text style={styles.empty}>
                {user.directorate
                  ? "This seat has no reports due right now. Unit coordinators file D1/D2, desk heads file D3, and directors file D4–D6."
                  : "D1–D6 reports appear here once HQ seats you in a directorate — as a unit coordinator, desk head or director. Your territorial (branch/zone/state) reports stay on the Weekly tab."}
              </Text>
            </SurfaceCard>
          ) : (
            templates.map((t) => (
              <SurfaceCard key={t.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{t.name}</Text>
                    <Text style={styles.cardMeta}>
                      {t.directorate.name} · {cadenceLabel(t)}
                    </Text>
                  </View>
                  <PrimaryButton
                    label="Submit"
                    onPress={() => openSubmit(t)}
                  />
                </View>
                {t.scopes.map((s) => (
                  <Text key={s.label} style={styles.scope}>
                    {s.label}
                  </Text>
                ))}
              </SurfaceCard>
            ))
          )}

          {queue.length > 0 ? (
            <>
              <SectionHeader title="Awaiting my review" />
              {queue.map((r) => (
                <SurfaceCard key={r.id} style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {r.template.code} — {r.template.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {r.template.directorate.name} · {r.periodKey}
                    {r.serviceUnit
                      ? ` · ${r.serviceUnit.unitType.name}, ${r.serviceUnit.branch.name}`
                      : ""}
                    {r.submittedBy ? ` · by ${r.submittedBy.name}` : ""}
                  </Text>
                  {Object.entries(r.data ?? {}).map(([k, v]) => (
                    <Text key={k} style={styles.dataRow}>
                      <Text style={styles.dataKey}>{k.replace(/_/g, " ")}:</Text>{" "}
                      {String(v)}
                    </Text>
                  ))}
                  <PrimaryButton
                    label="Mark reviewed"
                    onPress={() => void review(r.id)}
                  />
                </SurfaceCard>
              ))}
            </>
          ) : null}

          {mine.length > 0 ? (
            <>
              <SectionHeader title="My submissions" />
              {mine.map((r) => (
                <SurfaceCard key={r.id} style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {r.template.code} — {r.periodKey}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {r.template.directorate.name} · {r.status.replace(/_/g, " ")}
                  </Text>
                </SurfaceCard>
              ))}
            </>
          ) : null}
        </ScrollView>
      )}

      <BottomSheet visible={!!submitting} onClose={() => setSubmitting(null)}>
        {submitting ? (
          <View>
            <SheetHeader
              title={submitting.name}
              subtitle={`${submitting.directorate.name} · ${periodKeyFor(
                submitting.cadence,
              )}`}
              onClose={() => setSubmitting(null)}
            />
            {submitting.scopes.length > 1 ? (
              <View style={styles.scopePicker}>
                {submitting.scopes.map((s, i) => (
                  <Pressable
                    key={s.label}
                    onPress={() => setScopeIdx(i)}
                    style={[
                      styles.scopeChip,
                      i === scopeIdx && styles.scopeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.scopeChipText,
                        i === scopeIdx && styles.scopeChipTextActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {submitting.fields.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                value={answers[f.key] ?? ""}
                onChangeText={(text: string) =>
                  setAnswers((a) => ({ ...a, [f.key]: text }))
                }
                keyboardType={f.type === "number" ? "numeric" : "default"}
                multiline={f.type === "textarea"}
              />
            ))}
            {formError ? <InlineNotice message={formError} /> : null}
            <PrimaryButton
              label={saving ? "Submitting…" : "Submit report"}
              onPress={() => void sendReport()}
              disabled={saving}
            />
            <GhostButton label="Cancel" onPress={() => setSubmitting(null)} />
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  card: { gap: spacing.xs },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: typography.title3.fontSize,
    color: colors.textPrimary,
  },
  cardMeta: { ...typography.caption, color: colors.textMuted },
  scope: { ...typography.caption, color: colors.textMuted },
  dataRow: { ...typography.body, color: colors.textPrimary },
  dataKey: { fontFamily: fonts.medium, textTransform: "capitalize" },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: typography.title3.fontSize,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  empty: { ...typography.body, color: colors.textMuted },
  scopePicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  scopeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scopeChipActive: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  scopeChipText: { ...typography.caption, color: colors.textMuted },
  scopeChipTextActive: { color: colors.gold },
});
