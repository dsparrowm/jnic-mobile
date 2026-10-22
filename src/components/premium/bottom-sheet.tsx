import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/src/theme/tokens";

/**
 * A real bottom sheet on every platform: dimmed backdrop that taps to dismiss,
 * content anchored to the bottom with a rounded top edge. `pageSheet` modals
 * render fullscreen on Android, which read as a page with dead space — this
 * keeps the sheet affordance consistent.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  scrollable = false,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Wrap the body in a ScrollView for form-style sheets. */
  scrollable?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          {scrollable ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    maxHeight: "88%",
    overflow: "hidden",
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  body: {
    paddingBottom: spacing.sm,
  },
});
