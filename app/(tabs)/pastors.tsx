import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ONBOARDABLE_ROLES,
  Role,
  UserStatus,
  validateOrgAssignmentStructure,
} from "@repo/types";
import {
  api,
  ApiError,
  type OrgState,
  type PastorRecord,
  type PastorListSummary,
} from "@/src/lib/api";
import { colors, radius, spacing } from "@/src/theme/tokens";

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}

function statusColor(status: string) {
  switch (status) {
    case UserStatus.ACTIVE:
      return colors.success;
    case UserStatus.PENDING:
      return colors.warning;
    case UserStatus.DEACTIVATED:
      return colors.textMuted;
    default:
      return colors.textMuted;
  }
}

type OrgForm = {
  role: Role;
  stateId: string;
  zoneId: string;
  branchId: string;
};

const INITIAL_ONBOARD = {
  name: "",
  email: "",
  phone: "",
  role: Role.BRANCH_PASTOR as Role,
  stateId: "",
  zoneId: "",
  branchId: "",
};

function OrgCascadeFields({
  orgTree,
  value,
  onChange,
}: {
  orgTree: OrgState[];
  value: OrgForm;
  onChange: (next: OrgForm) => void;
}) {
  const zones = useMemo(() => {
    const state = orgTree.find((s) => s.id === value.stateId);
    return state?.zones ?? [];
  }, [orgTree, value.stateId]);

  const branches = useMemo(() => {
    const zone = zones.find((z) => z.id === value.zoneId);
    return zone?.branches ?? [];
  }, [zones, value.zoneId]);

  const needsState =
    value.role === Role.STATE_PASTOR ||
    value.role === Role.ZONAL_PASTOR ||
    value.role === Role.BRANCH_PASTOR;
  const needsZone =
    value.role === Role.ZONAL_PASTOR || value.role === Role.BRANCH_PASTOR;
  const needsBranch = value.role === Role.BRANCH_PASTOR;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.label}>Role</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {ONBOARDABLE_ROLES.map((role) => (
            <Pressable
              key={role}
              style={[styles.chip, value.role === role && styles.chipActive]}
              onPress={() =>
                onChange({
                  role,
                  stateId: "",
                  zoneId: "",
                  branchId: "",
                })
              }
            >
              <Text
                style={[
                  styles.chipText,
                  value.role === role && styles.chipTextActive,
                ]}
              >
                {formatRole(role)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {needsState ? (
        <>
          <Text style={styles.label}>State</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {orgTree.map((state) => (
                <Pressable
                  key={state.id}
                  style={[
                    styles.chip,
                    value.stateId === state.id && styles.chipActive,
                  ]}
                  onPress={() =>
                    onChange({
                      ...value,
                      stateId: state.id,
                      zoneId: "",
                      branchId: "",
                    })
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      value.stateId === state.id && styles.chipTextActive,
                    ]}
                  >
                    {state.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </>
      ) : null}

      {needsZone ? (
        <>
          <Text style={styles.label}>Zone</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {zones.map((zone) => (
                <Pressable
                  key={zone.id}
                  style={[
                    styles.chip,
                    value.zoneId === zone.id && styles.chipActive,
                  ]}
                  onPress={() =>
                    onChange({
                      ...value,
                      zoneId: zone.id,
                      branchId: "",
                    })
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      value.zoneId === zone.id && styles.chipTextActive,
                    ]}
                  >
                    {zone.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </>
      ) : null}

      {needsBranch ? (
        <>
          <Text style={styles.label}>Branch</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {branches.map((branch) => (
                <Pressable
                  key={branch.id}
                  style={[
                    styles.chip,
                    value.branchId === branch.id && styles.chipActive,
                  ]}
                  onPress={() =>
                    onChange({
                      ...value,
                      branchId: branch.id,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      value.branchId === branch.id && styles.chipTextActive,
                    ]}
                  >
                    {branch.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

export default function PastorsScreen() {
  const [items, setItems] = useState<PastorRecord[]>([]);
  const [summary, setSummary] = useState<PastorListSummary | null>(null);
  const [orgTree, setOrgTree] = useState<OrgState[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardForm, setOnboardForm] = useState(INITIAL_ONBOARD);
  const [onboardBusy, setOnboardBusy] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);

  const [reassignPastor, setReassignPastor] = useState<PastorRecord | null>(null);
  const [reassignForm, setReassignForm] = useState<OrgForm>({
    role: Role.BRANCH_PASTOR,
    stateId: "",
    zoneId: "",
    branchId: "",
  });
  const [reassignBusy, setReassignBusy] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [pastors, tree] = await Promise.all([
        api.listPastors({
          search: search.trim() || undefined,
          status: statusFilter,
          perPage: 50,
        }),
        api.getOrgTree(),
      ]);
      setItems(pastors.items);
      setSummary(pastors.summary);
      setOrgTree(tree);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load pastors");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      void load();
    }, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function submitOnboard() {
    setOnboardError(null);
    const structuralError = validateOrgAssignmentStructure(onboardForm.role, {
      stateId: onboardForm.stateId || null,
      zoneId: onboardForm.zoneId || null,
      branchId: onboardForm.branchId || null,
    });
    if (structuralError) {
      setOnboardError(structuralError);
      return;
    }
    setOnboardBusy(true);
    try {
      await api.createOnboardingUser({
        name: onboardForm.name.trim(),
        email: onboardForm.email.trim().toLowerCase(),
        phone: onboardForm.phone.trim() || undefined,
        role: onboardForm.role,
        stateId: onboardForm.stateId || undefined,
        zoneId: onboardForm.zoneId || undefined,
        branchId: onboardForm.branchId || undefined,
      });
      setOnboardOpen(false);
      setOnboardForm(INITIAL_ONBOARD);
      await load();
      Alert.alert("Invite sent", "Onboarding email queued for the pastor.");
    } catch (err) {
      setOnboardError(err instanceof ApiError ? err.message : "Onboard failed");
    } finally {
      setOnboardBusy(false);
    }
  }

  async function submitReassign() {
    if (!reassignPastor) return;
    setReassignError(null);
    const structuralError = validateOrgAssignmentStructure(reassignForm.role, {
      stateId: reassignForm.stateId || null,
      zoneId: reassignForm.zoneId || null,
      branchId: reassignForm.branchId || null,
    });
    if (structuralError) {
      setReassignError(structuralError);
      return;
    }
    setReassignBusy(true);
    try {
      await api.reassignUser(reassignPastor.id, {
        role: reassignForm.role,
        stateId: reassignForm.stateId || null,
        zoneId: reassignForm.zoneId || null,
        branchId: reassignForm.branchId || null,
      });
      setReassignPastor(null);
      await load();
    } catch (err) {
      setReassignError(
        err instanceof ApiError ? err.message : "Reassign failed",
      );
    } finally {
      setReassignBusy(false);
    }
  }

  function openActions(pastor: PastorRecord) {
    const buttons: {
      text: string;
      style?: "cancel" | "destructive" | "default";
      onPress?: () => void;
    }[] = [{ text: "Cancel", style: "cancel" }];

    if (pastor.status === UserStatus.PENDING) {
      buttons.push({
        text: "Resend invite",
        onPress: () => {
          void (async () => {
            try {
              await api.resendOnboarding(pastor.id);
              Alert.alert("Sent", "Onboarding email resent.");
              await load();
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof ApiError ? err.message : "Resend failed",
              );
            }
          })();
        },
      });
    }

    if (pastor.status === UserStatus.ACTIVE) {
      buttons.push({
        text: "Reassign",
        onPress: () => {
          setReassignForm({
            role: pastor.role,
            stateId: pastor.state?.id ?? "",
            zoneId: pastor.zone?.id ?? "",
            branchId: pastor.branch?.id ?? "",
          });
          setReassignError(null);
          setReassignPastor(pastor);
        },
      });
    }

    if (pastor.status !== UserStatus.DEACTIVATED) {
      buttons.push({
        text: "Deactivate",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Deactivate pastor?",
            `${pastor.name} will lose access immediately.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Deactivate",
                style: "destructive",
                onPress: () => {
                  void (async () => {
                    try {
                      await api.deactivateUser(pastor.id);
                      await load();
                    } catch (err) {
                      Alert.alert(
                        "Error",
                        err instanceof ApiError
                          ? err.message
                          : "Deactivate failed",
                      );
                    }
                  })();
                },
              },
            ],
          );
        },
      });
    }

    Alert.alert(pastor.name, pastor.email, buttons);
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Pastors</Text>
          {summary ? (
            <Text style={styles.summary}>
              {summary.total} total · {summary.active} active · {summary.pending}{" "}
              pending
            </Text>
          ) : null}
        </View>
        <Pressable style={styles.primaryBtn} onPress={() => setOnboardOpen(true)}>
          <Text style={styles.primaryBtnText}>Onboard</Text>
        </Pressable>
      </View>

      <TextInput
        placeholder="Search name or email"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {[
            { label: "All", value: undefined },
            { label: "Active", value: UserStatus.ACTIVE },
            { label: "Pending", value: UserStatus.PENDING },
            { label: "Deactivated", value: UserStatus.DEACTIVATED },
          ].map((opt) => (
            <Pressable
              key={opt.label}
              style={[
                styles.chip,
                statusFilter === opt.value && styles.chipActive,
              ]}
              onPress={() => setStatusFilter(opt.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  statusFilter === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.navy} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: spacing.md, gap: spacing.sm }}
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
          ListEmptyComponent={
            <Text style={styles.empty}>No pastors match these filters.</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openActions(item)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={[styles.badge, { color: statusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
              <Text style={styles.cardMeta}>{item.email}</Text>
              <Text style={styles.cardMeta}>
                {formatRole(item.role)}
                {item.branch?.name
                  ? ` · ${item.branch.name}`
                  : item.zone?.name
                    ? ` · ${item.zone.name}`
                    : item.state?.name
                      ? ` · ${item.state.name}`
                      : ""}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={onboardOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView
          style={styles.modalRoot}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}
        >
          <Text style={styles.modalTitle}>Onboard pastor</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={onboardForm.name}
            onChangeText={(name) => setOnboardForm((f) => ({ ...f, name }))}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={onboardForm.email}
            onChangeText={(email) => setOnboardForm((f) => ({ ...f, email }))}
          />
          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={onboardForm.phone}
            onChangeText={(phone) => setOnboardForm((f) => ({ ...f, phone }))}
          />
          <OrgCascadeFields
            orgTree={orgTree}
            value={onboardForm}
            onChange={(next) => setOnboardForm((f) => ({ ...f, ...next }))}
          />
          {onboardError ? <Text style={styles.error}>{onboardError}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setOnboardOpen(false)}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, onboardBusy && { opacity: 0.6 }]}
              disabled={onboardBusy}
              onPress={() => void submitOnboard()}
            >
              {onboardBusy ? (
                <ActivityIndicator color={colors.goldForeground} />
              ) : (
                <Text style={styles.primaryBtnText}>Send invite</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </Modal>

      <Modal
        visible={Boolean(reassignPastor)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ScrollView
          style={styles.modalRoot}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}
        >
          <Text style={styles.modalTitle}>Reassign {reassignPastor?.name}</Text>
          <OrgCascadeFields
            orgTree={orgTree}
            value={reassignForm}
            onChange={setReassignForm}
          />
          {reassignError ? <Text style={styles.error}>{reassignError}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setReassignPastor(null)}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, reassignBusy && { opacity: 0.6 }]}
              disabled={reassignBusy}
              onPress={() => void submitReassign()}
            >
              {reassignBusy ? (
                <ActivityIndicator color={colors.goldForeground} />
              ) : (
                <Text style={styles.primaryBtnText}>Save</Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.navy,
  },
  summary: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.goldForeground,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardName: {
    fontWeight: "600",
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardMeta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  error: {
    color: colors.error,
    marginVertical: spacing.sm,
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
  modalRoot: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: spacing.sm,
  },
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
  primaryBtnText: {
    color: colors.goldForeground,
    fontWeight: "600",
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontWeight: "500",
  },
});
