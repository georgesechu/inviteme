import React, { createContext, useContext, useMemo } from 'react';
import { createSDK, type SDK } from '@inviteme/shared';

interface SDKProviderProps {
  baseUrl: string;
  children: React.ReactNode;
}

const SDKContext = createContext<SDK | null>(null);

export function SDKProvider({ baseUrl, children }: SDKProviderProps) {
  const sdk = useMemo(() => createSDK({ baseUrl }), [baseUrl]);
  return <SDKContext.Provider value={sdk}>{children}</SDKContext.Provider>;
}

export function useSDK(): SDK {
  const sdk = useContext(SDKContext);
  if (!sdk) {
    throw new Error('useSDK must be used within an SDKProvider');
  }
  return sdk;
}

