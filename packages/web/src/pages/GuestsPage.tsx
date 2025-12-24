import { useState, useEffect } from 'react';
import { useAuth, useGuests, useEvents } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Spinner } from '../components/ui/spinner';
import { LogOut, Plus, RefreshCw, Trash2, User } from 'lucide-react';

export function GuestsPage() {
  const sdk = useSDK();
  const auth = useAuth(sdk.auth);
  const events = useEvents(sdk.events);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const guests = useGuests(sdk.guests, selectedEventId);
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('+2557');
  const [guestType, setGuestType] = useState<'Single' | 'Double'>('Single');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  // When events load, pick the first one if none selected
  useEffect(() => {
    if (events.events.length > 0 && !selectedEventId) {
      setSelectedEventId(events.events[0].id);
    }
  }, [events.events, selectedEventId]);

  const handleCreateGuest = async () => {
    if (!guestName.trim() || !guestMobile.trim() || !selectedEventId) return;
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

  const handleCreateEvent = async () => {
    if (!eventName.trim()) return;
    const created = await events.createEvent({
      name: eventName.trim(),
      date: eventDate || undefined,
      location: eventLocation || undefined,
      description: eventDescription || undefined,
    });
    if (created) {
      setSelectedEventId(created.id);
      setEventName('');
      setEventDate('');
      setEventLocation('');
      setEventDescription('');
    }
  };

  const handleLogout = () => {
    auth.logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">InviteMe</h1>
            <p className="text-sm text-slate-600">Event Invitation Management</p>
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
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-900">Guest Management</h2>
          <p className="mt-1 text-slate-600">Add and manage your event guests</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1.5fr,auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="event-select">Select Event</Label>
                <Select
                  id="event-select"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  disabled={events.isLoading || events.events.length === 0}
                >
                  {events.events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </Select>
                {events.error && <Alert variant="error">{events.error}</Alert>}
              </div>
              <Button
                variant="secondary"
                onClick={events.reloadEvents}
                disabled={events.isLoading}
                size="sm"
                className="h-10"
              >
                {events.isLoading ? (
                  <Spinner />
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.5fr,1fr,1fr,auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="event-name">Create Event</Label>
                <Input
                  id="event-name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Event name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Date (optional)</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-location">Location (optional)</Label>
                <Input
                  id="event-location"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Dar es Salaam"
                />
              </div>
              <Button
                onClick={handleCreateEvent}
                disabled={events.isCreating || !eventName.trim()}
                className="h-10"
              >
                {events.isCreating ? (
                  <Spinner />
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Description (optional)</Label>
              <Input
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Notes about this event"
              />
            </div>
          </CardContent>
        </Card>

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
                disabled={
                  guests.isCreating || !guestName.trim() || !guestMobile.trim() || !selectedEventId
                }
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
                                    ? 'bg-green-100 text-green-800'
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

