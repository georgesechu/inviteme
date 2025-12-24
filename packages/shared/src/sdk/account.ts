import type { ApiClient } from '../api/client';
import type { PurchaseBundleBody, PurchaseBundleResponse } from '../api/account';
import type { AccountState, AccountInfo } from './types';

export class AccountSDK {
  private api: ApiClient;
  private state: AccountState;
  private stateListeners: Set<(state: AccountState) => void> = new Set();

  constructor(api: ApiClient) {
    this.api = api;
    this.state = {
      account: null,
      isLoading: false,
      error: null,
      isPurchasing: false,
    };
  }

  getState(): AccountState {
    return { ...this.state };
  }

  subscribe(listener: (state: AccountState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notify(): void {
    this.stateListeners.forEach(listener => listener(this.getState()));
  }

  async loadAccount(): Promise<void> {
    this.state = { ...this.state, isLoading: true, error: null };
    this.notify();
    try {
      const response = await this.api.getAccount();
      if (response.success && response.data) {
        // Map API response to SDK AccountInfo type
        const accountInfo: AccountInfo = {
          id: response.data.id,
          phoneNumber: response.data.phoneNumber,
          messageCredits: response.data.messageCredits,
          createdAt: response.data.createdAt,
        };
        this.state = { ...this.state, account: accountInfo, isLoading: false };
      } else {
        this.state = {
          ...this.state,
          isLoading: false,
          error: response.error || 'Failed to load account',
        };
      }
    } catch (error) {
      this.state = {
        ...this.state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
    this.notify();
  }

  async purchaseBundle(data: PurchaseBundleBody): Promise<PurchaseBundleResponse | null> {
    this.state = { ...this.state, isPurchasing: true, error: null };
    this.notify();
    try {
      const response = await this.api.purchaseBundle(data);
      if (response.success && response.data) {
        // Update account balance
        if (this.state.account) {
          this.state.account.messageCredits = response.data.newBalance;
        }
        this.state = { ...this.state, isPurchasing: false };
        this.notify();
        return response.data;
      } else {
        this.state = {
          ...this.state,
          isPurchasing: false,
          error: response.error || 'Failed to purchase bundle',
        };
        this.notify();
        return null;
      }
    } catch (error) {
      this.state = {
        ...this.state,
        isPurchasing: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
      this.notify();
      return null;
    }
  }

  getMessageCredits(): number {
    return this.state.account?.messageCredits || 0;
  }
}

