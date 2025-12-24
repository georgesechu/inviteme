/**
 * Account screen
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
import { useAuth, useAccount } from '@inviteme/shared';
import { sdk } from '../src/sdk';
import { Feather } from '@expo/vector-icons';

const MESSAGE_BUNDLES = [
  { messages: 10, price: 2.99, label: 'Starter', popular: false },
  { messages: 50, price: 12.99, label: 'Standard', popular: true },
  { messages: 100, price: 22.99, label: 'Professional', popular: false },
  { messages: 250, price: 49.99, label: 'Business', popular: false },
  { messages: 500, price: 89.99, label: 'Enterprise', popular: false },
];

export default function AccountScreen() {
  const router = useRouter();
  const auth = useAuth(sdk.auth);
  const account = useAccount(sdk.account);
  const [selectedBundle, setSelectedBundle] = useState<typeof MESSAGE_BUNDLES[0] | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (auth.isAuthenticated && !account.account) {
      account.loadAccount();
    }
  }, [auth.isAuthenticated, router]);

  const handlePurchaseBundle = async (bundle: typeof MESSAGE_BUNDLES[0]) => {
    const success = await account.purchaseBundle({
      messages: bundle.messages,
      amount: bundle.price,
      currency: 'USD',
    });
    if (success) {
      setSelectedBundle(null);
      Alert.alert('Success', `Purchased ${bundle.messages} message bundle!`);
    } else {
      Alert.alert('Error', account.error || 'Failed to purchase bundle');
    }
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={account.isLoading}
            onRefresh={account.loadAccount}
            tintColor="#16a34a"
          />
        }
      >
        {/* Account Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Account</Text>
          {account.isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : account.account ? (
            <View style={styles.accountInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{account.account.phoneNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelRow}>
                  <Feather name="message-circle" size={20} color="#16a34a" />
                  <Text style={styles.infoLabel}>Message Credits</Text>
                </View>
                <Text style={styles.infoValueLarge}>{account.account.messageCredits}</Text>
              </View>
              <Text style={styles.infoSubtext}>messages available</Text>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {account.error || 'Failed to load account information'}
              </Text>
            </View>
          )}
        </View>

        {/* Purchase Bundles Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Purchase Message Bundles</Text>
          <Text style={styles.cardSubtitle}>Select a bundle to purchase</Text>

          <View style={styles.bundlesGrid}>
            {MESSAGE_BUNDLES.map((bundle) => (
              <TouchableOpacity
                key={bundle.messages}
                style={[
                  styles.bundleCard,
                  selectedBundle?.messages === bundle.messages && styles.bundleCardSelected,
                  bundle.popular && styles.bundleCardPopular,
                ]}
                onPress={() => setSelectedBundle(bundle)}
              >
                {bundle.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </View>
                )}
                <Text style={styles.bundleLabel}>{bundle.label}</Text>
                <Text style={styles.bundlePrice}>${bundle.price.toFixed(2)}</Text>
                <Text style={styles.bundleMessages}>{bundle.messages} messages</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedBundle && (
            <View style={styles.purchaseSection}>
              <View style={styles.purchaseInfo}>
                <Text style={styles.purchaseLabel}>
                  {selectedBundle.label} - ${selectedBundle.price}
                </Text>
                <Text style={styles.purchaseSubtext}>
                  ${(selectedBundle.price / selectedBundle.messages).toFixed(3)} per message
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.purchaseButton,
                  account.isPurchasing && styles.purchaseButtonDisabled,
                ]}
                onPress={() => handlePurchaseBundle(selectedBundle)}
                disabled={account.isPurchasing}
              >
                <Feather name="credit-card" size={18} color="#ffffff" />
                <Text style={styles.purchaseButtonText}>
                  {account.isPurchasing ? 'Processing...' : 'Purchase'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {account.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{account.error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

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
  card: {
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16,
  },
  accountInfo: {
    marginTop: 8,
  },
  infoRow: {
    marginBottom: 20,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  infoValueLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  infoSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  bundlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  bundleCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  bundleCardSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  bundleCardPopular: {
    borderWidth: 2,
    borderColor: '#86efac',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#166534',
  },
  bundleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  bundlePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  bundleMessages: {
    fontSize: 12,
    color: '#64748b',
  },
  purchaseSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  purchaseSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#16a34a',
    borderRadius: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    marginTop: 16,
  },
});

