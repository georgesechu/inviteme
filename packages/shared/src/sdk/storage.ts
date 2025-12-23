/**
 * Storage abstraction for cross-platform support
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Browser localStorage adapter
 */
export class BrowserStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      try {
        return (globalThis as any).localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  }

  setItem(key: string, value: string): void {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      try {
        (globalThis as any).localStorage.setItem(key, value);
      } catch {
        // Ignore storage errors
      }
    }
  }

  removeItem(key: string): void {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      try {
        (globalThis as any).localStorage.removeItem(key);
      } catch {
        // Ignore storage errors
      }
    }
  }
}

/**
 * React Native AsyncStorage adapter
 * This will no-op if AsyncStorage is not available at runtime.
 */
export class ReactNativeStorageAdapter implements StorageAdapter {
  private asyncStorage: any | null;

  constructor() {
    try {
      // Lazy require so web/server builds don't break
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.asyncStorage = require('@react-native-async-storage/async-storage').default;
    } catch {
      this.asyncStorage = null;
    }
  }

  getItem(key: string): string | null {
    if (!this.asyncStorage) return null;
    try {
      // AsyncStorage getItem is async; use de-sync helper when possible
      // Note: For React Native, prefer using the async methods directly in app code if needed.
      let value: string | null = null;
      this.asyncStorage.getItem(key).then((v: string | null) => {
        value = v;
      });
      return value;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (!this.asyncStorage) return;
    try {
      this.asyncStorage.setItem(key, value);
    } catch {
      // Ignore storage errors
    }
  }

  removeItem(key: string): void {
    if (!this.asyncStorage) return;
    try {
      this.asyncStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Memory-only storage adapter (for testing or server-side)
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }
}

