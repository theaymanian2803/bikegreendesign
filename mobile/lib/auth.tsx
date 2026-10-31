import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

import { apiFetch, setApiAuthToken } from "./api";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  isGuest: boolean;
};

type AuthSession = {
  user: AuthUser;
  token: string;
};

type AuthValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  upgradeGuest: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const TOKEN_KEY = "pathway_session_token";

const tokenStore = {
  async get(): Promise<string | null> {
    if (Platform.OS === "web") return AsyncStorage.getItem(TOKEN_KEY);
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(value: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(TOKEN_KEY, value);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, value);
  },
  async remove(): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

const AuthContext = createContext<AuthValue>({
  user: null,
  token: null,
  loading: true,
  signInEmail: async () => {},
  registerEmail: async () => {},
  signInGuest: async () => {},
  upgradeGuest: async () => {},
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (session: AuthSession) => {
    setApiAuthToken(session.token);
    setToken(session.token);
    setUser(session.user);
    await tokenStore.set(session.token);
  }, []);

  const clearSession = useCallback(async () => {
    setApiAuthToken(null);
    setToken(null);
    setUser(null);
    await tokenStore.remove();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const stored = await tokenStore.get();
      if (!stored) {
        setApiAuthToken(null);
        setToken(null);
        setUser(null);
        return;
      }
      setApiAuthToken(stored);
      setToken(stored);
      const data = await apiFetch<{ user: AuthUser | null }>("auth/session");
      if (data.user) {
        setUser(data.user);
      } else {
        await clearSession();
      }
    } catch {
      setUser(null);
    }
  }, [clearSession]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const signInEmail = useCallback(
    async (email: string, password: string) => {
      const session = await apiFetch<AuthSession>("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await applySession(session);
    },
    [applySession],
  );

  const registerEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const session = await apiFetch<AuthSession>("auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      await applySession(session);
    },
    [applySession],
  );

  const signInGuest = useCallback(async () => {
    const session = await apiFetch<AuthSession>("auth/guest", { method: "POST" });
    await applySession(session);
  }, [applySession]);

  const upgradeGuest = useCallback(
    async (name: string, email: string, password: string) => {
      const session = await apiFetch<AuthSession>("auth/upgrade", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      await applySession(session);
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    try {
      await apiFetch("auth/logout", { method: "POST" });
    } catch {
      /* local sign-out still applies */
    }
    await clearSession();
  }, [clearSession]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      token,
      loading,
      signInEmail,
      registerEmail,
      signInGuest,
      upgradeGuest,
      signOut,
      refresh,
    }),
    [user, token, loading, signInEmail, registerEmail, signInGuest, upgradeGuest, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
