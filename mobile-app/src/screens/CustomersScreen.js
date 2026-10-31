import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking,
  Modal,
  ScrollView
} from 'react-native';
import { exportOrdersAsExcel, exportOrdersAsCsv } from '../services/exportService';

export default function CustomersScreen({ orders, theme }) {
  const [selectedClient, setSelectedClient] = useState(null);

  // Aggregate unique customers and link their full list of orders
  const customerMap = new Map();

  orders.forEach(order => {
    const key = (order.customer_email || order.email || order.customer_phone || order.phone || order.customer_name || '').toLowerCase().trim();
    if (!key) return;

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: key,
        name: order.customer_name || order.name || 'Unnamed Client',
        email: order.customer_email || order.email || '',
        phone: order.customer_phone || order.phone || '',
        company: order.company_name || order.company || 'Direct Client',
        ordersCount: 1,
        latestService: order.service_type || order.service_requested || 'General Inquiry',
        latestDate: order.created_at,
        clientOrders: [order]
      });
    } else {
      const c = customerMap.get(key);
      c.ordersCount += 1;
      c.clientOrders.push(order);
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

  const getStatusColor = (status) => {
    switch ((status || 'new').toLowerCase()) {
      case 'new': return { bg: 'rgba(124, 58, 237, 0.12)', text: '#7c3aed', border: 'rgba(124, 58, 237, 0.3)' };
      case 'accepted': return { bg: 'rgba(37, 99, 235, 0.12)', text: '#2563eb', border: 'rgba(37, 99, 235, 0.3)' };
      case 'in_progress': return { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706', border: 'rgba(245, 158, 11, 0.3)' };
      case 'completed': return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'cancelled': return { bg: 'rgba(244, 63, 94, 0.12)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
      default: return { bg: 'rgba(148, 163, 184, 0.12)', text: '#64748b', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const renderCustomerItem = ({ item }) => {
    const initials = getInitials(item.name);

    return (
      <TouchableOpacity
        style={[styles.customerCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}
        onPress={() => setSelectedClient(item)}
        activeOpacity={0.8}
      >
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
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={[styles.contactValue, { color: theme.accent }]}>{item.phone}</Text>
            </View>
          ) : null}

          {item.email ? (
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>✉️</Text>
              <Text style={[styles.contactValue, { color: theme.accent }]}>{item.email}</Text>
            </View>
          ) : null}

          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>✨</Text>
            <Text style={[styles.contactValue, { color: theme.primary, fontWeight: '600' }]}>{item.latestService}</Text>
          </View>

          <View style={styles.viewOrdersHintRow}>
            <Text style={[styles.viewOrdersHint, { color: theme.primary }]}>
              Tap to view all {item.ordersCount} order{item.ordersCount > 1 ? 's' : ''} →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
        keyExtractor={item => item.id}
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

      {/* Client Profile & Orders Modal */}
      {selectedClient ? (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedClient(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalAvatarCircle}>
                    <Text style={styles.modalAvatarText}>{getInitials(selectedClient.name)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.modalClientName, { color: theme.textPrimary }]}>
                      {selectedClient.name}
                    </Text>
                    <Text style={[styles.modalCompanyName, { color: theme.textSecondary }]}>
                      🏢 {selectedClient.company}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedClient(null)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 20, color: theme.textSecondary }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Communication Buttons */}
              <View style={styles.modalContactBar}>
                {selectedClient.phone ? (
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}
                    onPress={() => Linking.openURL(`tel:${selectedClient.phone}`)}
                  >
                    <Text style={[styles.modalActionBtnText, { color: '#2563eb' }]}>
                      📞 Call ({selectedClient.phone})
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {selectedClient.email ? (
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}
                    onPress={() => Linking.openURL(`mailto:${selectedClient.email}`)}
                  >
                    <Text style={[styles.modalActionBtnText, { color: '#7c3aed' }]}>
                      ✉️ Email Client
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={[styles.clientOrdersHeading, { color: theme.textSecondary }]}>
                Order History ({selectedClient.clientOrders.length})
              </Text>

              {/* Client Orders Scroll */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {selectedClient.clientOrders.map(ord => {
                  const statusStyle = getStatusColor(ord.status);
                  const ref = ord.order_ref || ord.order_id || `#${String(ord.id).slice(0, 8)}`;
                  const service = ord.service_type || ord.service_requested || 'AI Project';
                  const dateStr = ord.created_at ? new Date(ord.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Recent';

                  return (
                    <View
                      key={ord.id}
                      style={[styles.clientOrderCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    >
                      <View style={styles.clientOrderHeader}>
                        <View style={styles.refPill}>
                          <Text style={styles.refPillText}>{ref}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.clientOrderDate, { color: theme.textMuted }]}>{dateStr}</Text>
                          <View style={[styles.statusBadgeSmall, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                            <Text style={[styles.statusBadgeTextSmall, { color: statusStyle.text }]}>
                              {(ord.status || 'new').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={[styles.clientOrderService, { color: theme.textPrimary }]}>
                        ✨ {service}
                      </Text>

                      {ord.order_details || ord.message ? (
                        <Text style={[styles.clientOrderDetails, { color: theme.textSecondary }]} numberOfLines={3}>
                          "{ord.order_details || ord.message}"
                        </Text>
                      ) : null}

                      {ord.manager_notes ? (
                        <View style={[styles.clientOrderNotesBox, { borderColor: theme.border }]}>
                          <Text style={[styles.clientOrderNotesText, { color: theme.primary }]}>
                            📝 Internal Note: {ord.manager_notes}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
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
  viewOrdersHintRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  viewOrdersHint: {
    fontSize: 11,
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalClientName: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalCompanyName: {
    fontSize: 12,
    marginTop: 2,
  },
  modalContactBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clientOrdersHeading: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  clientOrderCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  clientOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  refPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  refPillText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  clientOrderDate: {
    fontSize: 11,
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusBadgeTextSmall: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  clientOrderService: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  clientOrderDetails: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 6,
  },
  clientOrderNotesBox: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  clientOrderNotesText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
