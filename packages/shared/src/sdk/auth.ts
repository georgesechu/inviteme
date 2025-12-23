/**
 * Authentication SDK
 */
import type { ApiClient } from '../api/client';
import type { User } from '../types';
import type { AuthState, RequestCodeState, VerifyCodeState } from './types';
import type { StorageAdapter } from './storage';
import { BrowserStorageAdapter } from './storage';

export class AuthSDK {
  private api: ApiClient;
  private storage: StorageAdapter;
  private state: AuthState;
  private requestCodeState: RequestCodeState;
  private verifyCodeState: VerifyCodeState;
  private stateListeners: Set<(state: AuthState) => void> = new Set();
  private requestCodeListeners: Set<(state: RequestCodeState) => void> = new Set();
  private verifyCodeListeners: Set<(state: VerifyCodeState) => void> = new Set();

  constructor(api: ApiClient, storage?: StorageAdapter) {
    this.storage = storage || new BrowserStorageAdapter();
    this.api = api;
    this.state = {
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    };
    this.requestCodeState = {
      isLoading: false,
      error: null,
      success: false,
    };
    this.verifyCodeState = {
      isLoading: false,
      error: null,
      success: false,
    };

    // Try to restore auth state from storage
    this.restoreAuth();
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Get current request code state
   */
  getRequestCodeState(): RequestCodeState {
    return { ...this.requestCodeState };
  }

  /**
   * Get current verify code state
   */
  getVerifyCodeState(): VerifyCodeState {
    return { ...this.verifyCodeState };
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Subscribe to request code state changes
   */
  subscribeRequestCode(listener: (state: RequestCodeState) => void): () => void {
    this.requestCodeListeners.add(listener);
    return () => this.requestCodeListeners.delete(listener);
  }

  /**
   * Subscribe to verify code state changes
   */
  subscribeVerifyCode(listener: (state: VerifyCodeState) => void): () => void {
    this.verifyCodeListeners.add(listener);
    return () => this.verifyCodeListeners.delete(listener);
  }

  private notifyStateListeners() {
    this.stateListeners.forEach(listener => listener(this.getState()));
  }

  private notifyRequestCodeListeners() {
    this.requestCodeListeners.forEach(listener => listener(this.getRequestCodeState()));
  }

  private notifyVerifyCodeListeners() {
    this.verifyCodeListeners.forEach(listener => listener(this.getVerifyCodeState()));
  }

  /**
   * Request login code via WhatsApp
   */
  async requestCode(phoneNumber: string): Promise<void> {
    this.requestCodeState = {
      isLoading: true,
      error: null,
      success: false,
    };
    this.notifyRequestCodeListeners();

    try {
      const response = await this.api.requestCode({ phoneNumber });

      if (response.success) {
        this.requestCodeState = {
          isLoading: false,
          error: null,
          success: true,
        };
      } else {
        this.requestCodeState = {
          isLoading: false,
          error: response.error || 'Failed to send code',
          success: false,
        };
      }
    } catch (error) {
      this.requestCodeState = {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Network error',
        success: false,
      };
    }

    this.notifyRequestCodeListeners();
  }

  /**
   * Verify login code
   */
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    this.verifyCodeState = {
      isLoading: true,
      error: null,
      success: false,
    };
    this.notifyVerifyCodeListeners();

    this.state = {
      ...this.state,
      isLoading: true,
      error: null,
    };
    this.notifyStateListeners();

    try {
      const response = await this.api.verifyCode({ phoneNumber, code });

      if (response.success && response.data) {
        const { user, token } = response.data;

        this.state = {
          user,
          token,
          isLoading: false,
          error: null,
          isAuthenticated: true,
        };

        this.verifyCodeState = {
          isLoading: false,
          error: null,
          success: true,
        };

        // Store token for persistence
        this.saveAuth(user, token);

        this.notifyStateListeners();
        this.notifyVerifyCodeListeners();
        return true;
      } else {
        const error = response.error || 'Invalid code';
        this.state = {
          ...this.state,
          isLoading: false,
          error,
        };
        this.verifyCodeState = {
          isLoading: false,
          error,
          success: false,
        };

        this.notifyStateListeners();
        this.notifyVerifyCodeListeners();
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      this.state = {
        ...this.state,
        isLoading: false,
        error: errorMessage,
      };
      this.verifyCodeState = {
        isLoading: false,
        error: errorMessage,
        success: false,
      };

      this.notifyStateListeners();
      this.notifyVerifyCodeListeners();
      return false;
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.state = {
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    };
    this.clearAuth();
    this.notifyStateListeners();
  }

  /**
   * Save auth to storage
   */
  protected saveAuth(user: User, token: string): void {
    this.storage.setItem('authToken', token);
    this.storage.setItem('authUser', JSON.stringify(user));
  }

  /**
   * Restore auth from storage
   */
  protected restoreAuth(): void {
    const token = this.storage.getItem('authToken');
    const userStr = this.storage.getItem('authUser');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.state = {
          user,
          token,
          isLoading: false,
          error: null,
          isAuthenticated: true,
        };
        this.notifyStateListeners();
      } catch {
        this.clearAuth();
      }
    }
  }

  /**
   * Clear auth from storage
   */
  protected clearAuth(): void {
    this.storage.removeItem('authToken');
    this.storage.removeItem('authUser');
  }
}

