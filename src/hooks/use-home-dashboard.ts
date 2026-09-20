import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeWeekOf,
  getTodayInLagos,
  type HqDashboardResponse,
} from "@repo/types";
import { api, ApiError } from "@/src/lib/api";

export function useHomeDashboard() {
  const [weekOf] = useState(() => computeWeekOf(getTodayInLagos()));
  const [data, setData] = useState<HqDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const dataRef = useRef<HqDashboardResponse | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      if (refresh) {
        setRefreshing(true);
        setRefreshError(null);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const next = await api.getHqDashboard(weekOf, 6, controller.signal);
        if (controller.signal.aborted) return;
        dataRef.current = next;
        setData(next);
        setError(null);
        setRefreshError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Could not load the operations overview.";
        if (dataRef.current) {
          setRefreshError(message);
        } else {
          setError(message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [weekOf],
  );

  useEffect(() => {
    void load();
    return () => requestRef.current?.abort();
  }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    refreshError,
    refresh: () => load(true),
    retry: () => load(false),
  };
}
