/**
 * Create SDK instances
 */
import { createApiClient, type ApiClientConfig } from '../api/client';
import { AuthSDK } from './auth';
import { GuestsSDK } from './guests';
import type { StorageAdapter } from './storage';
import { BrowserStorageAdapter } from './storage';

export interface SDKConfig extends ApiClientConfig {
  storage?: StorageAdapter;
}

export interface SDK {
  auth: AuthSDK;
  guests: GuestsSDK;
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

  return {
    auth,
    guests,
  };
}

