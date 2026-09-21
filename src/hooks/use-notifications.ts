import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationListResponse } from "@repo/types";
import { api, ApiError } from "@/src/lib/api";

export function useNotifications(enabled = true) {
  const [data, setData] = useState<NotificationListResponse | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!enabled) return;
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const next = await api.listNotifications(controller.signal);
        if (controller.signal.aborted) return;
        setData(next);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof ApiError ? err.message : "Could not load notifications.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [enabled],
  );

  useEffect(() => {
    void load();
    return () => requestRef.current?.abort();
  }, [load]);

  const markRead = useCallback(async (notificationId: string) => {
    const existing = data?.items.find((item) => item.id === notificationId);
    if (!existing || existing.readAt) {
      return existing?.readAt ?? null;
    }

    const result = await api.markNotificationRead(notificationId);
    setData((current) => {
      if (!current) return current;
      const items = current.items.map((item) =>
        item.id === notificationId
          ? { ...item, readAt: result.readAt }
          : item,
      );
      return {
        items,
        unreadCount: Math.max(0, current.unreadCount - 1),
      };
    });
    return result.readAt;
  }, [data?.items]);

  return {
    items: data?.items ?? [],
    unreadCount: data?.unreadCount ?? 0,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
    retry: () => load(false),
    markRead,
  };
}
