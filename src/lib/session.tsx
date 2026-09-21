import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  clearSession,
  getRefreshToken,
  getStoredUser,
  isHqUser,
  saveSession,
} from "./auth";
import { api, restoreSession, type AuthResponse, type AuthUser } from "./api";
import { onSessionExpired } from "./session-events";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  isHq: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);

  const bootstrap = useCallback(async () => {
    const restored = await restoreSession();
    if (mountedRef.current) {
      setUser(restored);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled) await bootstrap();
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [bootstrap]);

  useEffect(() => {
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === "active") {
        void bootstrap();
      }
    };
    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => sub.remove();
  }, [bootstrap]);

  useEffect(() => {
    return onSessionExpired(() => {
      if (mountedRef.current) setUser(null);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await api.login(email.trim().toLowerCase(), password);
    await saveSession(session);
    if (mountedRef.current) {
      setUser(session.user);
    }
    return session;
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) await api.logout(refreshToken);
    } catch {
      // Still clear local session
    }
    await clearSession();
    if (mountedRef.current) setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.getMe();
      const next: AuthUser = {
        id: me.id,
        email: me.email,
        name: me.name,
        role: me.role,
        status: me.status,
        stateId: me.stateId,
        zoneId: me.zoneId,
        branchId: me.branchId,
        stateName: me.stateName,
        zoneName: me.zoneName,
        branchName: me.branchName,
        profilePicUrl: me.profilePicUrl,
      };
      const refreshToken = await getRefreshToken();
      const access = await import("./auth").then((m) => m.getAccessToken());
      if (access && refreshToken) {
        await saveSession({
          accessToken: access,
          refreshToken,
          user: next,
        });
      }
      if (mountedRef.current) setUser(next);
    } catch (err) {
      const stored = await getStoredUser();
      if (!stored) {
        if (mountedRef.current) setUser(null);
        return;
      }
      const { ApiError } = await import("./api");
      if (err instanceof ApiError && err.status === 401) {
        await clearSession();
        if (mountedRef.current) setUser(null);
        return;
      }
      if (mountedRef.current) setUser(stored);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isHq: isHqUser(user),
      signIn,
      signOut,
      refreshUser,
    }),
    [user, loading, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
