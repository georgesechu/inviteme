/**
 * React hook for guests management
 * Note: This requires React to be available
 */
import { useState, useEffect, useCallback } from 'react';
import type { GuestsSDK } from '../sdk/guests';
import type { Guest, GuestType } from '../types';
import type { GuestsState } from '../sdk/types';

export function useGuests(guestsSDK: GuestsSDK) {
  const [state, setState] = useState<GuestsState>(guestsSDK.getState());

  useEffect(() => {
    const unsubscribe = guestsSDK.subscribe(setState);
    return unsubscribe;
  }, [guestsSDK]);

  // Load guests on mount
  useEffect(() => {
    guestsSDK.loadGuests();
  }, [guestsSDK]);

  const createGuest = useCallback(
    async (name: string, mobile: string, type: GuestType): Promise<Guest | null> => {
      return await guestsSDK.createGuest(name, mobile, type);
    },
    [guestsSDK]
  );

  const updateGuest = useCallback(
    async (
      id: string,
      updates: { name?: string; mobile?: string; type?: GuestType }
    ): Promise<Guest | null> => {
      return await guestsSDK.updateGuest(id, updates);
    },
    [guestsSDK]
  );

  const deleteGuest = useCallback(
    async (id: string): Promise<boolean> => {
      return await guestsSDK.deleteGuest(id);
    },
    [guestsSDK]
  );

  const reloadGuests = useCallback(() => {
    guestsSDK.loadGuests();
  }, [guestsSDK]);

  const getGuestById = useCallback(
    (id: string): Guest | undefined => {
      return guestsSDK.getGuestById(id);
    },
    [guestsSDK]
  );

  return {
    // State
    guests: state.guests,
    isLoading: state.isLoading,
    error: state.error,
    isCreating: state.isCreating,
    isUpdating: state.isUpdating,
    isDeleting: state.isDeleting,

    // Actions
    createGuest,
    updateGuest,
    deleteGuest,
    reloadGuests,
    getGuestById,
  };
}

