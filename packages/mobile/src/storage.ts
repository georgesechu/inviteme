/**
 * React Native storage adapter for the SDK
 * Uses a cache to make AsyncStorage work with the synchronous StorageAdapter interface
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from '@inviteme/shared';

/**
 * React Native AsyncStorage adapter with synchronous interface
 * Uses an in-memory cache to provide synchronous access while async operations happen in background
 */
export class ReactNativeStorageAdapter implements StorageAdapter {
  private cache: Map<string, string | null> = new Map();
  private initialized: boolean = false;

  constructor() {
    // Initialize cache on startup
    this.initializeCache();
  }

  private async initializeCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      items.forEach(([key, value]) => {
        this.cache.set(key, value);
      });
      this.initialized = true;
    } catch {
      this.initialized = true; // Mark as initialized even on error
    }
  }

  getItem(key: string): string | null {
    // Return from cache immediately (synchronous)
    return this.cache.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    // Update cache immediately (synchronous)
    this.cache.set(key, value);
    // Persist to AsyncStorage asynchronously
    AsyncStorage.setItem(key, value).catch(() => {
      // Ignore errors
    });
  }

  removeItem(key: string): void {
    // Remove from cache immediately (synchronous)
    this.cache.delete(key);
    // Remove from AsyncStorage asynchronously
    AsyncStorage.removeItem(key).catch(() => {
      // Ignore errors
    });
  }
}

