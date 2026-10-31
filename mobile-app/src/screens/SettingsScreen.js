import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { playTechPing, pulseVibration, triggerHeadsUpAlert } from '../services/notificationService';
import { testSupabaseConnection } from '../services/supabase';
import { getManagerPassword, updateManagerPassword } from '../services/authService';

export default function SettingsScreen({
  isDarkMode,
  onToggleTheme,
  onLogout,
  theme
}) {
  const [notifsActive, setNotifsActive] = useState(true);
  const [soundActive, setSoundActive] = useState(true);
  const [vibrateActive, setVibrateActive] = useState(true);

  const [dbUrl, setDbUrl] = useState('https://tpvqnghvvlsqowpklkav.supabase.co');
  const [dbKey, setDbKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnFuZ2h2dmxzcW93cGtsa2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MTg4MjcsImV4cCI6MjEwODQ5NDgyN30.fCENMp7E7otno_XLfx-eqaAB7tKRT_IhTnd2Bs4FsMM');
  const [dbTable, setDbTable] = useState('orders');
  const [testingDb, setTestingDb] = useState(false);
  const [testResult, setTestResult] = useState('');

  // Password Setup Modal State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Password validation criteria checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isAllValid = hasMinLength && hasUppercase && hasDigit && hasSpecial && isMatch;

  const handleTestPingAndVibration = () => {
    playTechPing();
    pulseVibration();
  };

  const handleTestNotificationBanner = () => {
    triggerHeadsUpAlert('🔔 New Order: Test Client', 'AI Voice Agents • ACQ-TEST-001', 'ACQ-TEST-001');
  };

  const handleTestDatabase = async () => {
    try {
      setTestingDb(true);
      setTestResult('Connecting to Supabase...');
      const res = await testSupabaseConnection({
        url: dbUrl.trim(),
        anonKey: dbKey.trim(),
        table: dbTable.trim()
      });
      setTestResult(`✓ Connected in ${res.latency}ms! Table "${dbTable}" is online.`);
    } catch (err) {
      setTestResult(`✗ Connection failed: ${err.message}`);
    } finally {
      setTestingDb(false);
    }
  };

  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setPasswordModalVisible(true);
  };

  const handleSavePassword = async () => {
    setPasswordError('');

    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }

    try {
      setSavingPassword(true);
      const activePassword = await getManagerPassword();
      if (currentPassword.trim() !== activePassword) {
        setSavingPassword(false);
        setPasswordError('Current password does not match.');
        return;
      }

      if (!hasMinLength) {
        setSavingPassword(false);
        setPasswordError('New password must be at least 8 characters.');
        return;
      }

      if (!hasUppercase) {
        setSavingPassword(false);
        setPasswordError('New password must contain at least one uppercase letter (A-Z).');
        return;
      }

      if (!hasDigit) {
        setSavingPassword(false);
        setPasswordError('New password must contain at least one digit (0-9).');
        return;
      }

      if (!hasSpecial) {
        setSavingPassword(false);
        setPasswordError('New password must contain at least one special character (!@#$%^&*...).');
        return;
      }

      if (newPassword !== confirmPassword) {
        setSavingPassword(false);
        setPasswordError('New password and confirmation do not match.');
        return;
      }

      await updateManagerPassword(newPassword.trim());
      setSavingPassword(false);
      setPasswordModalVisible(false);
      Alert.alert('Password Updated', 'Your manager password has been updated securely.');
    } catch (e) {
      setSavingPassword(false);
      setPasswordError('Failed to update password. Please retry.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      
      {/* 1. Theme Card */}
      <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🎨 Appearance & Theme</Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Dark Navy Theme</Text>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
              Persistent theme selection (survives app restart)
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={onToggleTheme}
            trackColor={{ false: '#cbd5e1', true: theme.primary }}
            thumbColor={'#ffffff'}
          />
        </View>
      </View>

      {/* 2. Notification & Sound Card */}
      <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🔔 Order Alerts & Modern Tech Ping</Text>

        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Heads-Up Notifications</Text>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
              Drop-down banner when incoming order arrives
            </Text>
          </View>
          <Switch
            value={notifsActive}
            onValueChange={setNotifsActive}
            trackColor={{ false: '#cbd5e1', true: theme.primary }}
            thumbColor={'#ffffff'}
          />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Modern Tech Ping Sound</Text>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
              Native 1320Hz + 2640Hz harmonic chime
            </Text>
          </View>
          <Switch
            value={soundActive}
            onValueChange={setSoundActive}
            trackColor={{ false: '#cbd5e1', true: theme.primary }}
            thumbColor={'#ffffff'}
          />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Haptic Vibration Alert</Text>
            <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
              Rhythmic pulse pattern on incoming orders
            </Text>
          </View>
          <Switch
            value={vibrateActive}
            onValueChange={setVibrateActive}
            trackColor={{ false: '#cbd5e1', true: theme.primary }}
            thumbColor={'#ffffff'}
          />
        </View>

        {/* Test Sound Button */}
        <TouchableOpacity
          style={[styles.btnAction, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
          onPress={handleTestPingAndVibration}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnActionText, { color: theme.primary }]}>
            🔊 Test Modern Tech Ping & Vibration
          </Text>
        </TouchableOpacity>

        {/* Test Notification Banner Button */}
        <TouchableOpacity
          style={[styles.btnAction, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.4)', marginTop: 8 }]}
          onPress={handleTestNotificationBanner}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnActionText, { color: '#10b981' }]}>
            🔔 Test Live Notification Banner
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Database Card */}
      <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>⚡ Supabase Cloud Database</Text>
        
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Project URL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
            value={dbUrl}
            onChangeText={setDbUrl}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Anon API Key</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
            value={dbKey}
            onChangeText={setDbKey}
            secureTextEntry
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Table Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
            value={dbTable}
            onChangeText={setDbTable}
          />
        </View>

        <TouchableOpacity
          style={[styles.btnAction, { backgroundColor: 'rgba(37, 99, 235, 0.1)', borderColor: 'rgba(37, 99, 235, 0.3)' }]}
          onPress={handleTestDatabase}
          disabled={testingDb}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnActionText, { color: '#2563eb' }]}>
            {testingDb ? 'Pinging Cloud...' : '📡 Test Cloud Connection'}
          </Text>
        </TouchableOpacity>

        {testResult ? (
          <Text
            style={[
              styles.testResultText,
              { color: testResult.startsWith('✓') ? '#10b981' : '#f43f5e' }
            ]}
          >
            {testResult}
          </Text>
        ) : null}
      </View>

      {/* 4. Security & Password Card */}
      <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🔒 Security & Password</Text>
        <Text style={[styles.settingSub, { color: theme.textSecondary, marginBottom: 12 }]}>
          Change your manager credential with strict security verification (8+ chars, uppercase, digit, special character).
        </Text>

        <TouchableOpacity
          style={[styles.btnAction, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
          onPress={handleOpenPasswordModal}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnActionText, { color: theme.textPrimary }]}>
            🔑 Open Password Change Setup →
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Logout */}
      <TouchableOpacity
        style={[styles.btnLogout, { backgroundColor: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}
        onPress={onLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.btnLogoutText}>🚪 Sign Out of Console</Text>
      </TouchableOpacity>

      <Text style={[styles.appVersionText, { color: theme.textMuted }]}>
        Acquiro Mobile Manager v2.16.0 (React Native Engine) • Android 9+
      </Text>

      {/* Password Change Setup Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>🔑 Change Manager Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 18, color: theme.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              
              {/* Field 1: Current Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Current Password</Text>
                <View style={[styles.passwordInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: theme.textPrimary }]}
                    placeholder="Enter current password"
                    placeholderTextColor={theme.textMuted}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrent}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
                    <Text style={styles.eyeIcon}>{showCurrent ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 2: New Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>New Password</Text>
                <View style={[styles.passwordInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: theme.textPrimary }]}
                    placeholder="Enter new strong password"
                    placeholderTextColor={theme.textMuted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                    <Text style={styles.eyeIcon}>{showNew ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 3: Confirm New Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Confirm New Password</Text>
                <View style={[styles.passwordInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: theme.textPrimary }]}
                    placeholder="Re-enter new password"
                    placeholderTextColor={theme.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                    <Text style={styles.eyeIcon}>{showConfirm ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Real-time Criteria Feedback */}
              <View style={[styles.criteriaBox, { backgroundColor: theme.inputBg }]}>
                <Text style={[styles.criteriaTitle, { color: theme.textSecondary }]}>Security Requirements:</Text>
                <Text style={[styles.criteriaItem, { color: hasMinLength ? '#10b981' : theme.textMuted }]}>
                  {hasMinLength ? '✓' : '○'} At least 8 characters
                </Text>
                <Text style={[styles.criteriaItem, { color: hasUppercase ? '#10b981' : theme.textMuted }]}>
                  {hasUppercase ? '✓' : '○'} At least 1 uppercase letter (A-Z)
                </Text>
                <Text style={[styles.criteriaItem, { color: hasDigit ? '#10b981' : theme.textMuted }]}>
                  {hasDigit ? '✓' : '○'} At least 1 numeric digit (0-9)
                </Text>
                <Text style={[styles.criteriaItem, { color: hasSpecial ? '#10b981' : theme.textMuted }]}>
                  {hasSpecial ? '✓' : '○'} At least 1 special character (!@#$%...)
                </Text>
                <Text style={[styles.criteriaItem, { color: isMatch ? '#10b981' : theme.textMuted }]}>
                  {isMatch ? '✓' : '○'} Passwords match
                </Text>
              </View>

              {passwordError ? (
                <Text style={[styles.passwordErrorText, { color: theme.danger }]}>{passwordError}</Text>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.modalBtnCancel, { borderColor: theme.border }]}
                  onPress={() => setPasswordModalVisible(false)}
                >
                  <Text style={[styles.modalBtnCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalBtnConfirm,
                    { backgroundColor: isAllValid ? theme.primary : '#94a3b8' }
                  ]}
                  onPress={handleSavePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.modalBtnConfirmText}>Update Password ✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 11,
    maxWidth: 240,
    lineHeight: 16,
  },
  btnAction: {
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    height: 44,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },
  criteriaBox: {
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 12,
    gap: 4,
  },
  criteriaTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  criteriaItem: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordErrorText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  testResultText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  btnLogout: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnLogoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f43f5e',
  },
  appVersionText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
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
    flex: 1.2,
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
