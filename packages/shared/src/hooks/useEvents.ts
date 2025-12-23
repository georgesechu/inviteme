/**
 * React hook for events management
 */
import { useCallback, useEffect, useState } from 'react';
import type { EventsSDK } from '../sdk/events';
import type { EventsState } from '../sdk/types';
import type { Event } from '../types';

export function useEvents(eventsSDK: EventsSDK) {
  const [state, setState] = useState<EventsState>(eventsSDK.getState());

  useEffect(() => {
    const unsubscribe = eventsSDK.subscribe(setState);
    return unsubscribe;
  }, [eventsSDK]);

  // Only load events when authenticated - this will be handled by the component
  // useEffect(() => {
  //   eventsSDK.loadEvents();
  // }, [eventsSDK]);

  const createEvent = useCallback(
    async (data: { name: string; date?: string; location?: string; description?: string }): Promise<Event | null> => {
      return await eventsSDK.createEvent(data);
    },
    [eventsSDK]
  );

  const updateEvent = useCallback(
    async (
      id: string,
      data: { 
        name?: string; 
        date?: string; 
        location?: string; 
        description?: string;
        cardDesignImageUrl?: string | null;
        cardTemplateConfig?: any;
      }
    ): Promise<Event | null> => {
      return await eventsSDK.updateEvent(id, data);
    },
    [eventsSDK]
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<boolean> => {
      return await eventsSDK.deleteEvent(id);
    },
    [eventsSDK]
  );

  const reloadEvents = useCallback(() => {
    eventsSDK.loadEvents();
  }, [eventsSDK]);

  const getEventById = useCallback(
    (id: string): Event | undefined => {
      return state.events.find(e => e.id === id);
    },
    [state.events]
  );

  return {
    events: state.events,
    isLoading: state.isLoading,
    error: state.error,
    isCreating: state.isCreating,
    isUpdating: state.isUpdating,
    isDeleting: state.isDeleting,
    createEvent,
    updateEvent,
    deleteEvent,
    reloadEvents,
    getEventById,
  };
}

