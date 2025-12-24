/**
 * Landing page - redirects to login if not authenticated, events if authenticated
 */
import { Redirect } from 'expo-router';
import { useAuth } from '@inviteme/shared';
import { sdk } from '../src/sdk';

export default function Index() {
  const auth = useAuth(sdk.auth);

  if (auth.isAuthenticated) {
    return <Redirect href="/events" />;
  }

  return <Redirect href="/login" />;
}
