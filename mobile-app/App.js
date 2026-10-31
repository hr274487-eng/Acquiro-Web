import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  PermissionsAndroid,
  ActivityIndicator
} from 'react-native';
import { lightTheme, darkTheme } from './src/theme/colors';
import { fetchOrdersFromSupabase } from './src/services/supabase';
import { triggerHeadsUpAlert, playTechPing, pulseVibration } from './src/services/notificationService';
import {
  checkAuthSession,
  saveAuthSession,
  getSavedTheme,
  saveThemePreference,
  stopBackgroundService,
  startBackgroundService
} from './src/services/authService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = verifying stored session
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'customers' | 'settings'
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const theme = isDarkMode ? darkTheme : lightTheme;
  const knownOrderIds = useRef(new Set());
  const isInitialLoad = useRef(true);

  // Check persistent authentication session and theme on launch
  useEffect(() => {
    let isMounted = true;
    Promise.all([checkAuthSession(), getSavedTheme()]).then(([auth, savedTheme]) => {
      if (isMounted) {
        setIsAuthenticated(!!auth);
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Request Android 13+ Notification Permission
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        } catch (e) {
          console.warn('Failed to request notification permission:', e);
        }
      }
    };
    requestPermissions();
  }, []);

  // Fetch orders from Supabase
  const loadOrders = useCallback(async (isUserRefresh = false) => {
    if (isUserRefresh) setRefreshing(true);
    try {
      const fetched = await fetchOrdersFromSupabase();
      if (Array.isArray(fetched)) {
        // Detect new arrivals BEFORE updating knownOrderIds
        if (!isInitialLoad.current) {
          const newArrivals = fetched.filter(o => !knownOrderIds.current.has(String(o.id)));
          if (newArrivals.length > 0) {
            // In-app alert: play sound + vibrate (no banner — handled by BackgroundOrderService when minimized)
            playTechPing();
            pulseVibration();
          }
        }
        // Now record all fetched IDs as known
        fetched.forEach(o => knownOrderIds.current.add(String(o.id)));
        isInitialLoad.current = false;
        setOrders(fetched);
      }
    } catch (err) {
      console.warn('Failed to fetch orders:', err);
    } finally {
      if (isUserRefresh) setRefreshing(false);
    }
  }, []);

  // Initial fetch and background interval polling (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    loadOrders(false);

    // Poll every 8 seconds for real-time reception of orders
    const interval = setInterval(() => {
      loadOrders(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAuthenticated, loadOrders]);

  const handleLoginSuccess = async () => {
    await saveAuthSession(true);
    setIsAuthenticated(true);
    await startBackgroundService();
  };

  const handleLogout = async () => {
    await stopBackgroundService();
    await saveAuthSession(false);
    setIsAuthenticated(false);
    knownOrderIds.current = new Set();
    isInitialLoad.current = true;
  };

  const handleToggleTheme = async () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    await saveThemePreference(nextDark ? 'dark' : 'light');
  };

  const handleOrderUpdated = (updatedOrder) => {
    if (!updatedOrder || !updatedOrder.id) {
      loadOrders(false);
      return;
    }
    setOrders(prev =>
      prev.map(o => (String(o.id) === String(updatedOrder.id) ? { ...o, ...updatedOrder } : o))
    );
  };

  const handleOrderDeleted = (deletedOrderId) => {
    setOrders(prev => prev.filter(o => String(o.id) !== String(deletedOrderId)));
    knownOrderIds.current.delete(String(deletedOrderId));
  };

  const newOrdersCount = orders.filter(
    o => (o.status || 'new').toLowerCase() === 'new'
  ).length;

  // Loading state while checking persistent session
  if (isAuthenticated === null) {
    return (
      <View style={[styles.container, styles.loadingCenter, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          theme={theme}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />

      {/* Main Content View */}
      <View style={styles.content}>
        {activeTab === 'orders' && (
          <OrdersScreen
            orders={orders}
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            onOrderUpdated={handleOrderUpdated}
            onOrderDeleted={handleOrderDeleted}
            theme={theme}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersScreen orders={orders} theme={theme} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
            onLogout={handleLogout}
            theme={theme}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border
          }
        ]}
      >
        {/* Orders Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('orders')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Text
              style={[
                styles.navIcon,
                { color: activeTab === 'orders' ? theme.primary : theme.textMuted }
              ]}
            >
              📥
            </Text>
            {newOrdersCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                <Text style={styles.badgeText}>
                  {newOrdersCount > 99 ? '99+' : newOrdersCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.navLabel,
              {
                color: activeTab === 'orders' ? theme.primary : theme.textMuted,
                fontWeight: activeTab === 'orders' ? '700' : '500'
              }
            ]}
          >
            Orders
          </Text>
        </TouchableOpacity>

        {/* Clients Directory Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('customers')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Text
              style={[
                styles.navIcon,
                { color: activeTab === 'customers' ? theme.primary : theme.textMuted }
              ]}
            >
              👥
            </Text>
          </View>
          <Text
            style={[
              styles.navLabel,
              {
                color: activeTab === 'customers' ? theme.primary : theme.textMuted,
                fontWeight: activeTab === 'customers' ? '700' : '500'
              }
            ]}
          >
            Clients
          </Text>
        </TouchableOpacity>

        {/* Settings Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Text
              style={[
                styles.navIcon,
                { color: activeTab === 'settings' ? theme.primary : theme.textMuted }
              ]}
            >
              ⚙️
            </Text>
          </View>
          <Text
            style={[
              styles.navLabel,
              {
                color: activeTab === 'settings' ? theme.primary : theme.textMuted,
                fontWeight: activeTab === 'settings' ? '700' : '500'
              }
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1
  },
  bottomNav: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 28
  },
  navIcon: {
    fontSize: 20
  },
  navLabel: {
    fontSize: 11,
    marginTop: 2
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  }
});
