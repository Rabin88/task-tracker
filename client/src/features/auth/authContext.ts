import { createContext } from 'react';
import type { User } from './types';

// The shared auth state. AuthProvider fills it in; components read it with useAuth().
export type AuthContextValue = {
  user: User | null;
  loading: boolean; // true while a saved token is being checked on page load
  sessionError: string | null; // the check failed for a reason other than a bad token, e.g. server down
  retrySession: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  justLoggedOut: boolean; // true after clicking "Log out", so the login page can say so
  clearLoggedOutMessage: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
