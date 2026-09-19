import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  getRefreshToken,
  getStoredUser,
  isHqUser,
  saveSession,
} from "./auth";
import { api, type AuthResponse, type AuthUser } from "./api";

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getStoredUser();
        if (!cancelled) setUser(stored);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await api.login(email.trim().toLowerCase(), password);
    await saveSession(session);
    setUser(session.user);
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
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
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
    setUser(next);
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
