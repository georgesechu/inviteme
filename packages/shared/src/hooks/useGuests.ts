/**
 * React hook for guests management
 * Note: This requires React to be available
 */
import { useState, useEffect, useCallback } from 'react';
import type { GuestsSDK } from '../sdk/guests';
import type { Guest, GuestType } from '../types';
import type { GuestsState } from '../sdk/types';

export function useGuests(guestsSDK: GuestsSDK, eventId?: string) {
  const [state, setState] = useState<GuestsState>(guestsSDK.getState());

  useEffect(() => {
    const unsubscribe = guestsSDK.subscribe(setState);
    return unsubscribe;
  }, [guestsSDK]);

  // Load guests when event changes
  useEffect(() => {
    if (eventId) {
      guestsSDK.setEvent(eventId);
      guestsSDK.loadGuests(eventId);
    }
  }, [guestsSDK, eventId]);

  const createGuest = useCallback(
    async (name: string, mobile: string, type: GuestType): Promise<Guest | null> => {
      return await guestsSDK.createGuest(name, mobile, type, eventId);
    },
    [guestsSDK, eventId]
  );

  const updateGuest = useCallback(
    async (
      id: string,
      updates: { name?: string; mobile?: string; type?: GuestType }
    ): Promise<Guest | null> => {
      return await guestsSDK.updateGuest(id, updates, eventId);
    },
    [guestsSDK, eventId]
  );

  const deleteGuest = useCallback(
    async (id: string): Promise<boolean> => {
      return await guestsSDK.deleteGuest(id, eventId);
    },
    [guestsSDK, eventId]
  );

  const reloadGuests = useCallback(() => {
    if (eventId) {
      guestsSDK.loadGuests(eventId);
    }
  }, [guestsSDK, eventId]);

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

