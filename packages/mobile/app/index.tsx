/**
 * Landing page - redirects to login if not authenticated, events if authenticated
 */
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@inviteme/shared';
import { sdk, storage } from '../src/sdk';

export default function Index() {
  const auth = useAuth(sdk.auth);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Wait for storage to initialize, then restore auth
    storage.waitForInit().then(() => {
      // Restore auth after storage is ready
      // The AuthSDK constructor already calls restoreAuth, but it might have been too early
      // So we call it again after storage is definitely ready
      // Using type assertion to access protected method
      (sdk.auth as any).restoreAuth();
      setIsInitializing(false);
    });
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (auth.isAuthenticated) {
    return <Redirect href="/events" />;
  }

  return <Redirect href="/login" />;
}
