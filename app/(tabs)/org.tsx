import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NIGERIAN_STATES } from "@repo/types";
import { api, ApiError, type OrgState } from "@/src/lib/api";
import { colors, radius, spacing } from "@/src/theme/tokens";

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
      setBranchZoneId((prev) => {
        if (prev) return prev;
        return data[0]?.zones[0]?.id || "";
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
        if (!branchName.trim() || !branchZoneId) {
          setFormError("Branch name and zone are required.");
          return;
        }
        await api.createBranch({
          name: branchName.trim(),
          zoneId: branchZoneId,
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
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Organization</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.actions}>
          <Pressable style={styles.primaryBtn} onPress={() => openCreate("state")}>
            <Text style={styles.primaryBtnText}>+ State</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => openCreate("zone")}>
            <Text style={styles.secondaryBtnText}>+ Zone</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => openCreate("branch")}
          >
            <Text style={styles.secondaryBtnText}>+ Branch</Text>
          </Pressable>
        </View>
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.lg }} />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.navy}
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          {tree.length === 0 ? (
            <Text style={styles.empty}>No states yet. Create the first state.</Text>
          ) : null}
          {tree.map((state) => {
            const open = expandedStates[state.id] ?? true;
            return (
              <View key={state.id} style={styles.node}>
                <Pressable
                  onPress={() =>
                    setExpandedStates((s) => ({ ...s, [state.id]: !open }))
                  }
                  style={styles.nodeHeader}
                >
                  <Text style={styles.stateName}>
                    {open ? "▾" : "▸"} {state.name}
                  </Text>
                  <Text style={styles.count}>{state.zones.length} zones</Text>
                </Pressable>
                {open
                  ? state.zones.map((zone) => {
                      const zoneOpen = expandedZones[zone.id] ?? false;
                      return (
                        <View key={zone.id} style={styles.zoneBlock}>
                          <Pressable
                            onPress={() =>
                              setExpandedZones((z) => ({
                                ...z,
                                [zone.id]: !zoneOpen,
                              }))
                            }
                            style={styles.nodeHeader}
                          >
                            <Text style={styles.zoneName}>
                              {zoneOpen ? "▾" : "▸"} {zone.name}
                            </Text>
                            <Text style={styles.count}>
                              {zone.branches.length} branches
                            </Text>
                          </Pressable>
                          {zoneOpen
                            ? zone.branches.map((branch) => (
                                <Text key={branch.id} style={styles.branchName}>
                                  • {branch.name}
                                </Text>
                              ))
                            : null}
                        </View>
                      );
                    })
                  : null}
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal
        visible={createKind !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ScrollView
          style={styles.modalRoot}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}
        >
          <Text style={styles.modalTitle}>
            Create {createKind === "state" ? "state" : createKind === "zone" ? "zone" : "branch"}
          </Text>

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
              <ScrollView horizontal>
                <View style={styles.actions}>
                  {tree.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[
                        styles.chip,
                        zoneStateId === s.id && styles.chipActive,
                      ]}
                      onPress={() => setZoneStateId(s.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          zoneStateId === s.id && styles.chipTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.label}>Zone name</Text>
              <TextInput
                style={styles.input}
                value={zoneName}
                onChangeText={setZoneName}
                placeholder="e.g. Lagos Central"
                placeholderTextColor={colors.textMuted}
              />
            </>
          ) : null}

          {createKind === "branch" ? (
            <>
              <Text style={styles.label}>State</Text>
              <ScrollView horizontal>
                <View style={styles.actions}>
                  {tree.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[
                        styles.chip,
                        branchStateId === s.id && styles.chipActive,
                      ]}
                      onPress={() => {
                        setBranchStateId(s.id);
                        setBranchZoneId(s.zones[0]?.id ?? "");
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          branchStateId === s.id && styles.chipTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.label}>Zone</Text>
              <ScrollView horizontal>
                <View style={styles.actions}>
                  {zonesForBranch.map((z) => (
                    <Pressable
                      key={z.id}
                      style={[
                        styles.chip,
                        branchZoneId === z.id && styles.chipActive,
                      ]}
                      onPress={() => setBranchZoneId(z.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          branchZoneId === z.id && styles.chipTextActive,
                        ]}
                      >
                        {z.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.label}>Branch name</Text>
              <TextInput
                style={styles.input}
                value={branchName}
                onChangeText={setBranchName}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.label}>Address (optional)</Text>
              <TextInput
                style={styles.input}
                value={branchAddress}
                onChangeText={setBranchAddress}
                placeholderTextColor={colors.textMuted}
              />
            </>
          ) : null}

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <View style={styles.modalActions}>
            <Pressable
              style={styles.secondaryBtnWide}
              onPress={() => setCreateKind(null)}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
              disabled={busy}
              onPress={() => void submitCreate()}
            >
              {busy ? (
                <ActivityIndicator color={colors.goldForeground} />
              ) : (
                <Text style={styles.primaryBtnText}>Create</Text>
              )}
            </Pressable>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  headerRow: { marginBottom: spacing.sm },
  heading: { fontSize: 22, fontWeight: "700", color: colors.navy },
  actions: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  node: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  nodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stateName: { fontWeight: "700", color: colors.navy, fontSize: 16 },
  zoneBlock: { marginTop: spacing.sm, paddingLeft: spacing.sm },
  zoneName: { fontWeight: "600", color: colors.textPrimary },
  branchName: {
    marginTop: 4,
    marginLeft: spacing.md,
    color: colors.textMuted,
    fontSize: 13,
  },
  count: { color: colors.textMuted, fontSize: 12 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  error: { color: colors.error, marginVertical: spacing.sm },
  modalRoot: { flex: 1, backgroundColor: colors.bgSurface },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: spacing.md,
  },
  label: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.bgBase,
    color: colors.textPrimary,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionActive: { backgroundColor: colors.bgSubtle },
  optionText: { color: colors.textPrimary },
  optionTextActive: { fontWeight: "600", color: colors.navy },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.bgBase,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, color: colors.textPrimary },
  chipTextActive: { color: colors.goldForeground },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  primaryBtnText: { color: colors.goldForeground, fontWeight: "600" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.bgSurface,
  },
  secondaryBtnWide: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.textPrimary, fontWeight: "500" },
});
