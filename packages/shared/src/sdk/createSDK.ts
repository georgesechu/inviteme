/**
 * Create SDK instances
 */
import { createApiClient, type ApiClientConfig } from '../api/client';
import { AuthSDK } from './auth';
import { GuestsSDK } from './guests';
import { EventsSDK } from './events';
import { CardDesignsSDK } from './cardDesigns';
import { AccountSDK } from './account';
import type { StorageAdapter } from './storage';
import { BrowserStorageAdapter } from './storage';

export interface SDKConfig extends ApiClientConfig {
  storage?: StorageAdapter;
}

export interface SDK {
  auth: AuthSDK;
  guests: GuestsSDK;
  events: EventsSDK;
  cardDesigns: CardDesignsSDK;
  account: AccountSDK;
}

/**
 * Create SDK instances
 */
export function createSDK(config: SDKConfig): SDK {
  const storage = config.storage || new BrowserStorageAdapter();

  const api = createApiClient({
    ...config,
    getToken: () => {
      // Get token from storage
      return storage.getItem('authToken') || config.getToken?.() || null;
    },
  });

  const auth = new AuthSDK(api, storage);
  const guests = new GuestsSDK(api);
  const events = new EventsSDK(api);
  const cardDesigns = new CardDesignsSDK(api);
  const account = new AccountSDK(api);

  return {
    auth,
    guests,
    events,
    cardDesigns,
    account,
  };
}

