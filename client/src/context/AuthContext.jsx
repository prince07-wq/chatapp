import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loginRequest,
  logoutRequest,
  registerRequest,
} from "../api/authApi.js";

import {
  refreshAccessToken,
  setAuthFailureHandler,
} from "../api/apiClient.js";

import {
  clearSession,
  getRefreshToken,
  getStoredUser,
  saveSession,
} from "../utils/tokenStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuthentication = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    const removeFailureHandler =
      setAuthFailureHandler(clearAuthentication);

    async function restoreAuthentication() {
      const storedUser = getStoredUser();
      const refreshToken = getRefreshToken();

      if (!storedUser || !refreshToken) {
        clearSession();

        if (active) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      try {
        await refreshAccessToken();

        if (active) {
          setUser(storedUser);
        }
      } catch {
        clearSession();

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreAuthentication();

    return () => {
      active = false;
      removeFailureHandler();
    };
  }, [clearAuthentication]);

  const login = useCallback(async ({ email, password }) => {
    const response = await loginRequest({ email, password });

    saveSession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    });

    setUser(response.user);

    return response.user;
  }, []);

  const register = useCallback(
    async ({ username, email, password }) => {
      const response = await registerRequest({
        username,
        email,
        password,
      });

      saveSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      });

      setUser(response.user);

      return response.user;
    },
    []
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } catch {
      // Local logout must still happen.
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// AuthProvider and its hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
