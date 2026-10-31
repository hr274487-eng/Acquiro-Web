import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { getManagerPassword, resetDefaultPassword } from '../services/authService';

export default function LoginScreen({ onLoginSuccess, theme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleSignIn = async () => {
    setError('');
    const u = username.trim().toLowerCase();
    const p = password.trim();

    if (!u || !p) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const activePassword = await getManagerPassword();
      setTimeout(() => {
        setLoading(false);
        if (u === 'admin' && p === activePassword) {
          onLoginSuccess();
        } else {
          setError('Invalid credentials. Please verify your username and password.');
        }
      }, 400);
    } catch (e) {
      setLoading(false);
      setError('Authentication check failed. Please retry.');
    }
  };

  const handleResetToDefault = async () => {
    setForgotError('');
    if (!masterPasswordInput.trim()) {
      setForgotError('Please enter the default master credential.');
      return;
    }

    if (masterPasswordInput.trim() !== 'acquiro2026') {
      setForgotError('Incorrect default master password.');
      return;
    }

    setResetting(true);
    try {
      await resetDefaultPassword();
      setResetting(false);
      setForgotModalVisible(false);
      setMasterPasswordInput('');
      Alert.alert(
        'Password Reset Successful',
        'Manager password has been restored to default: acquiro2026\nYou can now sign in with username: admin and password: acquiro2026',
        [{ text: 'OK' }]
      );
    } catch (e) {
      setResetting(false);
      setForgotError('Failed to reset credentials. Please try again.');
    }
  };

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
            <View style={[styles.passwordInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.textPrimary }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => {
              setForgotError('');
              setMasterPasswordInput('');
              setForgotModalVisible(true);
            }}
          >
            <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

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

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>🔑 Restore Default Password</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Enter the Default Master Credential to reset manager access to factory settings:
            </Text>

            <View style={[styles.passwordInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 14 }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.textPrimary }]}
                value={masterPasswordInput}
                onChangeText={setMasterPasswordInput}
                placeholder="Enter default master password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showMasterPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowMasterPassword(!showMasterPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>{showMasterPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            {forgotError ? (
              <Text style={[styles.modalError, { color: theme.danger }]}>{forgotError}</Text>
            ) : null}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtnCancel, { borderColor: theme.border }]}
                onPress={() => setForgotModalVisible(false)}
              >
                <Text style={[styles.modalBtnCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtnConfirm, { backgroundColor: theme.primary }]}
                onPress={handleResetToDefault}
                disabled={resetting}
              >
                {resetting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Restore Default ✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 14,
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
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    height: 48,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 6,
  },
  eyeIcon: {
    fontSize: 18,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    paddingVertical: 2,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalError: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
