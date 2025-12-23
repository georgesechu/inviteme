import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useGuests, useEvents } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Spinner } from '../components/ui/spinner';
import { LogOut, Plus, RefreshCw, Trash2, User, ArrowLeft } from 'lucide-react';

export function EventGuestsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const sdk = useSDK();
  const auth = useAuth(sdk.auth);
  const events = useEvents(sdk.events);
  const guests = useGuests(sdk.guests, eventId);
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('+2557');
  const [guestType, setGuestType] = useState<'Single' | 'Double'>('Single');

  const currentEvent = events.getEventById(eventId || '');

  // Load guests when event is selected
  useEffect(() => {
    if (eventId && auth.isAuthenticated) {
      guests.reloadGuests();
    }
  }, [eventId, auth.isAuthenticated]);

  const handleCreateGuest = async () => {
    if (!guestName.trim() || !guestMobile.trim() || !eventId) return;
    const success = await guests.createGuest(guestName.trim(), guestMobile.trim(), guestType);
    if (success) {
      setGuestName('');
      setGuestMobile('+2557');
      setGuestType('Single');
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (confirm('Are you sure you want to delete this guest?')) {
      await guests.deleteGuest(id);
    }
  };

  const handleLogout = () => {
    auth.logout();
    window.location.href = '/';
  };

  if (!eventId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert variant="error">Event not found</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {currentEvent?.name || 'Event Guests'}
              </h1>
              <p className="text-sm text-slate-600">Manage guests for this event</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900">{auth.user?.phoneNumber}</div>
              <div className="text-xs text-slate-500">Logged in</div>
            </div>
            <Button variant="secondary" onClick={handleLogout} size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Guest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-[2fr,2fr,1.5fr,auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="guest-name">Guest Name</Label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter guest name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateGuest();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-mobile">Phone Number</Label>
                <Input
                  id="guest-mobile"
                  value={guestMobile}
                  onChange={(e) => setGuestMobile(e.target.value)}
                  placeholder="+255712345678"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateGuest();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-type">Type</Label>
                <Select
                  id="guest-type"
                  value={guestType}
                  onChange={(e) => setGuestType(e.target.value as 'Single' | 'Double')}
                >
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                </Select>
              </div>
              <Button
                onClick={handleCreateGuest}
                disabled={guests.isCreating || !guestName.trim() || !guestMobile.trim()}
                className="h-10"
              >
                {guests.isCreating ? (
                  <Spinner />
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </>
                )}
              </Button>
            </div>
            {guests.error && (
              <Alert variant="error" className="mt-4">
                {guests.error}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Guests ({guests.guests.length})</CardTitle>
            <Button
              variant="secondary"
              onClick={guests.reloadGuests}
              disabled={guests.isLoading}
              size="sm"
            >
              {guests.isLoading ? (
                <Spinner />
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {guests.isLoading && guests.guests.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            )}

            {!guests.isLoading && guests.guests.length === 0 && (
              <Alert variant="info" className="text-center">
                <User className="mr-2 h-4 w-4" />
                No guests yet. Add your first guest above.
              </Alert>
            )}

            {guests.guests.length > 0 && (
              <div className="grid gap-3">
                {guests.guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <User className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{guest.name}</div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-slate-600">
                            <span>{guest.mobile}</span>
                            <span className="flex items-center gap-1">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  guest.type === 'Single'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {guest.type}
                              </span>
                            </span>
                            <span className="text-xs text-slate-400">Code: {guest.code}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteGuest(guest.id)}
                      disabled={guests.isDeleting}
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

