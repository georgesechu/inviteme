import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useGuests, useEvents, useAccount, createApiClient } from '@inviteme/shared';
import { useSDK } from '../sdk';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Spinner } from '../components/ui/spinner';
import { Plus, RefreshCw, Trash2, User, ArrowLeft, Image as ImageIcon, Eye, Send, CheckCircle2, XCircle, Clock, CheckSquare, Square, Circle } from 'lucide-react';
import { Dialog } from '../components/ui/dialog';
import { CardPreview } from '../components/CardPreview';
import type { Guest } from '@inviteme/shared';

export function EventGuestsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const sdk = useSDK();
  const auth = useAuth(sdk.auth);
  const events = useEvents(sdk.events);
  const guests = useGuests(sdk.guests, eventId);
  const account = useAccount(sdk.account);
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('+2557');
  const [guestType, setGuestType] = useState<'Single' | 'Double'>('Single');
  const [previewGuest, setPreviewGuest] = useState<typeof guests.guests[0] | null>(null);
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const currentEvent = events.getEventById(eventId || '');

  // Load events when component mounts or when eventId changes
  useEffect(() => {
    if (auth.isAuthenticated) {
      // Always reload to get latest event data including cardDesignImageUrl
      events.reloadEvents();
      account.loadAccount();
    }
  }, [auth.isAuthenticated, eventId]);

  // Debug: Log event data when it changes
  useEffect(() => {
    if (currentEvent) {
      console.log('Current event loaded:', {
        id: currentEvent.id,
        name: currentEvent.name,
        hasCardDesign: !!currentEvent.cardDesignImageUrl,
        cardDesignImageUrl: currentEvent.cardDesignImageUrl,
      });
    } else if (eventId && events.events.length > 0) {
      console.log('Event not found in state, eventId:', eventId, 'Available events:', events.events.map(e => e.id));
    }
  }, [currentEvent, eventId]);

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
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (confirm('Are you sure you want to delete this guest?')) {
      await guests.deleteGuest(id);
    }
  };

  const handleSelectGuest = (guestId: string) => {
    setSelectedGuests(prev => {
      const next = new Set(prev);
      if (next.has(guestId)) {
        next.delete(guestId);
      } else {
        next.add(guestId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedGuests.size === guests.guests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(guests.guests.map(g => g.id)));
    }
  };

  const handleSendInvitations = () => {
    if (!eventId || selectedGuests.size === 0) return;
    setIsSendModalOpen(true);
  };

  const confirmSendInvitations = async () => {
    if (!eventId || selectedGuests.size === 0) return;

    setIsSending(true);
    try {
      // Create API client with token
      const token = localStorage.getItem('authToken');
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const api = createApiClient({
        baseUrl: apiBase,
        getToken: () => token,
      });
      
      const response = await api.sendInvitations({
        guestIds: Array.from(selectedGuests),
        eventId,
      });

      if (response.success && response.data) {
        const { summary } = response.data;
        alert(`Invitations sent!\n\nSuccessful: ${summary.successful}\nFailed: ${summary.failed}`);
        
        // Clear selection and reload guests to get updated status
        setSelectedGuests(new Set());
        setIsSendModalOpen(false);
        await guests.reloadGuests();
        await account.loadAccount(); // Refresh account credits
      } else {
        alert('Failed to send invitations: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Failed to send invitations. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (guest: Guest) => {
    switch (guest.sendStatus) {
      case 'sent':
        return <Clock className="h-3.5 w-3.5" />;
      case 'delivered':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'read':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'failed':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'pending':
      default:
        return <Circle className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadge = (guest: Guest) => {
    const status = guest.sendStatus || 'pending';
    
    let bgColor = '';
    let textColor = '';
    let label = '';
    
    switch (status) {
      case 'sent':
        bgColor = 'bg-green-100';
        textColor = 'text-green-700';
        label = 'Sent';
        break;
      case 'delivered':
        bgColor = 'bg-green-100';
        textColor = 'text-green-700';
        label = 'Delivered';
        break;
      case 'read':
        bgColor = 'bg-emerald-100';
        textColor = 'text-emerald-700';
        label = 'Read';
        break;
      case 'failed':
        bgColor = 'bg-red-100';
        textColor = 'text-red-700';
        label = 'Failed';
        break;
      case 'pending':
      default:
        bgColor = 'bg-slate-100';
        textColor = 'text-slate-600';
        label = 'Pending';
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${bgColor} ${textColor}`}>
        {getStatusIcon(guest)}
        <span className="text-xs font-medium">{label}</span>
      </span>
    );
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
          <div className="border-b border-slate-200 bg-white shadow-sm">
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
            </div>
          </div>

      <main className="mx-auto max-w-6xl px-4 py-8">

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Card Design</CardTitle>
          </CardHeader>
          <CardContent>
            {currentEvent?.cardDesignImageUrl ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={(() => {
                      const url = currentEvent.cardDesignImageUrl!;
                      if (url.startsWith('http')) return url;
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                      return `${apiUrl}${url}`;
                    })()}
                    alt="Card design"
                    className="h-32 w-auto rounded border border-slate-200"
                    onError={(e) => {
                      console.error('Failed to load card design preview:', currentEvent.cardDesignImageUrl);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">
                      Card design uploaded. Configure name and QR code placement.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => navigate(`/events/${eventId}/design`)}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Configure Placement
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Upload your card design image, then configure where to place the guest name and QR code.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/events/${eventId}/design`)}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Upload & Configure Design
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Guests ({guests.guests.length})</CardTitle>
                <div className="flex items-center gap-2">
                  {selectedGuests.size > 0 && (
                    <Button
                      variant="default"
                      onClick={handleSendInvitations}
                      disabled={isSending || !eventId}
                      size="sm"
                    >
                      {isSending ? (
                        <>
                          <Spinner />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send to {selectedGuests.size}
                        </>
                      )}
                    </Button>
                  )}
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
                  <Button
                    variant="default"
                    onClick={() => setIsAddModalOpen(true)}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Guest
                  </Button>
                </div>
              </CardHeader>
          <CardContent>
            {guests.isLoading && guests.guests.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            )}

            {!guests.isLoading && guests.guests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-4">
                  <User className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No guests yet</h3>
                <p className="text-sm text-slate-600 text-center max-w-sm mb-6">
                  Get started by adding your first guest. You can add guests individually or import them in bulk.
                </p>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Guest
                </Button>
              </div>
            )}

            {guests.guests.length > 0 && (
              <div className="space-y-3">
                {/* Select All Header */}
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    {selectedGuests.size === guests.guests.length ? (
                      <CheckSquare className="h-5 w-5 text-green-600" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-400" />
                    )}
                    <span>
                      {selectedGuests.size === guests.guests.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </span>
                  </button>
                  {selectedGuests.size > 0 && (
                    <span className="text-sm text-slate-600">
                      {selectedGuests.size} selected
                    </span>
                  )}
                </div>

                {/* Guest List */}
                <div className="grid gap-3">
                  {guests.guests.map((guest) => {
                    const isSelected = selectedGuests.has(guest.id);
                    return (
                      <div
                        key={guest.id}
                        className={`flex items-center justify-between rounded-lg border p-4 shadow-sm transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 bg-white hover:shadow-md'
                        }`}
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <button
                            onClick={() => handleSelectGuest(guest.id)}
                            className="flex-shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-green-600" />
                            ) : (
                              <Square className="h-5 w-5 text-slate-400" />
                            )}
                          </button>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                            <User className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-slate-900">{guest.name}</div>
                            </div>
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
                        <div className="flex items-center gap-3">
                          {/* Status badge on the right */}
                          {getStatusBadge(guest)}
                          {currentEvent?.cardDesignImageUrl && currentEvent?.cardTemplateConfig && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewGuest(guest)}
                              title="Preview Card"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteGuest(guest.id)}
                            disabled={guests.isDeleting}
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Guest Modal */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setGuestName('');
            setGuestMobile('+2557');
            setGuestType('Single');
          }
        }}
        title="Add New Guest"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-guest-name">Guest Name</Label>
            <Input
              id="modal-guest-name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter guest name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGuest();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal-guest-mobile">Phone Number</Label>
            <Input
              id="modal-guest-mobile"
              value={guestMobile}
              onChange={(e) => setGuestMobile(e.target.value)}
              placeholder="+255712345678"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGuest();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal-guest-type">Type</Label>
            <Select
              id="modal-guest-type"
              value={guestType}
              onChange={(e) => setGuestType(e.target.value as 'Single' | 'Double')}
            >
              <option value="Single">Single</option>
              <option value="Double">Double</option>
            </Select>
          </div>
          {guests.error && (
            <Alert variant="error">{guests.error}</Alert>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGuest}
              disabled={guests.isCreating || !guestName.trim() || !guestMobile.trim()}
            >
              {guests.isCreating ? (
                <>
                  <Spinner />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Guest
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Preview Dialog */}
      {previewGuest && currentEvent?.cardDesignImageUrl && currentEvent?.cardTemplateConfig && (
        <Dialog
          open={!!previewGuest}
          onOpenChange={(open) => !open && setPreviewGuest(null)}
          title={`Preview: ${previewGuest.name}`}
        >
          <div className="flex justify-center">
            <CardPreview
              baseImageUrl={currentEvent.cardDesignImageUrl}
              templateConfig={currentEvent.cardTemplateConfig}
              guest={previewGuest}
              verificationUrl={`http://46.62.209.58/c/${previewGuest.code}`}
            />
          </div>
        </Dialog>
      )}

      {/* Send Invitations Modal */}
      <Dialog
        open={isSendModalOpen}
        onOpenChange={(open) => !open && setIsSendModalOpen(false)}
        title="Send Invitations"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Selected Guests:</span>
                <span className="text-sm font-semibold text-slate-900">{selectedGuests.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Message Credits Required:</span>
                <span className="text-sm font-semibold text-slate-900">{selectedGuests.size}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="text-sm font-medium text-slate-700">Your Available Credits:</span>
                <span className={`text-sm font-semibold ${
                  (account.account?.messageCredits || 0) >= selectedGuests.size
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {account.account?.messageCredits || 0}
                </span>
              </div>
              {(account.account?.messageCredits || 0) < selectedGuests.size && (
                <Alert variant="error" className="mt-3">
                  Insufficient message credits. You need {selectedGuests.size} but only have {account.account?.messageCredits || 0}.
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setIsSendModalOpen(false);
                      navigate('/account');
                    }}
                  >
                    Purchase Credits
                  </Button>
                </Alert>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600">
            This will send personalized invitation cards to {selectedGuests.size} guest(s) via WhatsApp.
            Each message will use 1 credit.
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsSendModalOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSendInvitations}
              disabled={isSending || (account.account?.messageCredits || 0) < selectedGuests.size}
            >
              {isSending ? (
                <>
                  <Spinner />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitations
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}


