/**
 * Card Designs SDK
 */
import type { ApiClient } from '../api/client';
import type { CardDesign } from '../types';
import type { CardDesignsState } from './types';

export class CardDesignsSDK {
  private api: ApiClient;
  private state: CardDesignsState;
  private stateListeners: Set<(state: CardDesignsState) => void> = new Set();

  constructor(api: ApiClient) {
    this.api = api;
    this.state = {
      designs: [],
      isLoading: false,
      error: null,
      isCreating: false,
    };
  }

  getState(): CardDesignsState {
    return { ...this.state };
  }

  subscribe(listener: (state: CardDesignsState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notify() {
    this.stateListeners.forEach(listener => listener(this.getState()));
  }

  async loadDesigns(): Promise<void> {
    this.state = { ...this.state, isLoading: true, error: null };
    this.notify();
    try {
      const response = await this.api.getCardDesigns();
      if (response.success && response.data) {
        this.state = { ...this.state, designs: response.data, isLoading: false };
      } else {
        this.state = {
          ...this.state,
          isLoading: false,
          error: response.error || 'Failed to load card designs',
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

  async createDesign(data: { name: string; thumbnailUrl: string; templateUrl: string }): Promise<CardDesign | null> {
    this.state = { ...this.state, isCreating: true, error: null };
    this.notify();
    try {
      const response = await this.api.createCardDesign(data);
      if (response.success && response.data) {
        this.state = {
          ...this.state,
          designs: [response.data, ...this.state.designs],
          isCreating: false,
        };
        this.notify();
        return response.data;
      } else {
        this.state = {
          ...this.state,
          isCreating: false,
          error: response.error || 'Failed to create card design',
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

  async getDesign(id: string): Promise<CardDesign | null> {
    try {
      const response = await this.api.getCardDesign(id);
      if (response.success && response.data) {
        // Update local state if design exists
        const existingIndex = this.state.designs.findIndex(d => d.id === id);
        if (existingIndex >= 0) {
          this.state.designs[existingIndex] = response.data;
        } else {
          this.state.designs.push(response.data);
        }
        this.notify();
        return response.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async updateDesign(
    id: string,
    data: { name?: string; thumbnailUrl?: string; templateUrl?: string; templateConfig?: any }
  ): Promise<CardDesign | null> {
    this.state = { ...this.state, isCreating: true, error: null };
    this.notify();
    try {
      const response = await this.api.updateCardDesign(id, data);
      if (response.success && response.data) {
        const existingIndex = this.state.designs.findIndex(d => d.id === id);
        if (existingIndex >= 0) {
          this.state.designs[existingIndex] = response.data;
        } else {
          this.state.designs.push(response.data);
        }
        this.state = { ...this.state, isCreating: false };
        this.notify();
        return response.data;
      } else {
        this.state = {
          ...this.state,
          isCreating: false,
          error: response.error || 'Failed to update card design',
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

  getDesignById(id: string): CardDesign | undefined {
    return this.state.designs.find(d => d.id === id);
  }
}

