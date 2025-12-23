import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@inviteme/shared';
import { useSDK } from '../sdk';

interface LayoutProps {
  requireAuth?: boolean;
}

export function Layout({ requireAuth = false }: LayoutProps) {
  const sdk = useSDK();
  const auth = useAuth(sdk.auth);

  if (requireAuth && !auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

