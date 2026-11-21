import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { GhostButton, PrimaryButton } from "@/src/components/ui";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

type AppAlertOptions = {
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type AlertRequest = AppAlertOptions & {
  title: string;
  body?: string;
  resolve: (confirmed: boolean) => void;
};

let presenter: ((request: AlertRequest) => void) | null = null;

/**
 * Themed replacement for `Alert.alert`. Resolves `true` when the confirm
 * button is pressed and `false` on cancel/backdrop. With no `cancelLabel`
 * it renders a single "OK" info dialog.
 */
export function showAppAlert(
  title: string,
  body?: string,
  options?: AppAlertOptions,
): Promise<boolean> {
  if (!presenter) return Promise.resolve(false);
  return new Promise((resolve) => {
    presenter!({ ...options, title, body, resolve });
  });
}

export function AppAlertHost() {
  const [request, setRequest] = useState<AlertRequest | null>(null);

  useEffect(() => {
    presenter = setRequest;
    return () => {
      presenter = null;
    };
  }, []);

  const settle = (confirmed: boolean) => {
    request?.resolve(confirmed);
    setRequest(null);
  };

  return (
    <Modal
      visible={request !== null}
      transparent
      animationType="fade"
      onRequestClose={() => settle(false)}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{request?.title}</Text>
          {request?.body ? (
            <Text style={styles.body}>{request.body}</Text>
          ) : null}
          <View style={styles.buttons}>
            {request?.cancelLabel ? (
              <View style={styles.buttonCell}>
                <GhostButton
                  label={request.cancelLabel}
                  onPress={() => settle(false)}
                />
              </View>
            ) : null}
            <View style={styles.buttonCell}>
              <PrimaryButton
                label={request?.confirmLabel ?? "OK"}
                tone={request?.destructive ? "danger" : "gold"}
                onPress={() => settle(true)}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 10, 20, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  buttons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  buttonCell: { flex: 1 },
});
