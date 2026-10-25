import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { lightTheme, darkTheme } from './src/theme/colors';
import { fetchOrdersFromSupabase } from './src/services/supabase';
import { triggerHeadsUpAlert, playTechPing, pulseVibration } from './src/services/notificationService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'customers' | 'settings'
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const theme = isDarkMode ? darkTheme : lightTheme;
  const knownOrderIds = useRef(new Set());
  const isInitialLoad = useRef(true);

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
        // Detect newly arrived orders for notifications
        if (!isInitialLoad.current) {
          const brandNewOrders = fetched.filter(
            o => !knownOrderIds.current.has(o.id) && (o.status === 'new' || !o.status)
          );

          if (brandNewOrders.length > 0) {
            const latest = brandNewOrders[0];
            const title = `🔔 New Order: ${latest.customer_name || 'Client'}`;
            const body = `${latest.service_type || 'New Project'} • ${latest.order_ref || ''}`;
            
            triggerHeadsUpAlert(title, body, latest.order_ref);
            playTechPing();
            pulseVibration();
          }
        }

        // Update known order IDs
        fetched.forEach(o => knownOrderIds.current.add(o.id));
        isInitialLoad.current = false;
        setOrders(fetched);
      }
    } catch (err) {
      console.warn('Failed to fetch orders:', err);
    } finally {
      if (isUserRefresh) setRefreshing(false);
    }
  }, []);

  // Initial fetch and background interval polling
  useEffect(() => {
    loadOrders(false);

    // Poll every 8 seconds for real-time reception of orders
    const interval = setInterval(() => {
      loadOrders(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleOrderUpdated = (updatedOrder) => {
    setOrders(prev =>
      prev.map(o => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
    );
  };

  const newOrdersCount = orders.filter(
    o => (o.status || 'new').toLowerCase() === 'new'
  ).length;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        <LoginScreen
          onLoginSuccess={() => setIsAuthenticated(true)}
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
            theme={theme}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersScreen orders={orders} theme={theme} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            onLogout={() => setIsAuthenticated(false)}
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
