/**
 * Event guests screen
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, useGuests, useEvents } from '@inviteme/shared';
import { sdk } from '../../src/sdk';
import { Feather } from '@expo/vector-icons';
import type { Guest } from '@inviteme/shared';

export default function EventGuestsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const auth = useAuth(sdk.auth);
  const events = useEvents(sdk.events);
  const guests = useGuests(sdk.guests, eventId || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('+2557');
  const [guestType, setGuestType] = useState<'Single' | 'Double'>('Single');
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (eventId && auth.isAuthenticated) {
      guests.reloadGuests();
      events.reloadEvents();
    }
  }, [eventId, auth.isAuthenticated, router]);

  const currentEvent = events.getEventById(eventId || '');

  const handleCreateGuest = async () => {
    if (!guestName.trim() || !guestMobile.trim() || !eventId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    const success = await guests.createGuest(guestName.trim(), guestMobile.trim(), guestType);
    if (success) {
      setGuestName('');
      setGuestMobile('+2557');
      setGuestType('Single');
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    Alert.alert('Delete Guest', 'Are you sure you want to delete this guest?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await guests.deleteGuest(id);
        },
      },
    ]);
  };

  const handleSelectGuest = (guestId: string) => {
    setSelectedGuests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(guestId)) {
        newSet.delete(guestId);
      } else {
        newSet.add(guestId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedGuests.size === guests.guests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(guests.guests.map((g) => g.id)));
    }
  };

  const getStatusBadge = (guest: Guest) => {
    const status = guest.sendStatus || 'pending';
    let bgColor = '';
    let textColor = '';
    let iconName: keyof typeof Feather.glyphMap = 'circle';
    let label = '';

    switch (status) {
      case 'sent':
        bgColor = '#dbeafe';
        textColor = '#1e40af';
        iconName = 'clock';
        label = 'Sent';
        break;
      case 'delivered':
        bgColor = '#dcfce7';
        textColor = '#166534';
        iconName = 'check-circle';
        label = 'Delivered';
        break;
      case 'read':
        bgColor = '#d1fae5';
        textColor = '#065f46';
        iconName = 'check-circle';
        label = 'Read';
        break;
      case 'failed':
        bgColor = '#fee2e2';
        textColor = '#991b1b';
        iconName = 'x-circle';
        label = 'Failed';
        break;
      case 'pending':
      default:
        bgColor = '#f1f5f9';
        textColor = '#475569';
        iconName = 'circle';
        label = 'Pending';
        break;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Feather name={iconName} size={12} color={textColor} />
        <Text style={[styles.statusText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  if (!eventId) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentEvent?.name || 'Guests'}</Text>
        <TouchableOpacity onPress={() => setIsAddModalOpen(true)}>
          <Feather name="plus" size={24} color="#16a34a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={guests.isLoading}
            onRefresh={guests.reloadGuests}
            tintColor="#16a34a"
          />
        }
      >
        {/* Select All */}
        {guests.guests.length > 0 && (
          <View style={styles.selectAllContainer}>
            <TouchableOpacity style={styles.selectAllButton} onPress={handleSelectAll}>
              <Feather
                name={selectedGuests.size === guests.guests.length ? 'check-square' : 'square'}
                size={20}
                color={selectedGuests.size === guests.guests.length ? '#16a34a' : '#64748b'}
              />
              <Text style={styles.selectAllText}>
                {selectedGuests.size === guests.guests.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            {selectedGuests.size > 0 && (
              <Text style={styles.selectedCount}>{selectedGuests.size} selected</Text>
            )}
          </View>
        )}

        {/* Empty State */}
        {!guests.isLoading && guests.guests.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Feather name="user" size={48} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No guests yet</Text>
            <Text style={styles.emptyText}>Start by adding your first guest to this event.</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setIsAddModalOpen(true)}
            >
              <Feather name="plus" size={20} color="#ffffff" />
              <Text style={styles.emptyButtonText}>Add Your First Guest</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Guest List */}
        {guests.guests.map((guest) => {
          const isSelected = selectedGuests.has(guest.id);
          return (
            <TouchableOpacity
              key={guest.id}
              style={[styles.guestCard, isSelected && styles.guestCardSelected]}
              onPress={() => handleSelectGuest(guest.id)}
            >
              <View style={styles.guestContent}>
                <View style={styles.guestCheckbox}>
                  <Feather
                    name={isSelected ? 'check-square' : 'square'}
                    size={20}
                    color={isSelected ? '#16a34a' : '#cbd5e1'}
                  />
                </View>
                <View style={styles.guestAvatar}>
                  <Feather name="user" size={20} color="#64748b" />
                </View>
                <View style={styles.guestInfo}>
                  <Text style={styles.guestName}>{guest.name}</Text>
                  <View style={styles.guestDetails}>
                    <Text style={styles.guestMobile}>{guest.mobile}</Text>
                    <View
                      style={[
                        styles.guestTypeBadge,
                        guest.type === 'Single' && styles.guestTypeSingle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.guestTypeText,
                          guest.type === 'Single' && styles.guestTypeTextSingle,
                        ]}
                      >
                        {guest.type}
                      </Text>
                    </View>
                    <Text style={styles.guestCode}>Code: {guest.code}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.guestActions}>
                {getStatusBadge(guest)}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteGuest(guest.id)}
                >
                  <Feather name="trash-2" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Add Guest Modal */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Guest</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Guest Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={guestName}
                  onChangeText={setGuestName}
                  placeholder="Enter guest name"
                />
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Phone Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={guestMobile}
                  onChangeText={setGuestMobile}
                  placeholder="+255712345678"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      guestType === 'Single' && styles.typeOptionSelected,
                    ]}
                    onPress={() => setGuestType('Single')}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        guestType === 'Single' && styles.typeOptionTextSelected,
                      ]}
                    >
                      Single
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      guestType === 'Double' && styles.typeOptionSelected,
                    ]}
                    onPress={() => setGuestType('Double')}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        guestType === 'Double' && styles.typeOptionTextSelected,
                      ]}
                    >
                      Double
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {guests.error && (
                <View style={styles.modalError}>
                  <Text style={styles.modalErrorText}>{guests.error}</Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  (!guestName.trim() || !guestMobile.trim() || guests.isCreating) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={handleCreateGuest}
                disabled={guests.isCreating || !guestName.trim() || !guestMobile.trim()}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {guests.isCreating ? 'Adding...' : 'Add Guest'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  selectedCount: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#16a34a',
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guestCardSelected: {
    borderWidth: 2,
    borderColor: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  guestContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestCheckbox: {
    marginRight: 4,
  },
  guestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  guestDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  guestMobile: {
    fontSize: 14,
    color: '#64748b',
  },
  guestTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#e9d5ff',
  },
  guestTypeSingle: {
    backgroundColor: '#dcfce7',
  },
  guestTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
  },
  guestTypeTextSingle: {
    color: '#166534',
  },
  guestCode: {
    fontSize: 12,
    color: '#94a3b8',
  },
  guestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalBody: {
    padding: 20,
  },
  modalFormGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeOptionSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  typeOptionTextSelected: {
    color: '#166534',
  },
  modalError: {
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    marginBottom: 16,
  },
  modalErrorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#16a34a',
  },
  modalButtonSecondary: {
    backgroundColor: '#f1f5f9',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondaryText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
});

