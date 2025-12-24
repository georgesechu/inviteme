import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Header } from './Header';

interface LayoutProps {
  requireAuth?: boolean;
}

export function Layout({ requireAuth = false }: LayoutProps) {
  const sdk = useSDK();
  const auth = useAuth(sdk.auth);

  if (requireAuth && !auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {auth.isAuthenticated && <Header />}
      <Outlet />
    </div>
  );
}

