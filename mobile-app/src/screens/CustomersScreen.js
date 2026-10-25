import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking
} from 'react-native';
import { exportOrdersAsExcel, exportOrdersAsCsv } from '../services/exportService';

export default function CustomersScreen({ orders, theme }) {
  // Aggregate unique customers
  const customerMap = new Map();

  orders.forEach(order => {
    const key = (order.customer_email || order.email || order.customer_phone || order.phone || order.customer_name || '').toLowerCase().trim();
    if (!key) return;

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        name: order.customer_name || order.name || 'Unnamed Client',
        email: order.customer_email || order.email || '',
        phone: order.customer_phone || order.phone || '',
        company: order.company_name || order.company || 'Direct Client',
        ordersCount: 1,
        latestService: order.service_type || order.service_requested || 'General Inquiry',
        latestDate: order.created_at
      });
    } else {
      const c = customerMap.get(key);
      c.ordersCount += 1;
      if (new Date(order.created_at) > new Date(c.latestDate)) {
        c.latestDate = order.created_at;
        c.latestService = order.service_type || order.service_requested || c.latestService;
      }
    }
  });

  const customers = Array.from(customerMap.values());

  const getInitials = (name) => {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const renderCustomerItem = ({ item }) => {
    const initials = getInitials(item.name);

    return (
      <View style={[styles.customerCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.clientName, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>{item.ordersCount} Order{item.ordersCount > 1 ? 's' : ''}</Text>
              </View>
            </View>
            <Text style={[styles.companyText, { color: theme.textSecondary }]}>
              🏢 {item.company}
            </Text>
          </View>
        </View>

        {/* Info Rows */}
        <View style={[styles.contactDetails, { backgroundColor: theme.inputBg }]}>
          {item.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)} style={styles.contactRow}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={[styles.contactValue, { color: theme.accent }]}>{item.phone}</Text>
            </TouchableOpacity>
          ) : null}

          {item.email ? (
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${item.email}`)} style={styles.contactRow}>
              <Text style={styles.contactIcon}>✉️</Text>
              <Text style={[styles.contactValue, { color: theme.accent }]}>{item.email}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>✨</Text>
            <Text style={[styles.contactValue, { color: theme.primary, fontWeight: '600' }]}>{item.latestService}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Export Action Card */}
      <View style={[styles.exportCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <View style={styles.exportHeaderRow}>
          <View>
            <Text style={[styles.exportTitle, { color: theme.textPrimary }]}>Manager Data Exporter</Text>
            <Text style={[styles.exportSub, { color: theme.textSecondary }]}>
              Export records for client reporting, audits, or CRM sync.
            </Text>
          </View>
          <View style={styles.exportBadge}>
            <Text style={styles.exportBadgeText}>XLSX • CSV</Text>
          </View>
        </View>

        <View style={styles.exportButtonsRow}>
          <TouchableOpacity
            style={[styles.btnExport, styles.btnExportExcel]}
            onPress={() => exportOrdersAsExcel(orders)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnExportTextExcel}>📗 Export as Excel (.xlsx)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnExport, styles.btnExportCsv]}
            onPress={() => exportOrdersAsCsv(orders)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnExportTextCsv}>📄 Export as CSV (.csv)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Directory Title */}
      <View style={styles.directoryHeaderRow}>
        <Text style={[styles.directoryTitle, { color: theme.textPrimary }]}>
          Customer Directory ({customers.length})
        </Text>
        <Text style={[styles.directorySub, { color: theme.textMuted }]}>Synced from Supabase</Text>
      </View>

      {/* Customers FlatList */}
      <FlatList
        data={customers}
        keyExtractor={item => item.email || item.phone || item.name}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>👥</Text>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Customers Logged</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Customer profiles will accumulate as website orders arrive.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exportCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  exportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  exportSub: {
    fontSize: 12,
    maxWidth: 220,
    lineHeight: 16,
  },
  exportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  exportBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c3aed',
  },
  exportButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnExport: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnExportExcel: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  btnExportTextExcel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  btnExportCsv: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  btnExportTextCsv: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  directoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  directoryTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  directorySub: {
    fontSize: 11,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  customerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
  },
  companyText: {
    fontSize: 12,
    marginTop: 2,
  },
  orderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  contactDetails: {
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactIcon: {
    fontSize: 12,
  },
  contactValue: {
    fontSize: 12,
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
});
