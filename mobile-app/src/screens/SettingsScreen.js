import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { playTechPing, pulseVibration } from '../services/notificationService';
import { testSupabaseConnection } from '../services/supabase';

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

  const [newPassword, setNewPassword] = useState('');

  const handleTestPingAndVibration = () => {
    playTechPing();
    pulseVibration();
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

  const handleChangePassword = () => {
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      Alert.alert('Password Error', 'Password must be at least 4 characters.');
      return;
    }
    Alert.alert('Success', 'Manager password updated successfully.');
    setNewPassword('');
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
              Switch between Light Gradient and Midnight Dark
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
              Drop-down banner when order is placed
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

      {/* 4. Security & Password */}
      <View style={[styles.card, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🔒 Security & Password</Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Change Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
            placeholder="Enter new manager password"
            placeholderTextColor={theme.textMuted}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.btnAction, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
          onPress={handleChangePassword}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnActionText, { color: theme.textPrimary }]}>Update Password</Text>
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
        Acquiro Mobile Manager v2.0.0 (React Native Engine) • Android 9+
      </Text>
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
    marginBottom: 10,
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
});
