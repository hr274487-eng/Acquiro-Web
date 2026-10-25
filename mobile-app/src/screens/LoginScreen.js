import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';

export default function LoginScreen({ onLoginSuccess, theme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    setError('');
    const u = username.trim().toLowerCase();
    const p = password.trim();

    if (!u || !p) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (u === 'admin' && p === 'acquiro2026') {
        onLoginSuccess();
      } else {
        setError('Invalid credentials. Please verify your username and password.');
      }
    }, 400);
  };

  const isDark = theme.background === '#090d16';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.badgeBox}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>OPERATIONS PORTAL</Text>
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Acquiro Manager</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Real-time order reception & customer triage console
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Manager Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Manager Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
            />
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: theme.dangerLight }]}>
              <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Access Manager Console →</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerNote}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              Android 9+ Secured • Connected to Supabase
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  footerNote: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
  },
});
