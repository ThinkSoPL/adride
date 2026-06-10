import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn, sendMagicLink } from '../lib/auth';
import type { LoginScreenProps } from '../navigation/types';

type Mode = 'password' | 'magic-link' | 'magic-link-sent';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen(_props: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const handleSignIn = async () => {
    if (loading) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Podaj adres email.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Podaj poprawny adres email.');
      return;
    }
    if (!password) {
      setError('Podaj hasło.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(trimmedEmail, password);
      // RootNavigator wyłapie onAuthStateChange i przełączy na AppStack
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (loading) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Podaj adres email, aby otrzymać link.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Podaj poprawny adres email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendMagicLink(trimmedEmail);
      setMode('magic-link-sent');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'magic-link-sent') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.sentContainer}>
          <Text style={styles.sentIcon}>📧</Text>
          <Text style={styles.sentTitle}>Sprawdź swoją skrzynkę</Text>
          <Text style={styles.sentBody}>
            Wysłaliśmy link logowania na{'\n'}
            <Text style={styles.sentEmail}>{email}</Text>
          </Text>
          <Pressable style={styles.linkButton} onPress={() => setMode('password')}>
            <Text style={styles.linkText}>Wróć do logowania hasłem</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>AdRide</Text>
            <Text style={styles.tagline}>Twoja reklama jedzie tam gdzie są Twoi klienci.</Text>
          </View>

          {/* Karta logowania */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {mode === 'password' ? 'Zaloguj się' : 'Zaloguj się bez hasła'}
            </Text>

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="twoj@email.pl"
              placeholderTextColor="#4A5568"
              value={email}
              onChangeText={(v) => { setEmail(v); clearError(); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType={mode === 'password' ? 'next' : 'done'}
              onSubmitEditing={mode === 'magic-link' ? handleMagicLink : undefined}
            />

            {/* Hasło (tylko w trybie password) */}
            {mode === 'password' && (
              <>
                <Text style={styles.label}>Hasło</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#4A5568"
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearError(); }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
              </>
            )}

            {/* Błąd */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Przycisk główny */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonLoading,
              ]}
              onPress={mode === 'password' ? handleSignIn : handleMagicLink}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0A0D12" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === 'password' ? 'Zaloguj się' : 'Wyślij link logowania'}
                </Text>
              )}
            </Pressable>

            {/* Przełącznik trybu */}
            <Pressable
              style={styles.linkButton}
              onPress={() => {
                setMode(mode === 'password' ? 'magic-link' : 'password');
                clearError();
              }}
            >
              <Text style={styles.linkText}>
                {mode === 'password'
                  ? 'Zaloguj bez hasła (link email)'
                  : 'Zaloguj hasłem'}
              </Text>
            </Pressable>
          </View>

          {/* Stopka */}
          <Text style={styles.footer}>
            Masz problem z dostępem?{' '}
            <Text
              style={styles.footerLink}
              onPress={() =>
                Alert.alert(
                  'Kontakt',
                  'Napisz do nas: kontakt@adride.pl',
                  [{ text: 'OK' }],
                )
              }
            >
              Napisz do nas
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function mapAuthError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('invalid login credentials')) return 'Nieprawidłowy email lub hasło.';
    if (msg.includes('email not confirmed')) return 'Potwierdź adres email przed logowaniem.';
    if (msg.includes('user not found')) return 'Nie znaleziono konta o tym adresie email.';
    if (msg.includes('network')) return 'Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie.';
    return err.message;
  }
  return 'Nieoczekiwany błąd. Spróbuj ponownie.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0D12',
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FF6B35',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 13,
    color: '#718096',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },

  // Karta
  card: {
    backgroundColor: '#111720',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E2A38',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 20,
  },

  // Inputs
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#1E2A38',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#E6EDF3',
    marginBottom: 16,
  },

  // Błąd
  errorBox: {
    backgroundColor: 'rgba(229, 62, 62, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FC8181',
    fontSize: 13,
    lineHeight: 18,
  },

  // Przycisk
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  buttonPressed: {
    backgroundColor: '#E55A28',
  },
  buttonLoading: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#0A0D12',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Link
  linkButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkText: {
    color: '#FF6B35',
    fontSize: 14,
  },

  // Magic link sent
  sentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  sentIcon: {
    fontSize: 56,
    marginBottom: 24,
  },
  sentTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 12,
    textAlign: 'center',
  },
  sentBody: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  sentEmail: {
    color: '#FF6B35',
    fontWeight: '600',
  },

  // Stopka
  footer: {
    textAlign: 'center',
    color: '#4A5568',
    fontSize: 13,
    marginTop: 32,
  },
  footerLink: {
    color: '#718096',
    textDecorationLine: 'underline',
  },
});
