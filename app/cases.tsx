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
  type CaseRegisters,
  type PersonnelCaseCounts,
  type PersonnelCaseRecord,
} from "@/src/lib/api";
import { Chip, ChipRow, Field, PrimaryButton } from "@/src/components/ui";
import { BottomSheet } from "@/src/components/premium/bottom-sheet";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { StatusPill } from "@/src/components/premium/controls";
import { WeeklyStackBar } from "@/src/components/weekly/stack-bar";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

const KINDS = [
  { value: "WELFARE", label: "Welfare", desk: "Pastoral Welfare and Care" },
  {
    value: "DISCIPLINE",
    label: "Discipline",
    desk: "Ethics, Conduct and Discipline",
  },
] as const;

const STATUSES = [
  { value: "OPEN", label: "Open", tone: "warning" as const },
  { value: "RESOLVED", label: "Resolved", tone: "success" as const },
  { value: "CLOSED", label: "Closed", tone: "neutral" as const },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function statusMeta(status: string) {
  return STATUSES.find((s) => s.value === status) ?? STATUSES[0];
}

export default function CasesScreen() {
  const [registers, setRegisters] = useState<CaseRegisters | null>(null);
  const [kind, setKind] = useState<string>("WELFARE");
  const [status, setStatus] = useState<string>("");
  const [cases, setCases] = useState<PersonnelCaseRecord[]>([]);
  const [counts, setCounts] = useState<PersonnelCaseCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<PersonnelCaseRecord | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [newKind, setNewKind] = useState<string>("WELFARE");

  const visibleKinds = useMemo(
    () =>
      registers
        ? KINDS.filter((k) =>
            k.value === "WELFARE" ? registers.welfare : registers.discipline,
          )
        : [],
    [registers],
  );

  const load = useCallback(async () => {
    try {
      const [regs, list] = await Promise.all([
        api.myCaseRegisters(),
        api.listCases({ kind, status: status || undefined }),
      ]);
      setRegisters(regs);
      setCases(list);
      const now = new Date();
      setCounts(
        await api.caseCounts(kind, now.getFullYear(), now.getMonth() + 1).catch(
          () => null,
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load registers",
      );
    } finally {
      setLoading(false);
    }
  }, [kind, status]);

  useEffect(() => {
    void load();
  }, [load]);

  // Default the kind tab to the first register the user manages.
  useEffect(() => {
    if (registers && !visibleKinds.some((k) => k.value === kind)) {
      if (visibleKinds[0]) setKind(visibleKinds[0].value);
    }
  }, [registers, visibleKinds, kind]);

  async function submitNew() {
    if (!newTitle.trim()) return;
    setBusy(true);
    setSheetError(null);
    try {
      await api.createCase({
        kind: newKind,
        title: newTitle.trim(),
        detail: newDetail.trim() || undefined,
      });
      setNewOpen(false);
      setNewTitle("");
      setNewDetail("");
      if (newKind !== kind) setKind(newKind);
      else await load();
    } catch (err) {
      setSheetError(
        err instanceof ApiError ? err.message : "Could not open case",
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(next: string) {
    if (!selected) return;
    setBusy(true);
    setSheetError(null);
    try {
      await api.updateCase(selected.id, {
        status: next,
        resolution: resolution.trim() || undefined,
      });
      setSelected(null);
      setResolution("");
      await load();
    } catch (err) {
      setSheetError(
        err instanceof ApiError ? err.message : "Could not update case",
      );
    } finally {
      setBusy(false);
    }
  }

  const kindLabel = KINDS.find((k) => k.value === kind)?.label ?? kind;

  return (
    <View style={styles.root}>
      <WeeklyStackBar
        title="Case registers"
        subtitle="Welfare and discipline — confidential"
      />
      {error ? <InlineNotice message={error} /> : null}
      {loading && !registers ? (
        <ScreenSkeleton rows={5} />
      ) : !registers || visibleKinds.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No register access</Text>
          <Text style={styles.emptyBody}>
            Case registers are managed by HR leadership and the welfare and
            conduct desks.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {visibleKinds.length > 1 ? (
            <ChipRow>
              {visibleKinds.map((k) => (
                <Chip
                  key={k.value}
                  label={k.label}
                  active={kind === k.value}
                  onPress={() => setKind(k.value)}
                />
              ))}
            </ChipRow>
          ) : null}

          {counts ? (
            <SurfaceCard style={styles.countsCard}>
              <Text style={styles.countsTitle}>
                {`${kindLabel} — ${MONTHS[counts.month - 1]} ${counts.year}`}
              </Text>
              <View style={styles.countsRow}>
                <View style={styles.countCell}>
                  <Text style={styles.countNum}>{counts.opened}</Text>
                  <Text style={styles.countLabel}>Opened</Text>
                </View>
                <View style={styles.countCell}>
                  <Text style={styles.countNum}>{counts.closed}</Text>
                  <Text style={styles.countLabel}>Closed</Text>
                </View>
                <View style={styles.countCell}>
                  <Text style={styles.countNum}>{counts.openNow}</Text>
                  <Text style={styles.countLabel}>Open now</Text>
                </View>
              </View>
              <Text style={styles.countsHint}>
                Counts only — the D-report asks for these figures, never names.
              </Text>
            </SurfaceCard>
          ) : null}

          <ChipRow>
            <Chip
              label="All"
              active={status === ""}
              onPress={() => setStatus("")}
            />
            {STATUSES.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                active={status === s.value}
                onPress={() => setStatus(s.value)}
              />
            ))}
          </ChipRow>

          <SectionHeader title={`${kindLabel} cases`} meta={`${cases.length}`} />
          <SurfaceCard style={styles.flushCard}>
            {cases.length === 0 ? (
              <Text style={styles.muted}>No cases match this filter.</Text>
            ) : (
              cases.map((c, idx) => {
                const meta = statusMeta(c.status);
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.caseRow, idx > 0 && styles.rowDivider]}
                    onPress={() => {
                      setSelected(c);
                      setResolution(c.resolution ?? "");
                      setSheetError(null);
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.caseTitle} numberOfLines={2}>
                        {c.title}
                      </Text>
                      <Text style={styles.caseMeta}>
                        {c.subject ? c.subject.name : "No subject"} · opened{" "}
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                    </View>
                    <StatusPill label={meta.label} tone={meta.tone} />
                  </Pressable>
                );
              })
            )}
          </SurfaceCard>

          <PrimaryButton label="Open case" onPress={() => {
            setNewKind(kind);
            setSheetError(null);
            setNewOpen(true);
          }} />
        </ScrollView>
      )}

      <BottomSheet
        visible={selected !== null}
        onClose={() => (busy ? null : setSelected(null))}
        scrollable
      >
        {selected ? (
          <>
            <SheetHeader
              title={selected.title}
              subtitle={`${kindLabel} case · ${statusMeta(selected.status).label}`}
              onClose={() => (busy ? null : setSelected(null))}
              closeDisabled={busy}
            />
            {selected.subject ? (
              <Text style={styles.detailLabel}>
                Subject: {selected.subject.name} ({selected.subject.role.replace(/_/g, " ")})
              </Text>
            ) : null}
            {selected.detail ? (
              <Text style={styles.detailBody}>{selected.detail}</Text>
            ) : null}
            <Text style={styles.detailLabel}>
              Opened by {selected.openedBy.name}
            </Text>
            {selected.status === "OPEN" ? (
              <>
                <Field
                  label="Resolution note (optional)"
                  value={resolution}
                  onChangeText={setResolution}
                  multiline
                  placeholder="How the case was handled"
                />
                {sheetError ? <InlineNotice message={sheetError} /> : null}
                <View style={styles.sheetActions}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      label="Resolve"
                      loading={busy}
                      onPress={() => void updateStatus("RESOLVED")}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      label="Close"
                      loading={busy}
                      onPress={() => void updateStatus("CLOSED")}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                {selected.resolution ? (
                  <>
                    <Text style={styles.detailLabel}>Resolution</Text>
                    <Text style={styles.detailBody}>{selected.resolution}</Text>
                  </>
                ) : null}
                {sheetError ? <InlineNotice message={sheetError} /> : null}
                <PrimaryButton
                  label="Reopen"
                  loading={busy}
                  onPress={() => void updateStatus("OPEN")}
                />
              </>
            )}
          </>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={newOpen}
        onClose={() => (busy ? null : setNewOpen(false))}
        scrollable
      >
        <SheetHeader
          title="Open case"
          subtitle="Confidential — names stay inside the register"
          onClose={() => (busy ? null : setNewOpen(false))}
          closeDisabled={busy}
        />
        <ChipRow>
          {visibleKinds.map((k) => (
            <Chip
              key={k.value}
              label={k.label}
              active={newKind === k.value}
              onPress={() => setNewKind(k.value)}
            />
          ))}
        </ChipRow>
        <Field
          label="Title"
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="Short, non-identifying title"
        />
        <Field
          label="Detail (optional)"
          value={newDetail}
          onChangeText={setNewDetail}
          multiline
          placeholder="Confidential notes for the desk"
        />
        {sheetError ? <InlineNotice message={sheetError} /> : null}
        <PrimaryButton
          label="Open case"
          loading={busy}
          onPress={() => void submitNew()}
          disabled={busy || !newTitle.trim()}
        />
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
  caseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  caseTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  caseMeta: { ...typography.caption, color: colors.textMuted },
  muted: { ...typography.body, color: colors.textMuted, paddingVertical: spacing.sm },
  detailLabel: { ...typography.caption, color: colors.textMuted },
  detailBody: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
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
