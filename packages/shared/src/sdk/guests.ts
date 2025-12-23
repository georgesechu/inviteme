/**
 * Guests SDK
 */
import type { ApiClient } from '../api/client';
import type { Guest, GuestType } from '../types';
import type { GuestsState } from './types';

export class GuestsSDK {
  private api: ApiClient;
  private state: GuestsState;
  private stateListeners: Set<(state: GuestsState) => void> = new Set();

  constructor(api: ApiClient) {
    this.api = api;
    this.state = {
      guests: [],
      isLoading: false,
      error: null,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
    };
  }

  /**
   * Get current guests state
   */
  getState(): GuestsState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: GuestsState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notifyListeners() {
    this.stateListeners.forEach(listener => listener(this.getState()));
  }

  /**
   * Load all guests
   */
  async loadGuests(): Promise<void> {
    this.state = {
      ...this.state,
      isLoading: true,
      error: null,
    };
    this.notifyListeners();

    try {
      const response = await this.api.getGuests();

      if (response.success && response.data) {
        this.state = {
          ...this.state,
          guests: response.data,
          isLoading: false,
          error: null,
        };
      } else {
        this.state = {
          ...this.state,
          isLoading: false,
          error: response.error || 'Failed to load guests',
        };
      }
    } catch (error) {
      this.state = {
        ...this.state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }

    this.notifyListeners();
  }

  /**
   * Create a new guest
   */
  async createGuest(name: string, mobile: string, type: GuestType): Promise<Guest | null> {
    this.state = {
      ...this.state,
      isCreating: true,
      error: null,
    };
    this.notifyListeners();

    try {
      const response = await this.api.createGuest({ name, mobile, type });

      if (response.success && response.data) {
        const newGuest = response.data;
        this.state = {
          ...this.state,
          guests: [...this.state.guests, newGuest],
          isCreating: false,
          error: null,
        };
        this.notifyListeners();
        return newGuest;
      } else {
        this.state = {
          ...this.state,
          isCreating: false,
          error: response.error || 'Failed to create guest',
        };
        this.notifyListeners();
        return null;
      }
    } catch (error) {
      this.state = {
        ...this.state,
        isCreating: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
      this.notifyListeners();
      return null;
    }
  }

  /**
   * Update a guest
   */
  async updateGuest(
    id: string,
    updates: { name?: string; mobile?: string; type?: GuestType }
  ): Promise<Guest | null> {
    this.state = {
      ...this.state,
      isUpdating: true,
      error: null,
    };
    this.notifyListeners();

    try {
      const response = await this.api.updateGuest(id, updates);

      if (response.success && response.data) {
        const updatedGuest = response.data;
        this.state = {
          ...this.state,
          guests: this.state.guests.map(g => (g.id === id ? updatedGuest : g)),
          isUpdating: false,
          error: null,
        };
        this.notifyListeners();
        return updatedGuest;
      } else {
        this.state = {
          ...this.state,
          isUpdating: false,
          error: response.error || 'Failed to update guest',
        };
        this.notifyListeners();
        return null;
      }
    } catch (error) {
      this.state = {
        ...this.state,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
      this.notifyListeners();
      return null;
    }
  }

  /**
   * Delete a guest
   */
  async deleteGuest(id: string): Promise<boolean> {
    this.state = {
      ...this.state,
      isDeleting: true,
      error: null,
    };
    this.notifyListeners();

    try {
      const response = await this.api.deleteGuest(id);

      if (response.success) {
        this.state = {
          ...this.state,
          guests: this.state.guests.filter(g => g.id !== id),
          isDeleting: false,
          error: null,
        };
        this.notifyListeners();
        return true;
      } else {
        this.state = {
          ...this.state,
          isDeleting: false,
          error: response.error || 'Failed to delete guest',
        };
        this.notifyListeners();
        return false;
      }
    } catch (error) {
      this.state = {
        ...this.state,
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Get guest by ID
   */
  getGuestById(id: string): Guest | undefined {
    return this.state.guests.find(g => g.id === id);
  }
}

