import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  computeWeekOf,
  formatWeekEndingLabel,
  listDaysOfWeek,
  type WeeklyReportInput,
  type WeeklyReportRecord,
} from "@repo/types";
import { Field, GhostButton, PrimaryButton } from "@/src/components/ui";
import { InlineNotice } from "@/src/components/premium/states";
import { SheetHeader } from "@/src/components/premium/sheet-header";
import { SurfaceCard } from "@/src/components/premium/screen";
import { formatCount, formatMoney } from "@/src/lib/format";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export type WeeklyFormValues = WeeklyReportInput;

type DraftValues = {
  serviceDate: string;
  adultCount: string;
  teenageCount: string;
  childrenCount: string;
  tithe: string;
  offering: string;
  other: string;
};

function toDraft(
  report: WeeklyReportRecord | null | undefined,
  defaultServiceDate: string,
): DraftValues {
  return {
    serviceDate: report?.serviceDate ?? defaultServiceDate,
    adultCount: report ? String(report.attendance?.adultCount ?? 0) : "",
    teenageCount: report ? String(report.attendance?.teenageCount ?? 0) : "",
    childrenCount: report ? String(report.attendance?.childrenCount ?? 0) : "",
    tithe: report ? formatAmount(String(report.finance?.tithe ?? 0)) : "",
    offering: report ? formatAmount(String(report.finance?.offering ?? 0)) : "",
    other: report ? formatAmount(String(report.finance?.other ?? 0)) : "",
  };
}

function parseCount(value: string): number | null {
  const trimmed = value.replace(/[^0-9]/g, "");
  if (trimmed === "") return null;
  const next = Number.parseInt(trimmed, 10);
  return Number.isFinite(next) && next >= 0 ? next : null;
}

function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (cleaned === "" || cleaned === ".") return null;
  const next = Number.parseFloat(cleaned);
  return Number.isFinite(next) && next >= 0 ? next : null;
}

function formatAmount(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (cleaned === "") return "";
  const [whole = "0", ...rest] = cleaned.split(".");
  const grouped = Number.parseInt(whole || "0", 10).toLocaleString("en-NG");
  if (rest.length === 0) return grouped;
  return `${grouped}.${rest.join("").slice(0, 2)}`;
}

function weekdayShort(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(`${date}T12:00:00Z`));
}

function dayNumber(date: string): string {
  return date.slice(8, 10);
}

export function WeeklyReportFields({
  existingReport,
  defaultServiceDate,
  branchName,
  loading,
  error,
  onSubmit,
}: {
  existingReport?: WeeklyReportRecord | null;
  defaultServiceDate: string;
  branchName?: string | null;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: WeeklyFormValues) => Promise<void>;
}) {
  const locked = existingReport ? !existingReport.editable : false;
  const [values, setValues] = useState<DraftValues>(() =>
    toDraft(existingReport, defaultServiceDate),
  );
  const [noService, setNoService] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setValues(toDraft(existingReport, defaultServiceDate));
    setNoService(false);
    setFormError(null);
  }, [existingReport, defaultServiceDate]);

  const weekOf = values.serviceDate ? computeWeekOf(values.serviceDate) : "";
  const weekDays = useMemo(
    () => (weekOf ? listDaysOfWeek(weekOf) : []),
    [weekOf],
  );
  const weekEnding = weekOf ? formatWeekEndingLabel(weekOf) : "—";
  const disabled = locked || loading || noService;

  const adults = parseCount(values.adultCount);
  const teenagers = parseCount(values.teenageCount);
  const children = parseCount(values.childrenCount);
  const tithe = parseAmount(values.tithe);
  const offering = parseAmount(values.offering);
  const other = parseAmount(values.other);

  const attendanceTotal =
    (adults ?? 0) + (teenagers ?? 0) + (children ?? 0);
  const financeTotal = (tithe ?? 0) + (offering ?? 0) + (other ?? 0);
  const allZero = attendanceTotal === 0 && financeTotal === 0;

  function parsedValues(): WeeklyFormValues | null {
    if (!values.serviceDate) return null;
    if (noService) {
      return {
        serviceDate: values.serviceDate,
        adultCount: 0,
        teenageCount: 0,
        childrenCount: 0,
        tithe: 0,
        offering: 0,
        other: 0,
        currency: "NGN",
      };
    }
    if (
      adults === null ||
      teenagers === null ||
      children === null ||
      tithe === null ||
      offering === null ||
      other === null
    ) {
      return null;
    }
    return {
      serviceDate: values.serviceDate,
      adultCount: adults,
      teenageCount: teenagers,
      childrenCount: children,
      tithe,
      offering,
      other,
      currency: "NGN",
    };
  }

  function requestConfirm() {
    setFormError(null);
    const next = parsedValues();
    if (!next) {
      setFormError("Enter a number in every field, or mark that there was no service.");
      return;
    }
    if (!noService && allZero) {
      setFormError("If the branch did not meet this week, mark No service before sending.");
      return;
    }
    setConfirmOpen(true);
  }

  return (
    <View style={styles.form}>
      {locked ? (
        <InlineNotice
          message="This report is locked after your zone forwarded it and can no longer be edited."
        />
      ) : null}

      <Text style={styles.section}>Service</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Service date"
        disabled={locked || loading}
        onPress={() => setDateOpen(true)}
        style={({ pressed }) => [
          styles.dateField,
          pressed && !locked && styles.pressed,
        ]}
      >
        <Text style={styles.dateLabel}>Service date</Text>
        <Text style={styles.dateValue}>
          {values.serviceDate ? formatWeekEndingLabel(values.serviceDate) : "Choose a day"}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: noService, disabled: locked || Boolean(loading) }}
        disabled={locked || loading}
        onPress={() => {
          setNoService((current) => !current);
          setFormError(null);
        }}
        style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
      >
        <View style={[styles.checkbox, noService && styles.checkboxOn]}>
          {noService ? (
            <Ionicons name="checkmark" size={16} color={colors.textOnNavy} />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.checkTitle}>No service this week</Text>
          <Text style={styles.checkBody}>
            Sends zeros for attendance and finance if the branch did not meet.
          </Text>
        </View>
      </Pressable>

      <Text style={styles.section}>Attendance</Text>
      <CountField
        label="Adults"
        value={values.adultCount}
        disabled={disabled}
        onChange={(adultCount) => setValues((current) => ({ ...current, adultCount }))}
      />
      <CountField
        label="Teenagers"
        value={values.teenageCount}
        disabled={disabled}
        onChange={(teenageCount) => setValues((current) => ({ ...current, teenageCount }))}
      />
      <CountField
        label="Children"
        value={values.childrenCount}
        disabled={disabled}
        onChange={(childrenCount) => setValues((current) => ({ ...current, childrenCount }))}
      />

      <Text style={styles.section}>Finance</Text>
      <MoneyField
        label="Tithe"
        value={values.tithe}
        disabled={disabled}
        onChange={(tithe) => setValues((current) => ({ ...current, tithe }))}
      />
      <MoneyField
        label="Offering"
        value={values.offering}
        disabled={disabled}
        onChange={(offering) => setValues((current) => ({ ...current, offering }))}
      />
      <MoneyField
        label="Other"
        value={values.other}
        disabled={disabled}
        onChange={(other) => setValues((current) => ({ ...current, other }))}
      />

      <SurfaceCard style={styles.totals}>
        <Text style={styles.totalsTitle}>This week</Text>
        <View style={styles.totalsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.totalsLabel}>Attendance</Text>
            <Text style={styles.totalsValue}>{formatCount(attendanceTotal)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.totalsLabel}>Income</Text>
            <Text style={styles.totalsValue}>{formatMoney(financeTotal)}</Text>
          </View>
        </View>
      </SurfaceCard>

      {formError ? <InlineNotice message={formError} /> : null}
      {error ? <InlineNotice message={error} /> : null}

      {!locked ? (
        <PrimaryButton
          label={existingReport ? "Review update" : "Review report"}
          loading={loading}
          disabled={loading}
          onPress={requestConfirm}
        />
      ) : null}

      <Modal
        visible={dateOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDateOpen(false)}
      >
        <View style={styles.sheetPage}>
          <SheetHeader
            title="Service date"
            subtitle="Pick the day your branch met this week"
            onClose={() => setDateOpen(false)}
          />
          <View style={styles.dayRow}>
            {weekDays.map((day) => {
              const selected = day === values.serviceDate;
              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setValues((current) => ({ ...current, serviceDate: day }));
                    setDateOpen(false);
                  }}
                  style={[styles.dayChip, selected && styles.dayChipOn]}
                >
                  <Text style={[styles.dayName, selected && styles.dayOnText]}>
                    {weekdayShort(day)}
                  </Text>
                  <Text style={[styles.dayNum, selected && styles.dayOnText]}>
                    {dayNumber(day)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.sheetPage}>
          <SheetHeader
            title="Check this week"
            subtitle={branchName ?? "Your branch"}
            onClose={() => setConfirmOpen(false)}
          />
          <Text style={styles.confirmMeta}>
            {formatWeekEndingLabel(values.serviceDate)} · week ending {weekEnding}
          </Text>
          {noService ? (
            <Text style={styles.confirmMeta}>No service — zeros will be sent.</Text>
          ) : (
            <View style={styles.totalsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.totalsLabel}>Attendance</Text>
                <Text style={styles.totalsValue}>{formatCount(attendanceTotal)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.totalsLabel}>Income</Text>
                <Text style={styles.totalsValue}>{formatMoney(financeTotal)}</Text>
              </View>
            </View>
          )}
          <PrimaryButton
            label={existingReport ? "Confirm update" : "Send report"}
            loading={loading}
            onPress={() => {
              const next = parsedValues();
              if (!next) return;
              void onSubmit(next);
            }}
          />
          <GhostButton label="Go back" onPress={() => setConfirmOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

function CountField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field
      label={label}
      keyboardType="number-pad"
      value={value}
      placeholder=""
      onChangeText={(next) => onChange(next.replace(/[^0-9]/g, ""))}
      editable={!disabled}
    />
  );
}

function MoneyField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field
      label={`${label} (₦)`}
      keyboardType="decimal-pad"
      value={value}
      placeholder=""
      onChangeText={(next) => onChange(formatAmount(next))}
      editable={!disabled}
    />
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  section: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  dateField: {
    minHeight: 64,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dateValue: {
    ...typography.bodyStrong,
    color: colors.navy,
    marginTop: 2,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  checkTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  checkBody: {
    ...typography.footnote,
    color: colors.textMuted,
    marginTop: 2,
  },
  totals: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  totalsTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  totalsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  totalsLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  totalsValue: {
    ...typography.title3,
    color: colors.navy,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  sheetPage: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  dayRow: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: spacing.md,
  },
  dayChip: {
    flex: 1,
    minHeight: 64,
    borderRadius: radius.md,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dayChipOn: {
    backgroundColor: colors.navy,
  },
  dayName: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dayNum: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  dayOnText: {
    color: colors.textOnNavy,
  },
  confirmMeta: {
    ...typography.footnote,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
