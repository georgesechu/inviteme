/**
 * SDK state types
 */
import type { User, Guest } from '../types';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface GuestsState {
  guests: Guest[];
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface RequestCodeState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface VerifyCodeState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

