import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useEvents } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Spinner } from '../components/ui/spinner';
import { Plus, Calendar, MapPin, FileText, Trash2 } from 'lucide-react';

export function EventsPage() {
  const navigate = useNavigate();
  const sdk = useSDK();
  const auth = useAuth(sdk.auth);
  const events = useEvents(sdk.events);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  // Load events when authenticated
  useEffect(() => {
    if (auth.isAuthenticated && auth.token) {
      events.reloadEvents();
    }
  }, [auth.isAuthenticated, auth.token]);

  const handleCreateEvent = async () => {
    if (!eventName.trim()) return;
    const created = await events.createEvent({
      name: eventName.trim(),
      date: eventDate || undefined,
      location: eventLocation || undefined,
      description: eventDescription || undefined,
    });
    if (created) {
      setShowCreateForm(false);
      setEventName('');
      setEventDate('');
      setEventLocation('');
      setEventDescription('');
      navigate(`/events/${created.id}`);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this event? All guests will also be deleted.')) {
      await events.deleteEvent(id);
    }
  };


  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-900">My Events</h2>
          <p className="mt-1 text-slate-600">Select an event to manage guests or create a new one</p>
        </div>

        {events.error && (
          <Alert variant="error" className="mb-6">
            {events.error}
          </Alert>
        )}

        {showCreateForm ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Event Name *</Label>
                <Input
                  id="event-name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Company Annual Dinner"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && eventName.trim()) handleCreateEvent();
                  }}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
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
                    placeholder="e.g., Dar es Salaam"
                  />
                </div>
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
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateEvent}
                  disabled={events.isCreating || !eventName.trim()}
                >
                  {events.isCreating ? <Spinner /> : 'Create Event'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEventName('');
                    setEventDate('');
                    setEventLocation('');
                    setEventDescription('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {events.isLoading && events.events.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Add Event Tile */}
            <Card
              className="cursor-pointer border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-slate-400 hover:bg-slate-100"
              onClick={() => setShowCreateForm(true)}
            >
              <CardContent className="flex h-48 flex-col items-center justify-center p-6">
                <Plus className="mb-2 h-12 w-12 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">Create New Event</p>
              </CardContent>
            </Card>

            {/* Event Tiles */}
            {events.events.map((event) => (
              <Card
                key={event.id}
                className="group cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex-1 text-lg">{event.name}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="opacity-0 transition-opacity group-hover:opacity-100 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={(e) => handleDeleteEvent(event.id, e)}
                      disabled={events.isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {event.date && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.date.toString())}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.description && (
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-2">{event.description}</span>
                    </div>
                  )}
                  {!event.date && !event.location && !event.description && (
                    <p className="text-sm text-slate-400">Click to manage guests</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!events.isLoading && events.events.length === 0 && !showCreateForm && (
          <Alert variant="info" className="text-center">
            <p className="mb-2">No events yet. Click the "+" tile above to create your first event.</p>
          </Alert>
        )}
      </main>
    </div>
  );
}

