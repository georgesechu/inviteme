import type { ApiClient } from '../api/client';
import type { Event } from '../types';
import type { EventsState } from './types';

export class EventsSDK {
  private api: ApiClient;
  private state: EventsState;
  private stateListeners: Set<(state: EventsState) => void> = new Set();

  constructor(api: ApiClient) {
    this.api = api;
    this.state = {
      events: [],
      isLoading: false,
      error: null,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
    };
  }

  getState(): EventsState {
    return { ...this.state };
  }

  subscribe(listener: (state: EventsState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notify() {
    this.stateListeners.forEach(listener => listener(this.getState()));
  }

  async loadEvents(): Promise<void> {
    this.state = { ...this.state, isLoading: true, error: null };
    this.notify();
    try {
      const response = await this.api.getEvents();
      if (response.success && response.data) {
        this.state = { ...this.state, events: response.data, isLoading: false };
      } else {
        this.state = {
          ...this.state,
          isLoading: false,
          error: response.error || 'Failed to load events',
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

  async createEvent(data: { name: string; date?: string; location?: string; description?: string }): Promise<Event | null> {
    this.state = { ...this.state, isCreating: true, error: null };
    this.notify();
    try {
      const response = await this.api.createEvent(data);
      if (response.success && response.data) {
        this.state = {
          ...this.state,
          events: [response.data, ...this.state.events],
          isCreating: false,
        };
        this.notify();
        return response.data;
      } else {
        this.state = {
          ...this.state,
          isCreating: false,
          error: response.error || 'Failed to create event',
        };
        this.notify();
        return null;
      }
    } catch (error) {
      this.state = {
        ...this.state,
        isCreating: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
      this.notify();
      return null;
    }
  }

  async updateEvent(
    id: string,
    data: { 
      name?: string; 
      date?: string; 
      location?: string; 
      description?: string;
      cardDesignImageUrl?: string | null;
      cardTemplateConfig?: any;
    }
  ): Promise<Event | null> {
    this.state = { ...this.state, isUpdating: true, error: null };
    this.notify();
    try {
      const response = await this.api.updateEvent(id, data);
      if (response.success && response.data) {
        this.state = {
          ...this.state,
          events: this.state.events.map(e => (e.id === id ? response.data! : e)),
          isUpdating: false,
        };
        this.notify();
        return response.data;
      } else {
        this.state = {
          ...this.state,
          isUpdating: false,
          error: response.error || 'Failed to update event',
        };
        this.notify();
        return null;
      }
    } catch (error) {
      this.state = {
        ...this.state,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
      this.notify();
      return null;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    this.state = { ...this.state, isDeleting: true, error: null };
    this.notify();
    try {
      const response = await this.api.deleteEvent(id);
      if (response.success) {
        this.state = {
          ...this.state,
          events: this.state.events.filter(e => e.id !== id),
          isDeleting: false,
        };
        this.notify();
        return true;
      } else {
        this.state = {
          ...this.state,
          isDeleting: false,
          error: response.error || 'Failed to delete event',
        };
        this.notify();
        return false;
      }
    } catch (error) {
      this.state = {
        ...this.state,
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
      this.notify();
      return false;
    }
  }
}

