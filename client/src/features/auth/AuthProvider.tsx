import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '../../api/client';
import { ApiError } from '../../api/errors';
import { tokenStorage } from '../../lib/tokenStorage';
import * as authApi from './api';
import { AuthContext, type AuthContextValue } from './authContext';
import type { AuthResult, User } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => tokenStorage.get() !== null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  const endSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // The user clicked "Log out".
  const logout = useCallback(() => {
    endSession();
    setJustLoggedOut(true);
  }, [endSession]);

  const clearLoggedOutMessage = useCallback(() => setJustLoggedOut(false), []);

  // Any API call that gets a 401 (expired token) ends the session.
  useEffect(() => {
    setUnauthorizedHandler(endSession);
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  // A saved token is only trusted after the API accepts it. Only a 401 means the
  // token is bad (request() then calls logout). Any other failure, like the server
  // being unreachable or waking up, keeps the token so the user can retry.
  const verifySavedToken = useCallback(() => {
    authApi
      .getMe()
      .then(setUser)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) return;
        setSessionError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tokenStorage.get()) verifySavedToken();
  }, [verifySavedToken]);

  const retrySession = useCallback(() => {
    setSessionError(null);
    setLoading(true);
    verifySavedToken();
  }, [verifySavedToken]);

  const value = useMemo<AuthContextValue>(() => {
    const signIn = ({ user, token }: AuthResult) => {
      tokenStorage.set(token);
      setUser(user);
      setJustLoggedOut(false);
    };
    return {
      user,
      loading,
      sessionError,
      retrySession,
      logout,
      justLoggedOut,
      clearLoggedOutMessage,
      login: async (email, password) => signIn(await authApi.login(email, password)),
      register: async (email, password) => signIn(await authApi.register(email, password)),
    };
  }, [user, loading, sessionError, retrySession, logout, justLoggedOut, clearLoggedOutMessage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
