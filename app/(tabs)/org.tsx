import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { NIGERIAN_STATES } from "@repo/types";
import {
  api,
  ApiError,
  type DirectorateRecord,
  type OrgBranch,
  type OrgState,
  type OrgTreeResponse,
} from "@/src/lib/api";
import {
  Chip,
  ChipRow,
  EmptyState,
  Field,
  GhostButton,
  PrimaryButton,
} from "@/src/components/ui";
import { StatusPill } from "@/src/components/premium/controls";
import { plural } from "@/src/lib/format";
import { showAppAlert } from "@/src/components/premium/app-alert";
import { PremiumHeader } from "@/src/components/premium/screen";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { BottomSheet } from "@/src/components/premium/bottom-sheet";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import {
  colors,
  layout,
  radius,
  spacing,
  typography,
} from "@/src/theme/tokens";

type CreateKind = "region" | "state" | "zone" | "district" | "branch" | null;

function BranchRow({ branch, label }: { branch: OrgBranch; label?: string }) {
  return (
    <View style={styles.branchRow}>
      <Ionicons name="location-outline" size={15} color={colors.goldText} />
      <Text style={styles.branchName}>{branch.name}</Text>
      {label ? <Text style={styles.count}>{label}</Text> : null}
    </View>
  );
}

export default function OrgScreen() {
  const router = useRouter();
  const [tree, setTree] = useState<OrgTreeResponse>({
    regions: [],
    unassignedStates: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const params = useLocalSearchParams<{ view?: string }>();
  const [view, setView] = useState<"territory" | "directorates">(
    params.view === "directorates" ? "directorates" : "territory",
  );
  const [directorates, setDirectorates] = useState<DirectorateRecord[]>([]);
  const [dirLoaded, setDirLoaded] = useState(false);

  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [regionName, setRegionName] = useState("");
  const [stateName, setStateName] = useState<string>(NIGERIAN_STATES[0] ?? "");
  const [stateRegionId, setStateRegionId] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [zoneStateId, setZoneStateId] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [districtStateId, setDistrictStateId] = useState("");
  const [districtZoneId, setDistrictZoneId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchZoneId, setBranchZoneId] = useState("");
  const [branchDistrictId, setBranchDistrictId] = useState("");
  const [branchStateId, setBranchStateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [moveState, setMoveState] = useState<OrgState | null>(null);
  const [moveRegionId, setMoveRegionId] = useState("");

  const allStates = useMemo(
    () => [...tree.unassignedStates, ...tree.regions.flatMap((r) => r.states)],
    [tree],
  );

  function currentRegionOf(stateId: string) {
    return (
      tree.regions.find((r) => r.states.some((s) => s.id === stateId))?.id ?? ""
    );
  }

  async function saveStateMove() {
    if (!moveState) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.updateState(moveState.id, {
        regionId: moveRegionId || null,
      });
      setMoveState(null);
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Could not move state",
      );
    } finally {
      setBusy(false);
    }
  }

  const zonesForBranch = useMemo(
    () => allStates.find((s) => s.id === branchStateId)?.zones ?? [],
    [allStates, branchStateId],
  );

  const zonesForDistrict = useMemo(
    () => allStates.find((s) => s.id === districtStateId)?.zones ?? [],
    [allStates, districtStateId],
  );

  const districtsForBranch = useMemo(
    () => zonesForBranch.find((z) => z.id === branchZoneId)?.districts ?? [],
    [zonesForBranch, branchZoneId],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getOrgTree();
      setTree(data);
      const firstState = data.unassignedStates[0] ?? data.regions[0]?.states[0];
      setZoneStateId((prev) => prev || firstState?.id || "");
      setBranchStateId((prev) => prev || firstState?.id || "");
      setDistrictStateId((prev) => prev || firstState?.id || "");
      try {
        setDirectorates(await api.listDirectorates());
        setDirLoaded(true);
      } catch {
        setDirLoaded(false);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load org tree");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  function openCreate(kind: CreateKind) {
    setFormError(null);
    setCreateKind(kind);
  }

  function resetForm() {
    setCreateKind(null);
    setRegionName("");
    setZoneName("");
    setDistrictName("");
    setBranchName("");
    setBranchAddress("");
    setStateName(NIGERIAN_STATES[0] ?? "");
    setFormError(null);
  }

  function requestCloseCreate() {
    if (busy) return;
    const dirty =
      regionName.trim().length > 0 ||
      zoneName.trim().length > 0 ||
      districtName.trim().length > 0 ||
      branchName.trim().length > 0 ||
      branchAddress.trim().length > 0 ||
      stateName !== (NIGERIAN_STATES[0] ?? "");
    if (!dirty) {
      setCreateKind(null);
      return;
    }
    void (async () => {
      const discard = await showAppAlert(
        "Discard changes?",
        "The organisation details you entered will be lost.",
        { confirmLabel: "Discard", cancelLabel: "Keep editing", destructive: true },
      );
      if (discard) resetForm();
    })();
  }

  async function submitCreate() {
    setFormError(null);
    setBusy(true);
    try {
      if (createKind === "region") {
        if (!regionName.trim()) {
          setFormError("Region name is required.");
          return;
        }
        await api.createRegion({ name: regionName.trim() });
      } else if (createKind === "state") {
        await api.createState({
          name: stateName,
          regionId: stateRegionId || undefined,
        });
      } else if (createKind === "zone") {
        if (!zoneName.trim() || !zoneStateId) {
          setFormError("Zone name and state are required.");
          return;
        }
        await api.createZone({ name: zoneName.trim(), stateId: zoneStateId });
      } else if (createKind === "district") {
        if (!districtName.trim() || !districtZoneId) {
          setFormError("District name and zone are required.");
          return;
        }
        await api.createDistrict({
          name: districtName.trim(),
          zoneId: districtZoneId,
        });
      } else if (createKind === "branch") {
        if (!branchName.trim() || !branchStateId) {
          setFormError("Branch name and state are required.");
          return;
        }
        await api.createBranch({
          name: branchName.trim(),
          stateId: branchStateId,
          zoneId: branchZoneId || undefined,
          districtId: branchDistrictId || undefined,
          address: branchAddress.trim() || undefined,
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  function renderBranches(branches: OrgBranch[]) {
    return branches.map((branch) => <BranchRow key={branch.id} branch={branch} />);
  }

  function renderState(state: OrgState) {
    const open = expanded[state.id] ?? false;
    const branchCount =
      state.zones.reduce(
        (n, z) => n + z.branches.length + z.districts.reduce((m, d) => m + d.branches.length, 0),
        0,
      ) + (state.branches ?? []).length;
    return (
      <View key={state.id} style={styles.node}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => toggle(state.id)}
          style={styles.nodeHeader}
        >
          <View style={styles.nodeLabel}>
            <Ionicons
              name={open ? "chevron-down" : "chevron-forward"}
              size={17}
              color={colors.textMuted}
            />
            <Text style={styles.stateName}>{state.name}</Text>
          </View>
          <Text style={styles.count}>
            {plural(state.zones.length, "zone")} · {plural(branchCount, "branch")}
          </Text>
          <Pressable
            accessibilityLabel={`Move ${state.name} to a region`}
            onPress={() => {
              setMoveState(state);
              setMoveRegionId(currentRegionOf(state.id));
            }}
            hitSlop={8}
            style={{ padding: spacing.xs }}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={16}
              color={colors.goldText}
            />
          </Pressable>
        </Pressable>
        {open ? (
          <>
            {state.zones.map((zone) => {
              const zoneOpen = expanded[zone.id] ?? false;
              const zoneBranchCount =
                zone.districts.reduce((n, d) => n + d.branches.length, 0) +
                zone.branches.length;
              return (
                <View key={zone.id} style={styles.zoneBlock}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: zoneOpen }}
                    onPress={() => toggle(zone.id)}
                    style={styles.nodeHeader}
                  >
                    <View style={styles.nodeLabel}>
                      <Ionicons
                        name={zoneOpen ? "chevron-down" : "chevron-forward"}
                        size={15}
                        color={colors.textPrimary}
                      />
                      <Text style={styles.zoneName}>{zone.name}</Text>
                    </View>
                    <Text style={styles.count}>
                      {zone.districts.length > 0
                        ? `${plural(zone.districts.length, "district")} · `
                        : ""}
                      {plural(zoneBranchCount, "branch")}
                    </Text>
                  </Pressable>
                  {zoneOpen ? (
                    <>
                      {zone.districts.map((district) => {
                        const districtOpen = expanded[district.id] ?? false;
                        return (
                          <View key={district.id} style={styles.districtBlock}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityState={{ expanded: districtOpen }}
                              onPress={() => toggle(district.id)}
                              style={styles.nodeHeader}
                            >
                              <View style={styles.nodeLabel}>
                                <Ionicons
                                  name={
                                    districtOpen
                                      ? "chevron-down"
                                      : "chevron-forward"
                                  }
                                  size={14}
                                  color={colors.textMuted}
                                />
                                <Text style={styles.districtName}>
                                  {district.name}
                                </Text>
                              </View>
                              <Text style={styles.count}>
                                {plural(district.branches.length, "branch")}
                              </Text>
                            </Pressable>
                            {districtOpen
                              ? renderBranches(district.branches)
                              : null}
                          </View>
                        );
                      })}
                      {zone.branches.map((branch) => (
                        <BranchRow
                          key={branch.id}
                          branch={branch}
                          label="No district"
                        />
                      ))}
                    </>
                  ) : null}
                </View>
              );
            })}
            {(state.branches ?? []).map((branch) => (
              <BranchRow key={branch.id} branch={branch} label="No zone" />
            ))}
          </>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <PremiumHeader
        title="Organization"
        subtitle="Regions, states, zones, districts, and branches"
        icon="business"
        right={<StatusPill label={plural(allStates.length, "state")} tone="info" />}
      />

      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentBtn, view === "territory" && styles.segmentBtnActive]}
          onPress={() => setView("territory")}
        >
          <Text
            style={[
              styles.segmentText,
              view === "territory" && styles.segmentTextActive,
            ]}
          >
            Territory
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.segmentBtn,
            view === "directorates" && styles.segmentBtnActive,
          ]}
          onPress={() => setView("directorates")}
        >
          <Text
            style={[
              styles.segmentText,
              view === "directorates" && styles.segmentTextActive,
            ]}
          >
            Directorates
          </Text>
        </Pressable>
      </View>

      {view === "territory" ? (
      <ChipRow>
        <Pressable
          style={styles.secondaryChip}
          onPress={() => openCreate("region")}
        >
          <Text style={styles.secondaryChipText}>+ Region</Text>
        </Pressable>
        <Pressable
          style={styles.primaryChip}
          onPress={() => openCreate("state")}
        >
          <Text style={styles.primaryChipText}>+ State</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryChip}
          onPress={() => openCreate("zone")}
        >
          <Text style={styles.secondaryChipText}>+ Zone</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryChip}
          onPress={() => openCreate("district")}
        >
          <Text style={styles.secondaryChipText}>+ District</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryChip}
          onPress={() => openCreate("branch")}
        >
          <Text style={styles.secondaryChipText}>+ Branch</Text>
        </Pressable>
      </ChipRow>
      ) : null}

      {error ? <InlineNotice message={error} /> : null}

      {loading ? (
        <ScreenSkeleton rows={5} />
      ) : view === "directorates" ? (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.gold}
              colors={[colors.gold]}
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          {!dirLoaded || directorates.length === 0 ? (
            <EmptyState
              title="No directorates yet"
              body="The ten directorates are created by the server seed. Redeploy the API to populate them."
            />
          ) : null}
          {directorates.map((d) => (
            <Pressable
              key={d.id}
              style={styles.dirCard}
              onPress={() =>
                router.push(`/directorates/${d.id}` as never)
              }
            >
              <View style={styles.dirCardHead}>
                <Ionicons
                  name="layers-outline"
                  size={16}
                  color={colors.goldText}
                />
                <Text style={styles.dirCardName}>{d.name}</Text>
                {!d.leadership.director ? (
                  <View style={styles.dirVacantPill}>
                    <Text style={styles.dirVacantText}>Vacant</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.dirCardMeta} numberOfLines={1}>
                {d.leadership.director
                  ? `Director: ${d.leadership.director.name}`
                  : "No director seated"}
              </Text>
              <Text style={styles.dirCardMeta}>
                {plural(d.deskCount, "desk")} · {plural(d.unitTypeCount, "unit type")} ·{" "}
                {plural(d.memberCount, "member")}
              </Text>
              <View style={styles.dirCardFooter}>
                <Text style={styles.dirCardLink}>Open roster</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.goldText}
                />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.gold}
              colors={[colors.gold]}
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          {allStates.length === 0 && tree.regions.length === 0 ? (
            <EmptyState
              title="No hierarchy yet"
              body="Create a region and a state to start building the hierarchy."
            />
          ) : null}
          {tree.regions.map((region) => (
            <View key={region.id} style={{ marginBottom: spacing.xs }}>
              <View style={styles.regionHeader}>
                <Ionicons name="globe-outline" size={16} color={colors.goldText} />
                <Text style={styles.regionName}>{region.name}</Text>
                <Text style={styles.count}>{region.states.length} states</Text>
              </View>
              {region.states.map(renderState)}
            </View>
          ))}
          {tree.unassignedStates.map(renderState)}
        </ScrollView>
      )}

      <BottomSheet
        visible={moveState !== null}
        onClose={() => (busy ? null : setMoveState(null))}
      >
        <SheetHeader
          title={moveState ? `Move ${moveState.name}` : "Move state"}
          subtitle="Pick the region this state belongs to"
          onClose={() => (busy ? null : setMoveState(null))}
          closeDisabled={busy}
        />
        <ChipRow>
          <Chip
            label="No region"
            active={!moveRegionId}
            onPress={() => setMoveRegionId("")}
          />
          {tree.regions.map((r) => (
            <Chip
              key={r.id}
              label={r.name}
              active={moveRegionId === r.id}
              onPress={() => setMoveRegionId(r.id)}
            />
          ))}
        </ChipRow>
        {formError ? <InlineNotice message={formError} /> : null}
        <PrimaryButton
          label="Save"
          loading={busy}
          onPress={() => void saveStateMove()}
        />
      </BottomSheet>

      <BottomSheet
        visible={createKind !== null}
        onClose={requestCloseCreate}
        scrollable
      >
        <SheetHeader
          title={`Create ${createKind ?? ""}`}
          subtitle="Add a new unit to the JNIC hierarchy."
          onClose={requestCloseCreate}
          closeDisabled={busy}
        />

        {createKind === "region" ? (
          <Field
            label="Region name"
            value={regionName}
            onChangeText={setRegionName}
            placeholder="e.g. National Region"
          />
        ) : null}

        {createKind === "state" ? (
          <>
            <Text style={styles.label}>Region (optional)</Text>
            <ChipRow>
              <Chip
                label="No region"
                active={!stateRegionId}
                onPress={() => setStateRegionId("")}
              />
              {tree.regions.map((r) => (
                <Chip
                  key={r.id}
                  label={r.name}
                  active={stateRegionId === r.id}
                  onPress={() => setStateRegionId(r.id)}
                />
              ))}
            </ChipRow>
            <Text style={styles.label}>Nigerian state</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {NIGERIAN_STATES.map((name) => (
                <Pressable
                  key={name}
                  style={[styles.option, stateName === name && styles.optionActive]}
                  onPress={() => setStateName(name)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      stateName === name && styles.optionTextActive,
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        {createKind === "zone" ? (
          <>
            <Text style={styles.label}>Parent state</Text>
            <ChipRow>
              {allStates.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  active={zoneStateId === s.id}
                  onPress={() => setZoneStateId(s.id)}
                />
              ))}
            </ChipRow>
            <Field
              label="Zone name"
              value={zoneName}
              onChangeText={setZoneName}
              placeholder="e.g. Lagos Central"
            />
          </>
        ) : null}

        {createKind === "district" ? (
          <>
            <Text style={styles.label}>Parent state</Text>
            <ChipRow>
              {allStates.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  active={districtStateId === s.id}
                  onPress={() => {
                    setDistrictStateId(s.id);
                    setDistrictZoneId("");
                  }}
                />
              ))}
            </ChipRow>
            <Text style={styles.label}>Parent zone</Text>
            <ChipRow>
              {zonesForDistrict.map((z) => (
                <Chip
                  key={z.id}
                  label={z.name}
                  active={districtZoneId === z.id}
                  onPress={() => setDistrictZoneId(z.id)}
                />
              ))}
            </ChipRow>
            <Field
              label="District name"
              value={districtName}
              onChangeText={setDistrictName}
              placeholder="e.g. Lagos Island"
            />
          </>
        ) : null}

        {createKind === "branch" ? (
          <>
            <Text style={styles.label}>State</Text>
            <ChipRow>
              {allStates.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  active={branchStateId === s.id}
                  onPress={() => {
                    setBranchStateId(s.id);
                    setBranchZoneId("");
                    setBranchDistrictId("");
                  }}
                />
              ))}
            </ChipRow>
            <Text style={styles.label}>Zone (optional)</Text>
            <ChipRow>
              <Chip
                label="No zone"
                active={!branchZoneId}
                onPress={() => {
                  setBranchZoneId("");
                  setBranchDistrictId("");
                }}
              />
              {zonesForBranch.map((z) => (
                <Chip
                  key={z.id}
                  label={z.name}
                  active={branchZoneId === z.id}
                  onPress={() => {
                    setBranchZoneId(z.id);
                    setBranchDistrictId("");
                  }}
                />
              ))}
            </ChipRow>
            {branchZoneId && districtsForBranch.length > 0 ? (
              <>
                <Text style={styles.label}>District (optional)</Text>
                <ChipRow>
                  <Chip
                    label="No district"
                    active={!branchDistrictId}
                    onPress={() => setBranchDistrictId("")}
                  />
                  {districtsForBranch.map((d) => (
                    <Chip
                      key={d.id}
                      label={d.name}
                      active={branchDistrictId === d.id}
                      onPress={() => setBranchDistrictId(d.id)}
                    />
                  ))}
                </ChipRow>
              </>
            ) : null}
            <Field
              label="Branch name"
              value={branchName}
              onChangeText={setBranchName}
            />
            <Field
              label="Address (optional)"
              value={branchAddress}
              onChangeText={setBranchAddress}
            />
          </>
        ) : null}

        {formError ? <InlineNotice message={formError} /> : null}

        <View style={styles.modalActions}>
          <View style={{ flex: 1 }}>
            <GhostButton
              label="Cancel"
              onPress={requestCloseCreate}
              disabled={busy}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Create"
              loading={busy}
              onPress={() => void submitCreate()}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: layout.screenPad,
    paddingTop: spacing.xs,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.full,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: colors.gold,
  },
  segmentText: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.goldForeground,
  },
  dirCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dirCardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  dirCardName: {
    ...typography.body,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  dirCardMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  dirCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    marginTop: spacing.xs,
  },
  dirCardLink: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.goldText,
  },
  dirVacantPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.warningSoft,
  },
  dirVacantText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.warning,
  },
  primaryChip: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "center",
  },
  primaryChipText: {
    ...typography.footnote,
    fontWeight: "700",
    color: colors.goldForeground,
  },
  secondaryChip: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: "center",
  },
  secondaryChipText: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  node: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  nodeHeader: {
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nodeLabel: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  regionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  regionName: {
    ...typography.footnote,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.goldText,
    flex: 1,
  },
  stateName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  zoneBlock: { marginTop: spacing.sm, paddingLeft: spacing.xs },
  zoneName: {
    ...typography.callout,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  districtBlock: { marginTop: spacing.xs, paddingLeft: spacing.md },
  districtName: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.textMuted,
  },
  branchRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginLeft: spacing.lg,
  },
  branchName: {
    ...typography.footnote,
    color: colors.textMuted,
  },
  count: {
    ...typography.caption,
    color: colors.textMuted,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  optionActive: { backgroundColor: colors.bgSubtle },
  optionText: { ...typography.body, color: colors.textPrimary },
  optionTextActive: { fontWeight: "600", color: colors.textPrimary },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
