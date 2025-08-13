import { useContext } from 'react';
import { type User } from 'firebase/auth';
import { AuthContext } from '../contexts/AuthContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context;
}
