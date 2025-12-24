/**
 * Events list screen
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useEvents } from '@inviteme/shared';
import { sdk } from '../src/sdk';
import { Logo } from '../src/components/Logo';
import { Feather } from '@expo/vector-icons';

export default function EventsScreen() {
  const router = useRouter();
  const auth = useAuth(sdk.auth);
  const events = useEvents(sdk.events);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (auth.isAuthenticated && auth.token) {
      events.reloadEvents();
    }
  }, [auth.isAuthenticated, auth.token, router]);

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }
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
      router.push(`/events/${created.id}`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? All guests will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await events.deleteEvent(id);
          },
        },
      ]
    );
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

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo size="md" />
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/account')}
          >
            <Feather name="user" size={20} color="#16a34a" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              auth.logout();
              router.replace('/login');
            }}
          >
            <Feather name="log-out" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={events.isLoading}
            onRefresh={events.reloadEvents}
            tintColor="#16a34a"
          />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>My Events</Text>
          <Text style={styles.subtitle}>Select an event to manage guests or create a new one.</Text>

          {/* Create New Event Card */}
          <TouchableOpacity
            style={styles.createCard}
            onPress={() => setShowCreateForm(true)}
          >
            <Feather name="plus" size={32} color="#16a34a" />
            <Text style={styles.createCardText}>Create New Event</Text>
          </TouchableOpacity>

          {/* Create Event Form */}
          {showCreateForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Create New Event</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Event Name</Text>
                <TextInput
                  style={styles.input}
                  value={eventName}
                  onChangeText={setEventName}
                  placeholder="e.g., Company Annual Dinner"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={eventDate}
                  onChangeText={setEventDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Location (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={eventLocation}
                  onChangeText={setEventLocation}
                  placeholder="e.g., The Grand Ballroom"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  placeholder="e.g., Annual gathering for all employees"
                  multiline
                  numberOfLines={3}
                />
              </View>
              {events.error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{events.error}</Text>
                </View>
              )}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => {
                    setShowCreateForm(false);
                    setEventName('');
                    setEventDate('');
                    setEventLocation('');
                    setEventDescription('');
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, !eventName.trim() && styles.buttonDisabled]}
                  onPress={handleCreateEvent}
                  disabled={events.isCreating || !eventName.trim()}
                >
                  <Text style={styles.primaryButtonText}>
                    {events.isCreating ? 'Creating...' : 'Create Event'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Events List */}
          {events.isLoading && events.events.length === 0 && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          )}

          {!events.isLoading && events.events.length === 0 && !showCreateForm && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events yet. Create your first event above!</Text>
            </View>
          )}

          {events.events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => router.push(`/events/${event.id}`)}
            >
              <View style={styles.eventContent}>
                <Text style={styles.eventName}>{event.name}</Text>
                {event.date && (
                  <View style={styles.eventDetail}>
                    <Feather name="calendar" size={16} color="#64748b" />
                    <Text style={styles.eventDetailText}>
                      {formatDate(event.date.toISOString())}
                    </Text>
                  </View>
                )}
                {event.location && (
                  <View style={styles.eventDetail}>
                    <Feather name="map-pin" size={16} color="#64748b" />
                    <Text style={styles.eventDetailText}>{event.location}</Text>
                  </View>
                )}
                {event.description && (
                  <View style={styles.eventDetail}>
                    <Feather name="file-text" size={16} color="#64748b" />
                    <Text style={styles.eventDetailText} numberOfLines={2}>
                      {event.description}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteEvent(event.id);
                }}
              >
                <Feather name="trash-2" size={20} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Need to import TextInput
import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  createCard: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  createCardText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#16a34a',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
});

