import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
import {
  Avatar,
  Chip,
  ChipRow,
  EmptyState,
  Field,
  GhostButton,
  PrimaryButton,
} from "@/src/components/ui";
import { SearchField, StatusPill } from "@/src/components/premium/controls";
import { PremiumHeader } from "@/src/components/premium/screen";
import { InlineNotice, ScreenSkeleton } from "@/src/components/premium/states";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import { colors, layout, radius, spacing, typography } from "@/src/theme/tokens";

function formatRole(role: string) {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusTone(status: string): "success" | "warning" | "neutral" {
  switch (status) {
    case UserStatus.ACTIVE:
      return "success";
    case UserStatus.PENDING:
      return "warning";
    default:
      return "neutral";
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
    <View style={{ gap: spacing.md }}>
      <Text style={styles.fieldCaption}>Role</Text>
      <ChipRow>
        {ONBOARDABLE_ROLES.map((role) => (
          <Chip
            key={role}
            label={formatRole(role)}
            active={value.role === role}
            onPress={() =>
              onChange({
                role,
                stateId: "",
                zoneId: "",
                branchId: "",
              })
            }
          />
        ))}
      </ChipRow>

      {needsState ? (
        <>
          <Text style={styles.fieldCaption}>State</Text>
          <ChipRow>
            {orgTree.map((state) => (
              <Chip
                key={state.id}
                label={state.name}
                active={value.stateId === state.id}
                onPress={() =>
                  onChange({
                    ...value,
                    stateId: state.id,
                    zoneId: "",
                    branchId: "",
                  })
                }
              />
            ))}
          </ChipRow>
        </>
      ) : null}

      {needsZone ? (
        <>
          <Text style={styles.fieldCaption}>Zone</Text>
          <ChipRow>
            {zones.map((zone) => (
              <Chip
                key={zone.id}
                label={zone.name}
                active={value.zoneId === zone.id}
                onPress={() =>
                  onChange({
                    ...value,
                    zoneId: zone.id,
                    branchId: "",
                  })
                }
              />
            ))}
          </ChipRow>
        </>
      ) : null}

      {needsBranch ? (
        <>
          <Text style={styles.fieldCaption}>Branch</Text>
          <ChipRow>
            {branches.map((branch) => (
              <Chip
                key={branch.id}
                label={branch.name}
                active={value.branchId === branch.id}
                onPress={() =>
                  onChange({
                    ...value,
                    branchId: branch.id,
                  })
                }
              />
            ))}
          </ChipRow>
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
  const [reassignInitial, setReassignInitial] = useState<OrgForm | null>(null);
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
      setReassignInitial(null);
      await load();
    } catch (err) {
      setReassignError(
        err instanceof ApiError ? err.message : "Reassign failed",
      );
    } finally {
      setReassignBusy(false);
    }
  }

  function requestCloseOnboard() {
    if (onboardBusy) return;
    const dirty = JSON.stringify(onboardForm) !== JSON.stringify(INITIAL_ONBOARD);
    if (!dirty) {
      setOnboardOpen(false);
      return;
    }
    Alert.alert("Discard invite?", "The information you entered will be lost.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          setOnboardOpen(false);
          setOnboardForm(INITIAL_ONBOARD);
          setOnboardError(null);
        },
      },
    ]);
  }

  function requestCloseReassign() {
    if (reassignBusy) return;
    const dirty =
      reassignInitial !== null &&
      JSON.stringify(reassignForm) !== JSON.stringify(reassignInitial);
    if (!dirty) {
      setReassignPastor(null);
      return;
    }
    Alert.alert("Discard changes?", "This pastor’s assignment will not be updated.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => setReassignPastor(null),
      },
    ]);
  }

  function openActions(pastor: PastorRecord) {
    const buttons: {
      text: string;
      style?: "cancel" | "destructive" | "default";
      onPress?: () => void;
    }[] = [{ text: CancelLabel, style: "cancel" }];

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
          const next = {
            role: pastor.role,
            stateId: pastor.state?.id ?? "",
            zoneId: pastor.zone?.id ?? "",
            branchId: pastor.branch?.id ?? "",
          };
          setReassignForm(next);
          setReassignInitial(next);
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
              { text: CancelLabel, style: "cancel" },
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
      <PremiumHeader
        title="Pastors"
        icon="people"
        subtitle={
          summary
            ? `${summary.active} active · ${summary.pending} pending`
            : "Directory"
        }
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Onboard pastor"
            style={styles.onboardBtn}
            onPress={() => setOnboardOpen(true)}
          >
            <Text style={styles.onboardBtnText}>Onboard</Text>
          </Pressable>
        }
      />

      <SearchField
        placeholder="Search name or email"
        value={search}
        onChangeText={setSearch}
      />

      <ChipRow>
        {[
          { label: "All", value: undefined },
          { label: "Active", value: UserStatus.ACTIVE },
          { label: "Pending", value: UserStatus.PENDING },
          { label: "Deactivated", value: UserStatus.DEACTIVATED },
        ].map((opt) => (
          <Chip
            key={opt.label}
            label={opt.label}
            active={statusFilter === opt.value}
            onPress={() => setStatusFilter(opt.value)}
          />
        ))}
      </ChipRow>

      {error ? <InlineNotice message={error} /> : null}

      {loading ? (
        <ScreenSkeleton rows={5} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: spacing.md, gap: 0 }}
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
            <EmptyState
              title="No pastors found"
              body="Try another filter or onboard someone new."
            />
          }
          renderItem={({ item, index }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${formatRole(item.role)}, ${item.status}`}
              style={[
                styles.row,
                index === 0 && styles.rowFirst,
                index === items.length - 1 && styles.rowLast,
                index !== items.length - 1 && styles.rowDivider,
              ]}
              onPress={() => openActions(item)}
            >
              <Avatar name={item.name} imageUri={item.profilePicUrl} size={42} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <StatusPill label={item.status} tone={statusTone(item.status)} />
                </View>
                <Text style={styles.rowMeta}>{item.email}</Text>
                <Text style={styles.rowMeta}>
                  {formatRole(item.role)}
                  {item.branch?.name
                    ? ` · ${item.branch.name}`
                    : item.zone?.name
                      ? ` · ${item.zone.name}`
                      : item.state?.name
                        ? ` · ${item.state.name}`
                        : ""}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal
        visible={onboardOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={requestCloseOnboard}
      >
        <ScrollView
          style={styles.modalRoot}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}
        >
          <SheetHeader
            title="Onboard pastor"
            subtitle="Send a secure setup invitation."
            onClose={requestCloseOnboard}
            closeDisabled={onboardBusy}
          />
          <Field
            label="Name"
            value={onboardForm.name}
            onChangeText={(name) => setOnboardForm((f) => ({ ...f, name }))}
          />
          <Field
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={onboardForm.email}
            onChangeText={(email) => setOnboardForm((f) => ({ ...f, email }))}
          />
          <Field
            label="Phone (optional)"
            keyboardType="phone-pad"
            value={onboardForm.phone}
            onChangeText={(phone) => setOnboardForm((f) => ({ ...f, phone }))}
          />
          <OrgCascadeFields
            orgTree={orgTree}
            value={onboardForm}
            onChange={(next) => setOnboardForm((f) => ({ ...f, ...next }))}
          />
          {onboardError ? <InlineNotice message={onboardError} /> : null}
          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <GhostButton label="Cancel" onPress={requestCloseOnboard} disabled={onboardBusy} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Send invite"
                loading={onboardBusy}
                onPress={() => void submitOnboard()}
              />
            </View>
          </View>
        </ScrollView>
      </Modal>

      <Modal
        visible={Boolean(reassignPastor)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={requestCloseReassign}
      >
        <ScrollView
          style={styles.modalRoot}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}
        >
          <SheetHeader
            title={`Reassign ${reassignPastor?.name ?? "pastor"}`}
            subtitle="Update role and organisation assignment."
            onClose={requestCloseReassign}
            closeDisabled={reassignBusy}
          />
          <OrgCascadeFields
            orgTree={orgTree}
            value={reassignForm}
            onChange={setReassignForm}
          />
          {reassignError ? <InlineNotice message={reassignError} /> : null}
          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <GhostButton label="Cancel" onPress={requestCloseReassign} disabled={reassignBusy} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Save"
                loading={reassignBusy}
                onPress={() => void submitReassign()}
              />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const CancelLabel = "Cancel";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: layout.screenPad,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  onboardBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  onboardBtnText: {
    ...typography.footnote,
    fontWeight: "700",
    color: colors.textOnNavy,
  },
  search: {
    ...typography.body,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.bgSurface,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  fieldCaption: {
    ...typography.caption,
    color: colors.textMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowFirst: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  rowLast: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "center",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
  },
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  rowMeta: {
    ...typography.footnote,
    color: colors.textMuted,
    marginTop: 3,
  },
  error: {
    ...typography.footnote,
    color: colors.error,
    marginVertical: spacing.sm,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },
  modalTitle: {
    ...typography.title2,
    color: colors.navy,
  },
  modalSub: {
    ...typography.callout,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
