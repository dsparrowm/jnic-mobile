import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
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
  type DirectorateRecord,
  type DirectorateDesk,
  type OrgRegion,
  type OrgState,
  type OrgTreeResponse,
  type PastorRecord,
  type PastorListSummary,
  type ServiceUnitRecord,
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
import { BottomSheet } from "@/src/components/premium/bottom-sheet";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import { showAppAlert } from "@/src/components/premium/app-alert";
import { humanizeStatus } from "@/src/lib/format";
import { useAuth } from "@/src/lib/session";
import { router, useLocalSearchParams } from "expo-router";
import {
  colors,
  layout,
  radius,
  spacing,
  typography,
} from "@/src/theme/tokens";

function formatRole(role: string) {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  regionId: string;
  stateId: string;
  zoneId: string;
  districtId: string;
  branchId: string;
};

const INITIAL_ONBOARD = {
  name: "",
  email: "",
  phone: "",
  role: Role.BRANCH_PASTOR as Role,
  regionId: "",
  stateId: "",
  zoneId: "",
  districtId: "",
  branchId: "",
  directorateId: "",
  deskId: "",
  office: "MEMBER",
  serviceUnitId: "",
};

const MEMBER_OFFICES = [
  { value: "MEMBER", label: "Member" },
  { value: "DESK_HEAD", label: "Desk Head" },
  { value: "DEPUTY_DESK_HEAD", label: "Deputy Desk Head" },
  { value: "SECRETARY", label: "Secretary" },
  { value: "DIRECTOR", label: "Director" },
  { value: "DEPUTY_DIRECTOR", label: "Deputy Director" },
];

type BranchOption = OrgState["zones"][number]["branches"][number] & {
  scopeName: string | null;
};

function OrgCascadeFields({
  orgTree,
  regions,
  value,
  onChange,
}: {
  orgTree: OrgState[];
  regions: OrgRegion[];
  value: OrgForm;
  onChange: (next: OrgForm) => void;
}) {
  const zones = useMemo(() => {
    const state = orgTree.find((s) => s.id === value.stateId);
    return state?.zones ?? [];
  }, [orgTree, value.stateId]);

  const stateRecord = useMemo(
    () => orgTree.find((s) => s.id === value.stateId),
    [orgTree, value.stateId],
  );

  const allDistricts = useMemo(
    () =>
      orgTree.flatMap((state) =>
        state.zones.flatMap((zone) =>
          zone.districts.map((district) => ({
            ...district,
            zoneName: zone.name,
          })),
        ),
      ),
    [orgTree],
  );

  const branches = useMemo((): BranchOption[] => {
    const zoneBranches = (zone: OrgState["zones"][number]): BranchOption[] => [
      ...zone.branches.map((branch) => ({
        ...branch,
        scopeName: zone.name as string | null,
      })),
      ...zone.districts.flatMap((district) =>
        district.branches.map((branch) => ({
          ...branch,
          scopeName: `${zone.name} · ${district.name}` as string | null,
        })),
      ),
    ];
    if (value.role === Role.MEMBER) {
      return orgTree.flatMap((state) => [
        ...state.zones.flatMap(zoneBranches),
        ...(state.branches ?? []).map((branch) => ({
          ...branch,
          scopeName: state.name as string | null,
        })),
      ]);
    }
    if (value.role === Role.DISTRICT_PASTOR) {
      const district = allDistricts.find((d) => d.id === value.districtId);
      return (district?.branches ?? []).map((branch) => ({
        ...branch,
        scopeName: district?.name ?? null,
      }));
    }
    if (value.role === Role.STATE_PASTOR) {
      const zoned = zones.flatMap(zoneBranches);
      const unzoned = (stateRecord?.branches ?? []).map((branch) => ({
        ...branch,
        scopeName: null as string | null,
      }));
      return [...zoned, ...unzoned];
    }
    const zone = zones.find((z) => z.id === value.zoneId);
    return zone ? zoneBranches(zone) : [];
  }, [orgTree, allDistricts, stateRecord?.branches, value.role, value.districtId, value.zoneId, zones]);

  const needsRegion = value.role === Role.REGIONAL_PASTOR;
  const needsState =
    value.role === Role.STATE_PASTOR ||
    value.role === Role.ZONAL_PASTOR ||
    value.role === Role.BRANCH_PASTOR;
  const needsZone =
    value.role === Role.ZONAL_PASTOR || value.role === Role.BRANCH_PASTOR;
  const needsDistrict = value.role === Role.DISTRICT_PASTOR;
  const needsBranch = value.role === Role.BRANCH_PASTOR;
  const optionalBranch =
    value.role === Role.STATE_PASTOR ||
    value.role === Role.ZONAL_PASTOR ||
    value.role === Role.DISTRICT_PASTOR ||
    value.role === Role.MEMBER;

  return (
    <View style={{ gap: spacing.md }}>
      <Text style={styles.fieldCaption}>Role</Text>
      <ChipRow wrap>
        {ONBOARDABLE_ROLES.map((role) => (
          <Chip
            key={role}
            label={formatRole(role)}
            active={value.role === role}
            onPress={() =>
              onChange({
                role,
                regionId: "",
                stateId: "",
                zoneId: "",
                districtId: "",
                branchId: "",
              })
            }
          />
        ))}
      </ChipRow>

      {needsRegion ? (
        <>
          <Text style={styles.fieldCaption}>Region</Text>
          <ChipRow>
            {regions.map((region) => (
              <Chip
                key={region.id}
                label={region.name}
                active={value.regionId === region.id}
                onPress={() =>
                  onChange({
                    ...value,
                    regionId: region.id,
                    stateId: "",
                    zoneId: "",
                    districtId: "",
                    branchId: "",
                  })
                }
              />
            ))}
          </ChipRow>
        </>
      ) : null}

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
                    districtId: "",
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
                    districtId: "",
                    branchId: "",
                  })
                }
              />
            ))}
          </ChipRow>
        </>
      ) : null}

      {needsDistrict ? (
        <>
          <Text style={styles.fieldCaption}>District</Text>
          <ChipRow>
            {allDistricts.map((district) => (
              <Chip
                key={district.id}
                label={`${district.name} · ${district.zoneName}`}
                active={value.districtId === district.id}
                onPress={() =>
                  onChange({
                    ...value,
                    districtId: district.id,
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
                label={
                  branch.scopeName
                    ? `${branch.name} · ${branch.scopeName}`
                    : branch.name
                }
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

      {optionalBranch ? (
        <>
          <Text style={styles.fieldCaption}>
            {value.role === Role.MEMBER
              ? "Home branch (optional)"
              : "Home branch (optional)"}
          </Text>
          <ChipRow>
            <Chip
              label="None"
              active={!value.branchId}
              onPress={() =>
                onChange({
                  ...value,
                  branchId: "",
                  zoneId: value.role === Role.STATE_PASTOR ? "" : value.zoneId,
                })
              }
            />
            {branches.map((branch) => (
              <Chip
                key={branch.id}
                label={
                  branch.scopeName
                    ? `${branch.name} · ${branch.scopeName}`
                    : branch.name
                }
                active={value.branchId === branch.id}
                onPress={() =>
                  onChange({
                    ...value,
                    branchId: branch.id,
                    zoneId: branch.zoneId ?? "",
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
  const { user } = useAuth();
  const params = useLocalSearchParams<{ onboard?: string }>();
  const canManage =
    user?.role === Role.ADMIN || user?.hrPersonnel === true;
  const [items, setItems] = useState<PastorRecord[]>([]);
  const [summary, setSummary] = useState<PastorListSummary | null>(null);
  const [orgTree, setOrgTree] = useState<OrgTreeResponse>({ regions: [], unassignedStates: [] });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [onboardOpen, setOnboardOpen] = useState(params.onboard === "1");

  // Deep link "/pastors?onboard=1" opens the onboard sheet — also re-fires
  // when the screen stays mounted and the user taps the row again.
  useEffect(() => {
    if (params.onboard === "1") setOnboardOpen(true);
  }, [params.onboard]);
  const [onboardForm, setOnboardForm] = useState(INITIAL_ONBOARD);
  const [onboardBusy, setOnboardBusy] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [directorates, setDirectorates] = useState<DirectorateRecord[] | null>(
    null,
  );
  const [directorateDesks, setDirectorateDesks] = useState<DirectorateDesk[]>(
    [],
  );
  const [serviceUnits, setServiceUnits] = useState<ServiceUnitRecord[]>([]);

  const [reassignPastor, setReassignPastor] = useState<PastorRecord | null>(
    null,
  );
  const [reassignForm, setReassignForm] = useState<OrgForm>({
    role: Role.BRANCH_PASTOR,
    regionId: "",
    stateId: "",
    zoneId: "",
    districtId: "",
    branchId: "",
  });
  const [reassignInitial, setReassignInitial] = useState<OrgForm | null>(null);
  const [reassignBusy, setReassignBusy] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignNote, setReassignNote] = useState("");

  const [actionPastor, setActionPastor] = useState<PastorRecord | null>(null);

  const allOrgStates = useMemo(
    () => [
      ...orgTree.unassignedStates,
      ...orgTree.regions.flatMap((r) => r.states),
    ],
    [orgTree],
  );

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
      setError(
        err instanceof ApiError ? err.message : "Failed to load pastors",
      );
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

  // Lazy-load directorate + unit options when onboarding a MEMBER.
  useEffect(() => {
    if (!onboardOpen || onboardForm.role !== Role.MEMBER) return;
    if (directorates !== null) return;
    api
      .listDirectorates()
      .then(setDirectorates)
      .catch(() => setDirectorates([]));
    api
      .listAllServiceUnits()
      .then(setServiceUnits)
      .catch(() => setServiceUnits([]));
  }, [onboardOpen, onboardForm.role, directorates]);

  useEffect(() => {
    if (!onboardForm.directorateId) {
      setDirectorateDesks([]);
      return;
    }
    api
      .getDirectorate(onboardForm.directorateId)
      .then((d) => setDirectorateDesks(d.desks))
      .catch(() => setDirectorateDesks([]));
  }, [onboardForm.directorateId]);

  async function submitOnboard() {
    setOnboardError(null);
    const structuralError = validateOrgAssignmentStructure(onboardForm.role, {
      regionId: onboardForm.regionId || null,
      stateId: onboardForm.stateId || null,
      zoneId: onboardForm.zoneId || null,
      districtId: onboardForm.districtId || null,
      branchId: onboardForm.branchId || null,
    });
    if (structuralError) {
      setOnboardError(structuralError);
      return;
    }
    setOnboardBusy(true);
    try {
      const deskNeeded =
        onboardForm.office === "DESK_HEAD" ||
        onboardForm.office === "DEPUTY_DESK_HEAD";
      await api.createOnboardingUser({
        name: onboardForm.name.trim(),
        email: onboardForm.email.trim().toLowerCase(),
        phone: onboardForm.phone.trim() || undefined,
        role: onboardForm.role,
        regionId: onboardForm.regionId || undefined,
        stateId: onboardForm.stateId || undefined,
        zoneId: onboardForm.zoneId || undefined,
        districtId: onboardForm.districtId || undefined,
        branchId: onboardForm.branchId || undefined,
        ...(onboardForm.directorateId
          ? {
              directorateId: onboardForm.directorateId,
              deskId: deskNeeded ? onboardForm.deskId || undefined : undefined,
              office: onboardForm.office,
              serviceUnitId: onboardForm.serviceUnitId || undefined,
            }
          : {}),
      });
      setOnboardOpen(false);
      setOnboardForm(INITIAL_ONBOARD);
      await load();
      void showAppAlert("Invite sent", "Onboarding email queued for the pastor.");
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
      regionId: reassignForm.regionId || null,
      stateId: reassignForm.stateId || null,
      zoneId: reassignForm.zoneId || null,
      districtId: reassignForm.districtId || null,
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
        regionId: reassignForm.regionId || null,
        stateId: reassignForm.stateId || null,
        zoneId: reassignForm.zoneId || null,
        districtId: reassignForm.districtId || null,
        branchId: reassignForm.branchId || null,
        note: reassignNote.trim() || undefined,
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
    const dirty =
      JSON.stringify(onboardForm) !== JSON.stringify(INITIAL_ONBOARD);
    if (!dirty) {
      setOnboardOpen(false);
      return;
    }
    void (async () => {
      const discard = await showAppAlert(
        "Discard invite?",
        "The information you entered will be lost.",
        { confirmLabel: "Discard", cancelLabel: "Keep editing", destructive: true },
      );
      if (discard) {
        setOnboardOpen(false);
        setOnboardForm(INITIAL_ONBOARD);
        setOnboardError(null);
      }
    })();
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
    void (async () => {
      const discard = await showAppAlert(
        "Discard changes?",
        "This pastor’s assignment will not be updated.",
        { confirmLabel: "Discard", cancelLabel: "Keep editing", destructive: true },
      );
      if (discard) setReassignPastor(null);
    })();
  }

  function openActions(pastor: PastorRecord) {
    setActionPastor(pastor);
  }

  function resendInvite(pastor: PastorRecord) {
    setActionPastor(null);
    void (async () => {
      try {
        await api.resendOnboarding(pastor.id);
        await load();
      } catch (err) {
        void showAppAlert(
          "Error",
          err instanceof ApiError ? err.message : "Resend failed",
        );
      }
    })();
  }

  function openReassign(pastor: PastorRecord) {
    setActionPastor(null);
    const next = {
      role: pastor.role,
      regionId: pastor.region?.id ?? "",
      stateId: pastor.state?.id ?? "",
      zoneId: pastor.zone?.id ?? "",
      districtId: pastor.district?.id ?? "",
      branchId: pastor.branch?.id ?? "",
    };
    setReassignForm(next);
    setReassignInitial(next);
    setReassignNote("");
    setReassignError(null);
    setReassignPastor(pastor);
  }

  function confirmDeactivate(pastor: PastorRecord) {
    setActionPastor(null);
    void (async () => {
      const ok = await showAppAlert(
        "Deactivate pastor?",
        `${pastor.name} will lose access immediately.`,
        { confirmLabel: "Deactivate", cancelLabel: "Cancel", destructive: true },
      );
      if (!ok) return;
      try {
        await api.deactivateUser(pastor.id);
        await load();
      } catch (err) {
        void showAppAlert(
          "Error",
          err instanceof ApiError ? err.message : "Deactivate failed",
        );
      }
    })();
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
          canManage ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Onboard pastor"
              style={styles.onboardBtn}
              onPress={() => setOnboardOpen(true)}
            >
              <Text style={styles.onboardBtnText}>Onboard</Text>
            </Pressable>
          ) : undefined
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
              tintColor={colors.gold}
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
              <Avatar
                name={item.name}
                imageUri={item.profilePicUrl}
                size={42}
              />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <StatusPill
                    label={humanizeStatus(item.status)}
                    tone={statusTone(item.status)}
                  />
                </View>
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

      <BottomSheet
        visible={onboardOpen}
        onClose={requestCloseOnboard}
        scrollable
      >
        <SheetHeader
          title={
            onboardForm.role === Role.MEMBER ? "Onboard member" : "Onboard pastor"
          }
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
          orgTree={allOrgStates}
          regions={orgTree.regions}
          value={onboardForm}
          onChange={(next) =>
            setOnboardForm((f) => ({
              ...f,
              ...next,
              ...(next.role && next.role !== f.role
                ? {
                    directorateId: "",
                    deskId: "",
                    office: "MEMBER",
                    serviceUnitId: "",
                  }
                : {}),
            }))
          }
        />
        {onboardForm.role === Role.MEMBER ? (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.fieldCaption}>Directorate</Text>
            <ChipRow wrap>
              <Chip
                label="None"
                active={!onboardForm.directorateId}
                onPress={() =>
                  setOnboardForm((f) => ({
                    ...f,
                    directorateId: "",
                    deskId: "",
                    serviceUnitId: "",
                  }))
                }
              />
              {(directorates ?? []).map((d) => (
                <Chip
                  key={d.id}
                  label={d.name.replace(/\s+Directorate$/, "")}
                  active={onboardForm.directorateId === d.id}
                  onPress={() =>
                    setOnboardForm((f) => ({
                      ...f,
                      directorateId: d.id,
                      deskId: "",
                      serviceUnitId: "",
                    }))
                  }
                />
              ))}
            </ChipRow>
            {onboardForm.directorateId ? (
              <>
                <Text style={styles.fieldCaption}>Office</Text>
                <ChipRow wrap>
                  {MEMBER_OFFICES.map((o) => (
                    <Chip
                      key={o.value}
                      label={o.label}
                      active={onboardForm.office === o.value}
                      onPress={() =>
                        setOnboardForm((f) => ({
                          ...f,
                          office: o.value,
                          deskId: "",
                        }))
                      }
                    />
                  ))}
                </ChipRow>
                {(onboardForm.office === "DESK_HEAD" ||
                  onboardForm.office === "DEPUTY_DESK_HEAD") &&
                directorateDesks.length > 0 ? (
                  <>
                    <Text style={styles.fieldCaption}>Desk</Text>
                    <ChipRow wrap>
                      {directorateDesks.map((desk) => (
                        <Chip
                          key={desk.id}
                          label={desk.name}
                          active={onboardForm.deskId === desk.id}
                          onPress={() =>
                            setOnboardForm((f) => ({ ...f, deskId: desk.id }))
                          }
                        />
                      ))}
                    </ChipRow>
                  </>
                ) : null}
                {(() => {
                  const units = serviceUnits.filter(
                    (u) =>
                      u.directorate.id === onboardForm.directorateId &&
                      u.coordinator === null &&
                      (!onboardForm.branchId ||
                        u.branch.id === onboardForm.branchId),
                  );
                  return units.length > 0 ? (
                    <>
                      <Text style={styles.fieldCaption}>
                        Service unit to coordinate (optional)
                      </Text>
                      <ChipRow wrap>
                        <Chip
                          label="None"
                          active={!onboardForm.serviceUnitId}
                          onPress={() =>
                            setOnboardForm((f) => ({ ...f, serviceUnitId: "" }))
                          }
                        />
                        {units.map((u) => (
                          <Chip
                            key={u.id}
                            label={`${u.unitType.name} · ${u.branch.name}`}
                            active={onboardForm.serviceUnitId === u.id}
                            onPress={() =>
                              setOnboardForm((f) => ({
                                ...f,
                                serviceUnitId: u.id,
                                branchId: u.branch.id,
                              }))
                            }
                          />
                        ))}
                      </ChipRow>
                    </>
                  ) : null;
                })()}
              </>
            ) : null}
          </View>
        ) : null}
        {onboardError ? <InlineNotice message={onboardError} /> : null}
        <View style={styles.modalActions}>
          <View style={{ flex: 1 }}>
            <GhostButton
              label="Cancel"
              onPress={requestCloseOnboard}
              disabled={onboardBusy}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Send invite"
              loading={onboardBusy}
              onPress={() => void submitOnboard()}
            />
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={Boolean(reassignPastor)}
        onClose={requestCloseReassign}
        scrollable
      >
        <SheetHeader
          title={`Reassign ${reassignPastor?.name ?? "pastor"}`}
          subtitle="Update role and organisation assignment."
          onClose={requestCloseReassign}
          closeDisabled={reassignBusy}
        />
        <OrgCascadeFields
          orgTree={allOrgStates}
          regions={orgTree.regions}
          value={reassignForm}
          onChange={setReassignForm}
        />
        <Field
          label="Move note (optional)"
          value={reassignNote}
          onChangeText={setReassignNote}
          placeholder="e.g. Transferred to cover Victoria Island"
        />
        {reassignError ? <InlineNotice message={reassignError} /> : null}
        <View style={styles.modalActions}>
          <View style={{ flex: 1 }}>
            <GhostButton
              label="Cancel"
              onPress={requestCloseReassign}
              disabled={reassignBusy}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Save"
              loading={reassignBusy}
              onPress={() => void submitReassign()}
            />
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={actionPastor !== null}
        onClose={() => setActionPastor(null)}
      >
        {actionPastor ? (
          <>
            <SheetHeader
              title={actionPastor.name}
              subtitle={`${formatRole(actionPastor.role)} · ${actionPastor.email}`}
              onClose={() => setActionPastor(null)}
            />
            {canManage && actionPastor.status === UserStatus.PENDING ? (
              <Pressable
                accessibilityRole="button"
                style={styles.actionRow}
                onPress={() => resendInvite(actionPastor)}
              >
                <Text style={styles.actionRowText}>Resend invite</Text>
              </Pressable>
            ) : null}
            {canManage && actionPastor.status === UserStatus.ACTIVE ? (
              <Pressable
                accessibilityRole="button"
                style={styles.actionRow}
                onPress={() => openReassign(actionPastor)}
              >
                <Text style={styles.actionRowText}>Reassign</Text>
              </Pressable>
            ) : null}
            {canManage ? (
              <Pressable
                accessibilityRole="button"
                style={styles.actionRow}
                onPress={() => {
                  const target = actionPastor;
                  setActionPastor(null);
                  router.push({
                    pathname: "/moves",
                    params: { id: target.id, name: target.name },
                  });
                }}
              >
                <Text style={styles.actionRowText}>Move history</Text>
              </Pressable>
            ) : null}
            {canManage && actionPastor.status !== UserStatus.DEACTIVATED ? (
              <Pressable
                accessibilityRole="button"
                style={styles.actionRow}
                onPress={() => confirmDeactivate(actionPastor)}
              >
                <Text style={styles.actionRowDanger}>Deactivate</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </BottomSheet>
    </View>
  );
}



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
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  onboardBtnText: {
    ...typography.footnote,
    fontWeight: "700",
    color: colors.textPrimary,
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
  modalTitle: {
    ...typography.title2,
    color: colors.textPrimary,
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
  actionRow: {
    minHeight: 52,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  actionRowText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  actionRowDanger: {
    ...typography.bodyStrong,
    color: colors.error,
  },
});
