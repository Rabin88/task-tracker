import { useContext } from 'react';
import { AuthContext } from './authContext';

// Current user and login/register/logout. Must be used inside <AuthProvider>.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
