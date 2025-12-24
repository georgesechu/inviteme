import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useAccount } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Button } from './ui/button';
import { LogOut, User, MessageSquare } from 'lucide-react';
import { useEffect } from 'react';

export function Header() {
  const sdk = useSDK();
  const auth = useAuth(sdk.auth);
  const account = useAccount(sdk.account);
  const navigate = useNavigate();

  // Load account info when authenticated
  useEffect(() => {
    if (auth.isAuthenticated && !account.account) {
      account.loadAccount();
    }
  }, [auth.isAuthenticated, account]);

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/events" className="text-xl font-bold text-slate-900">
            InviteMe
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/events"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Events
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Message Credits Display */}
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">
              {account.isLoading ? '...' : account.getMessageCredits()}
            </span>
            <span className="text-xs text-blue-600">messages</span>
          </div>

          {/* Account Link */}
          <Link to="/account">
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" />
              Account
            </Button>
          </Link>

          {/* Logout */}
          <Button variant="secondary" onClick={handleLogout} size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

