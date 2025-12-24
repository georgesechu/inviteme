/**
 * Login screen
 */
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@inviteme/shared';
import { sdk } from '../src/sdk';
import { Logo } from '../src/components/Logo';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAuth(sdk.auth);
  const [phoneNumber, setPhoneNumber] = useState('+2557');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace('/events');
    }
  }, [auth.isAuthenticated, router]);

  const handleRequestCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    await auth.requestCode(phoneNumber);
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }
    const success = await auth.verifyCode(phoneNumber, code);
    if (success) {
      router.replace('/events');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Logo size="lg" />
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in with your WhatsApp number</Text>

          {/* Phone Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+255712345678"
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  (auth.requestCodeState.isLoading || !phoneNumber.trim()) && styles.buttonDisabled,
                ]}
                onPress={handleRequestCode}
                disabled={auth.requestCodeState.isLoading || !phoneNumber.trim()}
              >
                <Text style={styles.buttonText}>
                  {auth.requestCodeState.isLoading ? 'Sending...' : 'Send Code'}
                </Text>
              </TouchableOpacity>
            </View>
            {auth.requestCodeState.success && (
              <View style={styles.alertSuccess}>
                <Feather name="check-circle" size={16} color="#16a34a" />
                <Text style={styles.alertText}>Code sent! Check your WhatsApp messages.</Text>
              </View>
            )}
            {auth.requestCodeState.error && (
              <View style={styles.alertError}>
                <Text style={styles.alertTextError}>{auth.requestCodeState.error}</Text>
              </View>
            )}
          </View>

          {/* Verification Code Input */}
          {auth.requestCodeState.success && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={code}
                  onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    (auth.verifyCodeState.isLoading || code.length !== 6) && styles.buttonDisabled,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={auth.verifyCodeState.isLoading || code.length !== 6}
                >
                  <Text style={styles.buttonText}>
                    {auth.verifyCodeState.isLoading ? 'Verifying...' : 'Verify'}
                  </Text>
                </TouchableOpacity>
              </View>
              {auth.verifyCodeState.error && (
                <View style={styles.alertError}>
                  <Text style={styles.alertTextError}>{auth.verifyCodeState.error}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account? Your account will be created automatically when you sign in.
            </Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Why choose WAgeni?</Text>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Feather name="message-circle" size={24} color="#16a34a" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>WhatsApp Integration</Text>
              <Text style={styles.featureText}>
                Send invitations directly through WhatsApp with delivery and read receipts.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Feather name="zap" size={24} color="#16a34a" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Quick Setup</Text>
              <Text style={styles.featureText}>
                Get started in minutes. No complicated setup required.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Feather name="shield" size={24} color="#16a34a" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Secure & Private</Text>
              <Text style={styles.featureText}>
                Your data is secure. We use WhatsApp's secure authentication.
              </Text>
            </View>
          </View>

          <View style={styles.highlightBox}>
            <Feather name="check-circle" size={20} color="#16a34a" />
            <View style={styles.highlightContent}>
              <Text style={styles.highlightTitle}>Free to Get Started</Text>
              <Text style={styles.highlightText}>
                Create unlimited events. Only pay for WhatsApp messages you send.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: '#16a34a',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
  },
  alertError: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  alertText: {
    color: '#166534',
    fontSize: 14,
  },
  alertTextError: {
    color: '#991b1b',
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  features: {
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  highlightBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 14,
    color: '#15803d',
    lineHeight: 20,
  },
});

