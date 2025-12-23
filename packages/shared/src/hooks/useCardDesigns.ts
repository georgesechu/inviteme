/**
 * React hook for card designs management
 */
import { useCallback, useEffect, useState } from 'react';
import type { CardDesignsSDK } from '../sdk/cardDesigns';
import type { CardDesignsState } from '../sdk/types';
import type { CardDesign } from '../types';

export function useCardDesigns(cardDesignsSDK: CardDesignsSDK) {
  const [state, setState] = useState<CardDesignsState>(cardDesignsSDK.getState());

  useEffect(() => {
    const unsubscribe = cardDesignsSDK.subscribe(setState);
    return unsubscribe;
  }, [cardDesignsSDK]);

  // Only load designs when explicitly called (not auto-load)
  // useEffect(() => {
  //   cardDesignsSDK.loadDesigns();
  // }, [cardDesignsSDK]);

  const createDesign = useCallback(
    async (data: { name: string; thumbnailUrl: string; templateUrl: string }): Promise<CardDesign | null> => {
      return await cardDesignsSDK.createDesign(data);
    },
    [cardDesignsSDK]
  );

  const reloadDesigns = useCallback(() => {
    cardDesignsSDK.loadDesigns();
  }, [cardDesignsSDK]);

  const getDesign = useCallback(
    async (id: string): Promise<CardDesign | null> => {
      return await cardDesignsSDK.getDesign(id);
    },
    [cardDesignsSDK]
  );

  const updateDesign = useCallback(
    async (id: string, data: {
      name?: string;
      thumbnailUrl?: string;
      templateUrl?: string;
      templateConfig?: any;
    }): Promise<CardDesign | null> => {
      return await cardDesignsSDK.updateDesign(id, data);
    },
    [cardDesignsSDK]
  );

  const getDesignById = useCallback(
    (id: string): CardDesign | undefined => {
      return cardDesignsSDK.getDesignById(id);
    },
    [cardDesignsSDK]
  );

  return {
    designs: state.designs,
    isLoading: state.isLoading,
    error: state.error,
    isCreating: state.isCreating,
    createDesign,
    reloadDesigns,
    getDesign,
    updateDesign,
    getDesignById,
  };
}

