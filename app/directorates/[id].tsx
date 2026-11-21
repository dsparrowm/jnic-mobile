import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Role } from "@repo/types";
import {
  api,
  ApiError,
  type AdminUserRecord,
  type DirectorateDetail,
  type ServiceUnitRecord,
} from "@/src/lib/api";
import { useAuth } from "@/src/lib/session";
import {
  Chip,
  ChipRow,
  EmptyState,
  Field,
  PrimaryButton,
} from "@/src/components/ui";
import { BottomSheet } from "@/src/components/premium/bottom-sheet";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { SectionHeader, SurfaceCard } from "@/src/components/premium/screen";
import { WeeklyStackBar } from "@/src/components/weekly/stack-bar";
import { showAppAlert } from "@/src/components/premium/app-alert";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

const OFFICES: { value: string; label: string }[] = [
  { value: "DIRECTOR", label: "Director" },
  { value: "DEPUTY_DIRECTOR", label: "Deputy Director" },
  { value: "SECRETARY", label: "Secretary" },
  { value: "DESK_HEAD", label: "Desk Head" },
  { value: "DEPUTY_DESK_HEAD", label: "Deputy Desk Head" },
  { value: "REGIONAL_COORDINATOR", label: "Regional Coordinator" },
  { value: "MEMBER", label: "Member" },
];

const OFFICE_LABELS = new Map(OFFICES.map((o) => [o.value, o.label]));
const DESK_OFFICES = new Set(["DESK_HEAD", "DEPUTY_DESK_HEAD"]);

const LEADERSHIP_ORDER = ["DIRECTOR", "DEPUTY_DIRECTOR", "SECRETARY"];

type Person = { id: string; name: string; email?: string; meta?: string };

export default function DirectorateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.ADMIN;
  const isBranchPastor = user?.role === Role.BRANCH_PASTOR;
  const canManageSeats = isAdmin || user?.hrPersonnel === true;

  const [detail, setDetail] = useState<DirectorateDetail | null>(null);
  const [units, setUnits] = useState<ServiceUnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign-seat sheet state
  const [assignOpen, setAssignOpen] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [personId, setPersonId] = useState("");
  const [office, setOffice] = useState("MEMBER");
  const [deskId, setDeskId] = useState("");
  const [saving, setSaving] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [moveNote, setMoveNote] = useState("");
  const [transferIntent, setTransferIntent] = useState(false);

  // Coordinator sheet state
  const [coordUnit, setCoordUnit] = useState<ServiceUnitRecord | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await api.getDirectorate(id);
      setDetail(d);
      if (canManageSeats || isBranchPastor) {
        try {
          const all = await api.listAllServiceUnits();
          setUnits(
            all.filter(
              (u) =>
                u.directorate.id === d.id &&
                (canManageSeats || u.branch.id === user?.branchId),
            ),
          );
        } catch {
          setUnits([]);
        }
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load directorate",
      );
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin, isBranchPastor, canManageSeats, user?.branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const deskNameById = useMemo(
    () => new Map((detail?.desks ?? []).map((d) => [d.id, d.name])),
    [detail],
  );

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people.slice(0, 8);
    return people
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.email ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [people, search]);

  async function loadPeople() {
    try {
      if (isAdmin) {
        const users = await api.listAdminUsers();
        setPeople(
          users
            .filter((u: AdminUserRecord) => u.status === "ACTIVE")
            .map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              meta: u.branch?.name ?? u.branchName ?? undefined,
            })),
        );
      } else if (canManageSeats) {
        const res = await api.listPastors({ perPage: 100 });
        setPeople(
          res.items
            .filter((p) => p.status === "ACTIVE")
            .map((p) => ({
              id: p.id,
              name: p.name,
              email: p.email,
              meta: p.branch?.name ?? undefined,
            })),
        );
      } else if (isBranchPastor && user?.branchId) {
        const res = await api.listPastors({ branchId: user.branchId });
        setPeople(
          res.items
            .filter((p) => p.status === "ACTIVE")
            .map((p) => ({ id: p.id, name: p.name, email: p.email })),
        );
      }
    } catch {
      setPeople([]);
    }
  }

  function openAssign() {
    setPersonId("");
    setOffice("MEMBER");
    setDeskId("");
    setSearch("");
    setSheetError(null);
    setMoveNote("");
    setTransferIntent(false);
    setAssignOpen(true);
    void loadPeople();
  }

  function openCoordinator(unit: ServiceUnitRecord) {
    setCoordUnit(unit);
    setPersonId("");
    setSearch("");
    setSheetError(null);
    setMoveNote("");
    void loadPeople();
  }

  async function submitAssign() {
    if (!detail || !personId) return;
    setSaving(true);
    setSheetError(null);
    try {
      const payload = {
        userId: personId,
        office,
        deskId: DESK_OFFICES.has(office) && deskId ? deskId : undefined,
        note: moveNote.trim() || undefined,
      };
      if (transferIntent) {
        await api.transferDirectorateAssignment(detail.id, payload);
      } else {
        await api.upsertDirectorateAssignment(detail.id, payload);
      }
      setAssignOpen(false);
      await load();
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        err.message.includes("already belongs")
      ) {
        setTransferIntent(true);
        setSheetError(`${err.message}. Tap Assign again to move them here.`);
      } else {
        setSheetError(
          err instanceof ApiError ? err.message : "Could not assign seat",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitCoordinator() {
    if (!coordUnit) return;
    setSaving(true);
    setSheetError(null);
    try {
      await api.setServiceUnitCoordinator(
        coordUnit.id,
        personId || null,
        moveNote.trim() || undefined,
      );
      setCoordUnit(null);
      await load();
    } catch (err) {
      setSheetError(
        err instanceof ApiError ? err.message : "Could not set coordinator",
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmRemove(memberId: string, name: string) {
    void (async () => {
      const ok = await showAppAlert(
        "Remove seat",
        `Remove ${name} from this directorate?`,
        { confirmLabel: "Remove", cancelLabel: "Cancel", destructive: true },
      );
      if (!ok) return;
      try {
        await api.removeDirectorateAssignment(memberId);
        await load();
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Could not remove seat",
        );
      }
    })();
  }

  const leadership = (detail?.members ?? []).filter((m) =>
    LEADERSHIP_ORDER.includes(m.office),
  );
  const otherMembers = (detail?.members ?? []).filter(
    (m) => !LEADERSHIP_ORDER.includes(m.office),
  );

  const unitsByBranch = useMemo(() => {
    const map = new Map<string, ServiceUnitRecord[]>();
    for (const u of units) {
      const list = map.get(u.branch.name) ?? [];
      list.push(u);
      map.set(u.branch.name, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [units]);

  function seatRow(office: string, idx: number) {
    const seat = leadership.find((m) => m.office === office);
    return (
      <View key={office} style={[styles.seatRow, idx > 0 && styles.rowDivider]}>
        <View style={styles.seatBadge}>
          <Ionicons
            name={
              office === "DIRECTOR"
                ? "medal-outline"
                : office === "DEPUTY_DIRECTOR"
                  ? "ribbon-outline"
                  : "document-text-outline"
            }
            size={16}
            color={seat ? colors.goldText : colors.textMuted}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.seatOffice}>
            {OFFICE_LABELS.get(office) ?? office}
          </Text>
          <Text style={seat ? styles.seatName : styles.seatVacant}>
            {seat ? seat.user.name : "Vacant"}
          </Text>
        </View>
        {seat && canManageSeats ? (
          <Pressable
            accessibilityLabel={`Remove ${seat.user.name}`}
            onPress={() => confirmRemove(seat.id, seat.user.name)}
          >
            <Ionicons
              name="remove-circle-outline"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    );
  }

  function personPicker(selected: string, onSelect: (pid: string) => void) {
    return (
      <>
        <Field
          label="Search people"
          value={search}
          onChangeText={setSearch}
          placeholder="Name or email"
        />
        {filteredPeople.map((p) => (
          <Pressable
            key={p.id}
            style={[styles.personRow, selected === p.id && styles.personRowActive]}
            onPress={() => onSelect(p.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>{p.name}</Text>
              <Text style={styles.personMeta}>
                {[p.email, p.meta].filter(Boolean).join(" · ")}
              </Text>
            </View>
            {selected === p.id ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.gold} />
            ) : null}
          </Pressable>
        ))}
        {people.length === 0 ? (
          <Text style={styles.personMeta}>Loading people…</Text>
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.root}>
      <WeeklyStackBar
        title={detail?.name ?? "Directorate"}
        subtitle="Roster, desks, and branch units"
      />
      {error ? <InlineNotice message={error} /> : null}
      {loading ? (
        <ScreenSkeleton rows={5} />
      ) : !detail ? (
        <EmptyState title="Directorate not found" />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {detail.mandate ? (
            <SurfaceCard style={styles.padCard}>
              <Text style={styles.mandate}>{detail.mandate}</Text>
            </SurfaceCard>
          ) : null}

          <SectionHeader title="Leadership" />
          <SurfaceCard style={styles.flushCard}>
            {LEADERSHIP_ORDER.map((office, idx) => seatRow(office, idx))}
          </SurfaceCard>

          <SectionHeader title="Desks" meta={`${detail.desks.length}`} />
          <SurfaceCard style={styles.flushCard}>
            {detail.desks.length === 0 ? (
              <Text style={styles.muted}>No desks configured.</Text>
            ) : (
              detail.desks.map((d, idx) => {
                const heads = otherMembers.filter((m) => m.deskId === d.id);
                const head = heads.find((m) => m.office === "DESK_HEAD");
                const deputies = heads.filter(
                  (m) => m.office === "DEPUTY_DESK_HEAD",
                );
                return (
                  <View
                    key={d.id}
                    style={[styles.seatRow, idx > 0 && styles.rowDivider]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName} numberOfLines={2}>
                        {d.name}
                      </Text>
                      {head || deputies.length ? (
                        <Text style={styles.memberMeta}>
                          {[
                            head ? `${head.user.name} · Head` : null,
                            ...deputies.map(
                              (h) => `${h.user.name} · Deputy`,
                            ),
                          ]
                            .filter(Boolean)
                            .join("  |  ")}
                        </Text>
                      ) : null}
                    </View>
                    {head ? (
                      canManageSeats ? (
                        <Pressable
                          accessibilityLabel={`Remove ${head.user.name}`}
                          onPress={() =>
                            confirmRemove(head.id, head.user.name)
                          }
                        >
                          <Ionicons
                            name="remove-circle-outline"
                            size={20}
                            color={colors.textMuted}
                          />
                        </Pressable>
                      ) : null
                    ) : (
                      <View style={styles.vacantPill}>
                        <Text style={styles.vacantPillText}>Vacant</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </SurfaceCard>

          <SectionHeader
            title="Members"
            meta={`${otherMembers.length}`}
          />
          <SurfaceCard style={styles.flushCard}>
            {otherMembers.length === 0 ? (
              <Text style={styles.muted}>No other members.</Text>
            ) : (
              otherMembers.map((m, idx) => (
                <View
                  key={m.id}
                  style={[styles.memberRow, idx > 0 && styles.rowDivider]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.user.name}</Text>
                    <Text style={styles.memberMeta}>
                      {OFFICE_LABELS.get(m.office) ?? m.office}
                      {m.deskId ? ` · ${deskNameById.get(m.deskId) ?? ""}` : ""}
                      {m.user.branch ? ` · ${m.user.branch.name}` : ""}
                    </Text>
                  </View>
                  {canManageSeats ? (
                    <Pressable
                      accessibilityLabel={`Remove ${m.user.name}`}
                      onPress={() => confirmRemove(m.id, m.user.name)}
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={20}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ))
            )}
          </SurfaceCard>

          {canManageSeats || isBranchPastor ? (
            <>
              <SectionHeader
                title={canManageSeats ? "Branch units" : "My branch units"}
                meta={`${units.length}`}
              />
              {units.length === 0 ? (
                <SurfaceCard style={styles.padCard}>
                  <Text style={styles.muted}>
                    No service units for this directorate yet.
                  </Text>
                </SurfaceCard>
              ) : (
                unitsByBranch.map(([branchName, branchUnits]) => (
                  <View key={branchName} style={styles.branchGroup}>
                    <Text style={styles.branchLabel}>{branchName}</Text>
                    <SurfaceCard style={styles.flushCard}>
                      {branchUnits.map((u, idx) => (
                        <View
                          key={u.id}
                          style={[styles.memberRow, idx > 0 && styles.rowDivider]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.memberName} numberOfLines={2}>
                              {u.unitType.name}
                            </Text>
                            <Text style={styles.memberMeta}>
                              {u.coordinator?.name ?? "No coordinator"}
                            </Text>
                          </View>
                          <Pressable
                            style={styles.unitAction}
                            onPress={() => openCoordinator(u)}
                          >
                            <Text style={styles.assignLink}>
                              {u.coordinator ? "Change" : "Assign"}
                            </Text>
                          </Pressable>
                        </View>
                      ))}
                    </SurfaceCard>
                  </View>
                ))
              )}
            </>
          ) : null}

          {canManageSeats ? (
            <PrimaryButton label="Assign seat" onPress={openAssign} />
          ) : null}
        </ScrollView>
      )}

      <BottomSheet
        visible={assignOpen}
        onClose={() => (saving ? null : setAssignOpen(false))}
        scrollable
      >
        <SheetHeader
          title="Assign seat"
          subtitle={`${detail?.name ?? ""} — pick the person and office.`}
          onClose={() => (saving ? null : setAssignOpen(false))}
          closeDisabled={saving}
        />
        {personPicker(personId, (pid) => {
          setPersonId(pid);
          setTransferIntent(false);
        })}
        <Text style={styles.label}>Office</Text>
        <ChipRow wrap>
          {OFFICES.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              active={office === o.value}
              onPress={() => setOffice(o.value)}
            />
          ))}
        </ChipRow>
        {DESK_OFFICES.has(office) ? (
          <>
            <Text style={styles.label}>Desk</Text>
            <ChipRow>
              {detail?.desks.map((d) => (
                <Chip
                  key={d.id}
                  label={d.name}
                  active={deskId === d.id}
                  onPress={() => setDeskId(d.id)}
                />
              ))}
            </ChipRow>
          </>
        ) : null}
        <Field
          label="Move note (optional)"
          value={moveNote}
          onChangeText={setMoveNote}
          placeholder="e.g. Moved to support the new media desk"
        />
        {sheetError ? <InlineNotice message={sheetError} /> : null}
        <PrimaryButton
          label={transferIntent ? "Move seat here" : "Assign"}
          loading={saving}
          onPress={() => void submitAssign()}
          disabled={saving || !personId}
        />
      </BottomSheet>

      <BottomSheet
        visible={coordUnit !== null}
        onClose={() => (saving ? null : setCoordUnit(null))}
        scrollable
      >
        <SheetHeader
          title="Set coordinator"
          subtitle={`${coordUnit?.unitType.name ?? ""} — ${coordUnit?.branch.name ?? ""}`}
          onClose={() => (saving ? null : setCoordUnit(null))}
          closeDisabled={saving}
        />
        {personPicker(personId, setPersonId)}
        <Field
          label="Move note (optional)"
          value={moveNote}
          onChangeText={setMoveNote}
          placeholder="e.g. Handover from previous coordinator"
        />
        {sheetError ? <InlineNotice message={sheetError} /> : null}
        <PrimaryButton
          label="Save coordinator"
          loading={saving}
          onPress={() => void submitCoordinator()}
          disabled={saving || !personId}
        />
        {coordUnit?.coordinator ? (
          <Pressable
            style={styles.clearBtn}
            onPress={async () => {
              setSaving(true);
              try {
                await api.setServiceUnitCoordinator(coordUnit.id, null);
                setCoordUnit(null);
                await load();
              } finally {
                setSaving(false);
              }
            }}
          >
            <Text style={styles.clearText}>Remove coordinator</Text>
          </Pressable>
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  body: {
    paddingHorizontal: layout.screenPad,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  mandate: { ...typography.body, color: colors.textMuted },
  padCard: { padding: spacing.md },
  flushCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  seatBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.navyMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  seatOffice: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  seatName: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 1,
  },
  seatVacant: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: 1,
  },
  vacantPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.warningSoft,
  },
  vacantPillText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.warning,
  },
  branchGroup: { gap: spacing.xs },
  branchLabel: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.goldText,
    marginLeft: 2,
  },
  unitAction: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  deskRow: { paddingVertical: spacing.xs },
  memberName: { ...typography.body, fontWeight: "600", color: colors.textPrimary },
  memberMeta: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  muted: { ...typography.caption, color: colors.textMuted },
  label: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  personRowActive: { borderColor: colors.gold, backgroundColor: colors.bgSurface },
  personName: { ...typography.body, color: colors.textPrimary },
  personMeta: { ...typography.caption, color: colors.textMuted },
  assignLink: { ...typography.caption, fontWeight: "700", color: colors.goldText },
  clearBtn: { alignItems: "center", paddingVertical: spacing.sm },
  clearText: { ...typography.caption, color: colors.error },
});
