import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { NIGERIAN_STATES } from "@repo/types";
import { api, ApiError, type OrgState } from "@/src/lib/api";
import {
  Chip,
  ChipRow,
  EmptyState,
  Field,
  GhostButton,
  PrimaryButton,
} from "@/src/components/ui";
import { StatusPill } from "@/src/components/premium/controls";
import { PremiumHeader } from "@/src/components/premium/screen";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

type CreateKind = "state" | "zone" | "branch" | null;

export default function OrgScreen() {
  const [tree, setTree] = useState<OrgState[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>(
    {},
  );

  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [stateName, setStateName] = useState<string>(NIGERIAN_STATES[0] ?? "");
  const [zoneName, setZoneName] = useState("");
  const [zoneStateId, setZoneStateId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchZoneId, setBranchZoneId] = useState("");
  const [branchStateId, setBranchStateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const zonesForBranch = useMemo(() => {
    const state = tree.find((s) => s.id === branchStateId);
    return state?.zones ?? [];
  }, [tree, branchStateId]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getOrgTree();
      setTree(data);
      setZoneStateId((prev) => prev || data[0]?.id || "");
      setBranchStateId((prev) => {
        if (prev) return prev;
        return data[0]?.id || "";
      });
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

  function openCreate(kind: CreateKind) {
    setFormError(null);
    setCreateKind(kind);
  }

  function requestCloseCreate() {
    if (busy) return;
    const dirty =
      zoneName.trim().length > 0 ||
      branchName.trim().length > 0 ||
      branchAddress.trim().length > 0 ||
      stateName !== (NIGERIAN_STATES[0] ?? "");
    if (!dirty) {
      setCreateKind(null);
      return;
    }
    Alert.alert("Discard changes?", "The organisation details you entered will be lost.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          setCreateKind(null);
          setZoneName("");
          setBranchName("");
          setBranchAddress("");
          setStateName(NIGERIAN_STATES[0] ?? "");
          setFormError(null);
        },
      },
    ]);
  }

  async function submitCreate() {
    setFormError(null);
    setBusy(true);
    try {
      if (createKind === "state") {
        await api.createState({ name: stateName });
      } else if (createKind === "zone") {
        if (!zoneName.trim() || !zoneStateId) {
          setFormError("Zone name and state are required.");
          return;
        }
        await api.createZone({ name: zoneName.trim(), stateId: zoneStateId });
      } else if (createKind === "branch") {
        if (!branchName.trim() || !branchStateId) {
          setFormError("Branch name and state are required.");
          return;
        }
        await api.createBranch({
          name: branchName.trim(),
          stateId: branchStateId,
          zoneId: branchZoneId || undefined,
          address: branchAddress.trim() || undefined,
        });
      }
      setCreateKind(null);
      setZoneName("");
      setBranchName("");
      setBranchAddress("");
      await load();
      Alert.alert("Created", "Organization unit saved.");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <PremiumHeader
        title="Organization"
        subtitle="States, zones, and branches"
        icon="business"
        right={<StatusPill label={`${tree.length} states`} tone="warning" />}
      />
      <ChipRow>
        <Pressable style={styles.primaryChip} onPress={() => openCreate("state")}>
          <Text style={styles.primaryChipText}>+ State</Text>
        </Pressable>
        <Pressable style={styles.secondaryChip} onPress={() => openCreate("zone")}>
          <Text style={styles.secondaryChipText}>+ Zone</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryChip}
          onPress={() => openCreate("branch")}
        >
          <Text style={styles.secondaryChipText}>+ Branch</Text>
        </Pressable>
      </ChipRow>

      {error ? <InlineNotice message={error} /> : null}

      {loading ? (
        <ScreenSkeleton rows={5} />
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
          {tree.length === 0 ? (
            <EmptyState
              title="No states yet"
              body="Create the first state to start building the hierarchy."
            />
          ) : null}
          {tree.map((state) => {
            const open = expandedStates[state.id] ?? true;
            return (
              <View key={state.id} style={styles.node}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() =>
                    setExpandedStates((s) => ({ ...s, [state.id]: !open }))
                  }
                  style={styles.nodeHeader}
                >
                  <View style={styles.nodeLabel}>
                    <Ionicons
                      name={open ? "chevron-down" : "chevron-forward"}
                      size={17}
                      color={colors.navy}
                    />
                    <Text style={styles.stateName}>{state.name}</Text>
                  </View>
                  <Text style={styles.count}>{state.zones.length} zones</Text>
                </Pressable>
                {open ? (
                  <>
                  {state.zones.map((zone) => {
                      const zoneOpen = expandedZones[zone.id] ?? false;
                      return (
                        <View key={zone.id} style={styles.zoneBlock}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: zoneOpen }}
                            onPress={() =>
                              setExpandedZones((z) => ({
                                ...z,
                                [zone.id]: !zoneOpen,
                              }))
                            }
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
                              {zone.branches.length} branches
                            </Text>
                          </Pressable>
                          {zoneOpen
                            ? zone.branches.map((branch) => (
                                <View key={branch.id} style={styles.branchRow}>
                                  <Ionicons
                                    name="location-outline"
                                    size={15}
                                    color={colors.gold}
                                  />
                                  <Text style={styles.branchName}>{branch.name}</Text>
                                </View>
                              ))
                            : null}
                        </View>
                      );
                    })}
                  {(state.branches ?? []).map((branch) => (
                    <View key={branch.id} style={styles.branchRow}>
                      <Ionicons
                        name="location-outline"
                        size={15}
                        color={colors.gold}
                      />
                      <Text style={styles.branchName}>{branch.name}</Text>
                      <Text style={styles.count}>No zone</Text>
                    </View>
                  ))}
                  </>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal
        visible={createKind !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={requestCloseCreate}
      >
        <ScrollView
          style={styles.modalRoot}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}
        >
          <SheetHeader
            title={`Create ${
              createKind === "state"
                ? "state"
                : createKind === "zone"
                  ? "zone"
                  : "branch"
            }`}
            subtitle="Add a new unit to the JNIC hierarchy."
            onClose={requestCloseCreate}
            closeDisabled={busy}
          />

          {createKind === "state" ? (
            <>
              <Text style={styles.label}>Nigerian state</Text>
              <ScrollView style={{ maxHeight: 280 }}>
                {NIGERIAN_STATES.map((name) => (
                  <Pressable
                    key={name}
                    style={[
                      styles.option,
                      stateName === name && styles.optionActive,
                    ]}
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
                {tree.map((s) => (
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

          {createKind === "branch" ? (
            <>
              <Text style={styles.label}>State</Text>
              <ChipRow>
                {tree.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.name}
                    active={branchStateId === s.id}
                    onPress={() => {
                      setBranchStateId(s.id);
                      setBranchZoneId("");
                    }}
                  />
                ))}
              </ChipRow>
              <Text style={styles.label}>Zone (optional)</Text>
              <ChipRow>
                <Chip
                  label="No zone"
                  active={!branchZoneId}
                  onPress={() => setBranchZoneId("")}
                />
                {zonesForBranch.map((z) => (
                  <Chip
                    key={z.id}
                    label={z.name}
                    active={branchZoneId === z.id}
                    onPress={() => setBranchZoneId(z.id)}
                  />
                ))}
              </ChipRow>
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
              <GhostButton label="Cancel" onPress={requestCloseCreate} disabled={busy} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Create"
                loading={busy}
                onPress={() => void submitCreate()}
              />
            </View>
          </View>
        </ScrollView>
      </Modal>
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
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryChip: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "center",
  },
  primaryChipText: {
    ...typography.footnote,
    fontWeight: "700",
    color: colors.textOnNavy,
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
    color: colors.navy,
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
  stateName: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  zoneBlock: { marginTop: spacing.sm, paddingLeft: spacing.xs },
  zoneName: {
    ...typography.callout,
    fontWeight: "600",
    color: colors.textPrimary,
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
  error: {
    ...typography.footnote,
    color: colors.error,
    marginVertical: spacing.sm,
  },
  modalRoot: { flex: 1, backgroundColor: colors.bgSurface },
  modalTitle: {
    ...typography.title2,
    color: colors.navy,
    marginBottom: spacing.md,
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
  optionTextActive: { fontWeight: "600", color: colors.navy },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
