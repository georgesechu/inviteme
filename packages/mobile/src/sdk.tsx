/**
 * SDK setup for mobile app
 */
import { createSDK } from '@inviteme/shared';
import { ReactNativeStorageAdapter } from './storage';

// Use LAN IP for development (phone and PC on same network)
// Set EXPO_PUBLIC_API_URL environment variable to override
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.235:3000';

// Create SDK instance with React Native storage
export const sdk = createSDK({
  baseUrl: API_BASE_URL,
  storage: new ReactNativeStorageAdapter(),
});

