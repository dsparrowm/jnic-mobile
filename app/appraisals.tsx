import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  api,
  ApiError,
  type AppraisalCounts,
  type AppraisalSubject,
  type PersonnelAppraisalRecord,
} from "@/src/lib/api";
import { Chip, ChipRow, Field, PrimaryButton } from "@/src/components/ui";
import { BottomSheet } from "@/src/components/premium/bottom-sheet";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { StatusPill } from "@/src/components/premium/controls";
import { WeeklyStackBar } from "@/src/components/weekly/stack-bar";
import { colors, layout, spacing, typography } from "@/src/theme/tokens";

const PERIODS = [
  { value: "MID_YEAR", label: "Mid-year" },
  { value: "YEAR_END", label: "Year-end" },
] as const;

const SCORES = [1, 2, 3, 4, 5];

function periodLabel(p: string) {
  return PERIODS.find((x) => x.value === p)?.label ?? p;
}

export default function AppraisalsScreen() {
  const now = new Date();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [period, setPeriod] = useState<string>("YEAR_END");
  const [year, setYear] = useState<number>(now.getFullYear());
  const [rows, setRows] = useState<PersonnelAppraisalRecord[]>([]);
  const [counts, setCounts] = useState<AppraisalCounts | null>(null);
  const [people, setPeople] = useState<AppraisalSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PersonnelAppraisalRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [strengths, setStrengths] = useState("");
  const [development, setDevelopment] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const years = useMemo(
    () => [now.getFullYear(), now.getFullYear() - 1],
    [now],
  );

  const filteredPeople = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return people.slice(0, 8);
    return people
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [people, subjectQuery]);

  const load = useCallback(async () => {
    try {
      const access = await api.myAppraisalAccess();
      setAllowed(access.appraisals);
      if (!access.appraisals) return;
      const [listRes, countsRes, subjectsRes] = await Promise.allSettled([
        api.listAppraisals({ period, year }),
        api.appraisalCounts(year, period),
        api.appraisalSubjects(),
      ]);
      if (listRes.status === "rejected") throw listRes.reason;
      setRows(listRes.value);
      if (countsRes.status === "fulfilled") setCounts(countsRes.value);
      if (subjectsRes.status === "fulfilled") setPeople(subjectsRes.value);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load appraisals",
      );
    } finally {
      setLoading(false);
    }
  }, [period, year]);

  useEffect(() => {
    void load();
  }, [load]);

  function openSheet(existing: PersonnelAppraisalRecord | null) {
    setEditing(existing);
    setSubjectId(existing?.subject.id ?? "");
    setSubjectQuery(existing ? existing.subject.name : "");
    setScore(existing?.score ?? null);
    setStrengths(existing?.strengths ?? "");
    setDevelopment(existing?.development ?? "");
    setRecommendation(existing?.recommendation ?? "");
    setSheetError(null);
    setSheetOpen(true);
  }

  async function save(submitted: boolean) {
    setBusy(true);
    setSheetError(null);
    try {
      const payload = {
        score,
        strengths: strengths.trim() || undefined,
        development: development.trim() || undefined,
        recommendation: recommendation.trim() || undefined,
        submitted,
      };
      if (editing) {
        await api.updateAppraisal(editing.id, payload);
      } else {
        if (!subjectId) {
          setSheetError("Pick who this appraisal is for");
          setBusy(false);
          return;
        }
        await api.upsertAppraisal({
          subjectId,
          period,
          year,
          ...payload,
        });
      }
      setSheetOpen(false);
      await load();
    } catch (err) {
      setSheetError(
        err instanceof ApiError ? err.message : "Could not save appraisal",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <WeeklyStackBar
        title="Appraisals"
        subtitle="Mid-year and year-end reviews"
      />
      {error ? <InlineNotice message={error} /> : null}
      {loading && allowed === null ? (
        <ScreenSkeleton rows={5} />
      ) : allowed === false ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No appraisal access</Text>
          <Text style={styles.emptyBody}>
            Appraisals are run by HR leadership and the Records and Appraisal
            desk.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <ChipRow>
            {PERIODS.map((p) => (
              <Chip
                key={p.value}
                label={p.label}
                active={period === p.value}
                onPress={() => setPeriod(p.value)}
              />
            ))}
          </ChipRow>
          <ChipRow>
            {years.map((y) => (
              <Chip
                key={y}
                label={String(y)}
                active={year === y}
                onPress={() => setYear(y)}
              />
            ))}
          </ChipRow>

          {counts ? (
            <SurfaceCard style={styles.countsCard}>
              <Text style={styles.countsTitle}>
                {`${periodLabel(period)} ${counts.year}`}
              </Text>
              <View style={styles.countsRow}>
                <View style={styles.countCell}>
                  <Text style={styles.countNum}>{counts.submitted}</Text>
                  <Text style={styles.countLabel}>Submitted</Text>
                </View>
                <View style={styles.countCell}>
                  <Text style={styles.countNum}>{counts.total}</Text>
                  <Text style={styles.countLabel}>On file</Text>
                </View>
              </View>
              <Text style={styles.countsHint}>
                "Appraisals completed" on the D-report is the submitted count.
              </Text>
            </SurfaceCard>
          ) : null}

          <SectionHeader
            title={`${periodLabel(period)} ${year}`}
            meta={`${rows.length}`}
          />
          <SurfaceCard style={styles.flushCard}>
            {rows.length === 0 ? (
              <Text style={styles.muted}>No appraisals for this period.</Text>
            ) : (
              rows.map((a, idx) => (
                <Pressable
                  key={a.id}
                  style={[styles.row, idx > 0 && styles.rowDivider]}
                  onPress={() => openSheet(a)}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.rowTitle}>{a.subject.name}</Text>
                    <Text style={styles.rowMeta}>
                      {a.score ? `Score ${a.score}/5 · ` : ""}by{" "}
                      {a.reviewer.name}
                    </Text>
                  </View>
                  <StatusPill
                    label={a.submitted ? "Submitted" : "Draft"}
                    tone={a.submitted ? "success" : "warning"}
                  />
                </Pressable>
              ))
            )}
          </SurfaceCard>

          <PrimaryButton label="New appraisal" onPress={() => openSheet(null)} />
        </ScrollView>
      )}

      <BottomSheet
        visible={sheetOpen}
        onClose={() => (busy ? null : setSheetOpen(false))}
        scrollable
      >
        <SheetHeader
          title={editing ? "Edit appraisal" : "New appraisal"}
          subtitle={`${periodLabel(period)} ${year}`}
          onClose={() => (busy ? null : setSheetOpen(false))}
          closeDisabled={busy}
        />
        {!editing ? (
          <>
            <Field
              label="Person"
              value={subjectQuery}
              onChangeText={(t) => {
                setSubjectQuery(t);
                setSubjectId("");
              }}
              placeholder="Search by name"
            />
            {filteredPeople.length > 0 && !subjectId ? (
              <View style={styles.picker}>
                {filteredPeople.map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.pickerRow}
                    onPress={() => {
                      setSubjectId(p.id);
                      setSubjectQuery(p.name);
                    }}
                  >
                    <Text style={styles.pickerName}>{p.name}</Text>
                    <Text style={styles.pickerMeta}>
                      {p.role.replace(/_/g, " ")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        <Text style={styles.scoreLabel}>Overall score</Text>
        <ChipRow>
          {SCORES.map((s) => (
            <Chip
              key={s}
              label={String(s)}
              active={score === s}
              onPress={() => setScore(score === s ? null : s)}
            />
          ))}
        </ChipRow>
        <Field
          label="Strengths"
          value={strengths}
          onChangeText={setStrengths}
          multiline
          placeholder="What they did well this period"
        />
        <Field
          label="Development areas"
          value={development}
          onChangeText={setDevelopment}
          multiline
          placeholder="What to grow next period"
        />
        <Field
          label="Recommendation (optional)"
          value={recommendation}
          onChangeText={setRecommendation}
          placeholder="e.g. confirm in role, promote, watch"
        />
        {sheetError ? <InlineNotice message={sheetError} /> : null}
        <View style={styles.sheetActions}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Save draft"
              loading={busy}
              onPress={() => void save(false)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Submit"
              loading={busy}
              onPress={() => void save(true)}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  body: {
    paddingHorizontal: layout.screenPad,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  countsCard: { padding: spacing.md, gap: spacing.sm },
  countsTitle: { ...typography.title3, color: colors.textPrimary },
  countsRow: { flexDirection: "row", gap: spacing.md },
  countCell: { flex: 1, alignItems: "center", gap: 2 },
  countNum: { ...typography.title2, color: colors.goldText },
  countLabel: { ...typography.caption, color: colors.textMuted },
  countsHint: { ...typography.caption, color: colors.textMuted },
  flushCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  rowTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  rowMeta: { ...typography.caption, color: colors.textMuted },
  muted: {
    ...typography.body,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
  picker: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    overflow: "hidden",
  },
  pickerRow: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  pickerName: { ...typography.bodyStrong, color: colors.textPrimary },
  pickerMeta: { ...typography.caption, color: colors.textMuted },
  scoreLabel: { ...typography.caption, color: colors.textMuted },
  sheetActions: { flexDirection: "row", gap: spacing.sm },
  empty: {
    padding: layout.screenPad,
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.title3, color: colors.textPrimary },
  emptyBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
