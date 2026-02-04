// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as authAPI from '../services/authAPI';
import { setAuthHeader as setAuthToken } from '../services/api';

const AuthContext = createContext();

/**
 * useAuth hook - throws if used outside provider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

/**
 * Helpers for token persistence (single place)
 */
const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refreshToken';

function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function safeSetItem(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (e) {
    /* ignore storage errors (e.g. private mode) */
  }
}
function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

/**
 * AuthProvider
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => safeGetItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Persist token + refresh in one place
  const persistTokens = useCallback((accessToken, refreshToken) => {
    if (accessToken) safeSetItem(TOKEN_KEY, accessToken);
    else safeRemoveItem(TOKEN_KEY);

    if (refreshToken) safeSetItem(REFRESH_KEY, refreshToken);
    else safeRemoveItem(REFRESH_KEY);

    // Attach header for axios instance
    setAuthToken(accessToken || null);
    setToken(accessToken || null);
  }, []);

  // logout (stable)
  const logout = useCallback(() => {
    persistTokens(null, null);
    setUser(null);
  }, [persistTokens]);

  // Verify token on mount and whenever token changes
  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      // If we already have token in state, set header and try to fetch current user
      const currentToken = token;
      if (!currentToken) {
        setLoading(false);
        return;
      }

      setAuthToken(currentToken);

      try {
        const res = await authAPI.getCurrentUser();
        if (!mounted) return;

        // backend may return various shapes; try to extract user
        const payload = res?.data?.data ?? res?.data;
        const returnedUser = payload?.user ?? payload ?? null;

        setUser(returnedUser ?? null);
      } catch (err) {
        console.error('Auth token verification failed:', err);
        // clear tokens & user on failure
        logout();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [token, logout]);

  // Keep auth in sync across browser tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key === TOKEN_KEY) {
        const newToken = safeGetItem(TOKEN_KEY);
        setToken(newToken);
        setAuthToken(newToken);
      }
      if (e.key === REFRESH_KEY && e.newValue == null) {
        // refresh token removed somewhere else - best to logout locally
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /**
   * LOGIN
   * Supports both: login(email, password) and login({ email, password })
   * Returns { success: boolean, user?, error? }
   */
  const login = useCallback(async (a, b) => {
    try {
      let credentials;
      if (typeof a === 'string') {
        credentials = { email: a, password: b };
      } else if (typeof a === 'object' && a !== null) {
        credentials = a;
      } else {
        return { success: false, error: 'Invalid login args' };
      }

      const response = await authAPI.login(credentials);

      // normalize payload shapes
      const payload = response?.data?.data ?? response?.data ?? {};
      const u = payload?.user ?? null;
      const accessToken = payload?.accessToken ?? payload?.token ?? payload?.access_token ?? null;
      const refreshToken = payload?.refreshToken ?? payload?.refresh_token ?? null;

      if (!accessToken) {
        return { success: false, error: 'No access token returned from server' };
      }

      // persist tokens & set header
      persistTokens(accessToken, refreshToken);
      setUser(u);

      return { success: true, user: u };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Login failed';
      return { success: false, error: message };
    }
  }, [persistTokens]);

  /**
   * REGISTER
   * Accepts an object with registration data.
   * Returns { success: boolean, user?, error? }
   */
  const register = useCallback(async (userData) => {
    try {
      const response = await authAPI.register(userData);

      const payload = response?.data?.data ?? response?.data ?? {};
      const u = payload?.user ?? null;
      const accessToken = payload?.accessToken ?? payload?.token ?? payload?.access_token ?? null;
      const refreshToken = payload?.refreshToken ?? payload?.refresh_token ?? null;

      if (!accessToken) {
        return { success: false, error: 'No access token returned from server' };
      }

      persistTokens(accessToken, refreshToken);
      setUser(u);

      return { success: true, user: u };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Registration failed';
      return { success: false, error: message };
    }
  }, [persistTokens]);

  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: Boolean(user),
    loading,
  }), [user, token, login, register, logout, updateUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
