import { atom } from 'jotai';

export interface User {
  id: number;
  userId: string;
  email?: string;
  phone?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export const authAtom = atom<AuthState>({
  isAuthenticated: false,
  user: null,
  loading: true,
});