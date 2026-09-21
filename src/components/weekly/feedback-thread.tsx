import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { canReplyToFeedback, type FeedbackRecord } from "@repo/types";
import { api, ApiError } from "@/src/lib/api";
import { Field, GhostButton, PrimaryButton } from "@/src/components/ui";
import { InlineNotice } from "@/src/components/premium/states";
import { colors, spacing, typography } from "@/src/theme/tokens";

export function FeedbackThread({
  reportId,
  currentUserId,
  canCompose,
  onComposerFocus,
}: {
  reportId: string;
  currentUserId?: string;
  canCompose: boolean;
  onComposerFocus?: () => void;
}) {
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<FeedbackRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listReportFeedback(reportId);
      setItems(response.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load feedback.");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!replyTo) return;
    const timer = setTimeout(() => onComposerFocus?.(), 120);
    return () => clearTimeout(timer);
  }, [replyTo, onComposerFocus]);

  function startReply(item: FeedbackRecord) {
    setReplyTo(item);
    setMessage("");
    setError(null);
  }

  function handleComposerFocus() {
    onComposerFocus?.();
    setTimeout(() => onComposerFocus?.(), 250);
  }

  function cancelReply() {
    setReplyTo(null);
    setMessage("");
  }

  async function send() {
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createReportFeedback(
        reportId,
        message.trim(),
        replyTo?.id,
      );
      setItems((current) => [...current, created]);
      setMessage("");
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  const showComposer = canCompose || replyTo !== null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Feedback</Text>
      {loading ? <Text style={styles.meta}>Loading feedback…</Text> : null}
      {error ? <InlineNotice message={error} /> : null}
      {items.length === 0 && !loading ? (
        <Text style={styles.meta}>No feedback on this report yet.</Text>
      ) : (
        items.map((item) => {
          const canReply =
            currentUserId != null && canReplyToFeedback(currentUserId, item);

          return (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.from}>{item.fromUser.name}</Text>
                {canReply ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => startReply(item)}
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.replyAction}>Reply</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.body}>{item.message}</Text>
              <Text style={styles.meta}>
                To {item.toUser.name} · {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          );
        })
      )}
      {showComposer ? (
        <View style={styles.composer}>
          {replyTo ? (
            <View style={styles.replyBanner}>
              <Text style={styles.replyLabel}>
                Replying to {replyTo.fromUser.name}
              </Text>
              <GhostButton label="Cancel" onPress={cancelReply} />
            </View>
          ) : null}
          <Field
            label={replyTo ? "Your reply" : "Message"}
            value={message}
            onChangeText={setMessage}
            onFocus={handleComposerFocus}
            placeholder={
              replyTo
                ? "Write your reply"
                : "Leave a note for the submitting pastor"
            }
            multiline
            style={styles.input}
          />
          <PrimaryButton
            label={replyTo ? "Send reply" : "Send feedback"}
            loading={submitting}
            disabled={!message.trim()}
            onPress={() => void send()}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.title3,
    color: colors.navy,
  },
  item: {
    backgroundColor: colors.bgSubtle,
    borderRadius: 12,
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  from: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
  },
  replyAction: {
    ...typography.caption,
    color: colors.gold,
    fontWeight: "700",
  },
  body: {
    ...typography.callout,
    color: colors.textPrimary,
    marginTop: 4,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  composer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  replyLabel: {
    ...typography.footnote,
    color: colors.textMuted,
    flex: 1,
  },
  input: {
    minHeight: 88,
    textAlignVertical: "top",
  },
});
