import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking,
  Modal,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { updateOrderStatusInSupabase, updateManagerNotesInSupabase } from '../services/supabase';

export default function OrdersScreen({
  orders,
  refreshing,
  onRefresh,
  onOrderUpdated,
  theme
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [managerNotesInput, setManagerNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Filter & Search Logic
  const filteredOrders = orders.filter(o => {
    const status = (o.status || 'new').toLowerCase();
    if (selectedFilter !== 'all' && status !== selectedFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const searchable = [
        o.customer_name,
        o.name,
        o.customer_email,
        o.email,
        o.customer_phone,
        o.phone,
        o.company_name,
        o.company,
        o.order_ref,
        o.service_type,
        o.service_requested,
        o.order_details,
        o.message
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(q);
    }

    return true;
  });

  const newCount = orders.filter(o => (o.status || 'new').toLowerCase() === 'new').length;
  const totalCount = orders.length;

  const handleOpenDetails = (order) => {
    setActiveModalOrder(order);
    setManagerNotesInput(order.manager_notes || '');
  };

  const handleCloseDetails = () => {
    setActiveModalOrder(null);
    setManagerNotesInput('');
  };

  const handleSaveNotes = async () => {
    if (!activeModalOrder) return;
    try {
      setSavingNotes(true);
      await updateManagerNotesInSupabase(activeModalOrder.id, managerNotesInput.trim());
      activeModalOrder.manager_notes = managerNotesInput.trim();
      onOrderUpdated();
      Alert.alert('Saved', 'Manager internal notes saved to Supabase cloud.');
      handleCloseDetails();
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatusInSupabase(orderId, newStatus);
      onOrderUpdated();
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to update status.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return { bg: 'rgba(124, 58, 237, 0.12)', text: '#7c3aed', border: 'rgba(124, 58, 237, 0.3)' };
      case 'accepted': return { bg: 'rgba(37, 99, 235, 0.12)', text: '#2563eb', border: 'rgba(37, 99, 235, 0.3)' };
      case 'in_progress': return { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706', border: 'rgba(245, 158, 11, 0.3)' };
      case 'completed': return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'cancelled': return { bg: 'rgba(244, 63, 94, 0.12)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
      default: return { bg: 'rgba(148, 163, 184, 0.12)', text: '#64748b', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const formatTimeAgo = (isoStr) => {
    if (!isoStr) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(isoStr).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
      return new Date(isoStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Render individual compact order card
  const renderOrderItem = ({ item }) => {
    const clientName = item.customer_name || item.name || 'Unnamed Client';
    const phone = item.customer_phone || item.phone || '';
    const email = item.customer_email || item.email || '';
    const company = item.company_name || item.company || 'Direct Client';
    const service = item.service_type || item.service_requested || 'AI Voice Agents';
    const ref = item.order_ref || `#${String(item.id).slice(0, 8)}`;
    const status = (item.status || 'new').toLowerCase();
    const statusStyle = getStatusColor(status);
    const timeAgo = formatTimeAgo(item.created_at);
    const initials = getInitials(clientName);
    const hasNotes = Boolean(item.manager_notes && item.manager_notes.trim());

    return (
      <View style={[styles.orderCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        
        {/* Top Meta Line: Ref + Status Badge + Time */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.refBox}>
            <Text style={styles.refText}>{ref}</Text>
          </View>

          <View style={styles.headerRightGroup}>
            <Text style={[styles.timeAgoText, { color: theme.textMuted }]}>🕒 {timeAgo}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Client Row: Avatar + Name + Company */}
        <View style={styles.clientRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.clientName, { color: theme.textPrimary }]} numberOfLines={1}>
              {clientName}
            </Text>
            <Text style={[styles.companyText, { color: theme.textSecondary }]} numberOfLines={1}>
              🏢 {company}
            </Text>
          </View>
        </View>

        {/* Service Requested Pill */}
        <View style={styles.serviceRow}>
          <View style={[styles.servicePill, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.serviceText, { color: theme.primary }]} numberOfLines={1}>
              ✨ {service}
            </Text>
          </View>
        </View>

        {/* Details Snippet */}
        {item.order_details || item.message ? (
          <Text style={[styles.scopeSnippet, { color: theme.textSecondary }]} numberOfLines={2}>
            "{item.order_details || item.message}"
          </Text>
        ) : null}

        {/* Action Toolbar */}
        <View style={[styles.actionToolbar, { borderTopColor: theme.borderSubtle }]}>
          {phone ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnCall]}
              onPress={() => Linking.openURL(`tel:${phone}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnTextCall}>📞 Call</Text>
            </TouchableOpacity>
          ) : null}

          {email ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.inputBg }]}
              onPress={() => Linking.openURL(`mailto:${email}`)}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>✉️ Email</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.inputBg }]}
            onPress={() => handleOpenDetails(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>
              📝 Details {hasNotes ? '✓' : ''}
            </Text>
          </TouchableOpacity>

          {/* Quick Accept Button for New Orders */}
          {status === 'new' ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}
              onPress={() => handleStatusChange(item.id, 'accepted')}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>✓ Accept</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Metric Tiles */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricTile, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>New Orders</Text>
          <View style={styles.metricNumberRow}>
            <Text style={[styles.metricNumber, { color: theme.primary }]}>{newCount}</Text>
            <View style={styles.metricPill}>
              <Text style={styles.metricPillText}>Alerting</Text>
            </View>
          </View>
        </View>

        <View style={[styles.metricTile, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Logged</Text>
          <View style={styles.metricNumberRow}>
            <Text style={[styles.metricNumber, { color: theme.textPrimary }]}>{totalCount}</Text>
            <View style={[styles.metricPill, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Text style={[styles.metricPillText, { color: '#10b981' }]}>Supabase</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Search Field */}
      <View style={[styles.searchBox, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Search by client, phone, company, ref..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ fontSize: 16, color: theme.textMuted }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips Scroll */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'new', label: '• New' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map(f => {
            const isActive = selectedFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? theme.primary : theme.surfaceCard,
                    borderColor: isActive ? theme.primary : theme.border
                  }
                ]}
                onPress={() => setSelectedFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: isActive ? '#ffffff' : theme.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders FlatList */}
      <FlatList
        style={styles.ordersList}
        data={filteredOrders}
        keyExtractor={item => String(item.id)}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📋</Text>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Orders Found</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              {searchQuery || selectedFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Incoming customer inquiries will appear here automatically.'}
            </Text>
          </View>
        }
      />

      {/* Order Details & Manager Notes Modal */}
      {activeModalOrder ? (
        <Modal visible transparent animationType="slide" onRequestClose={handleCloseDetails}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
              
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Order Details</Text>
                <TouchableOpacity onPress={handleCloseDetails} style={styles.modalCloseBtn}>
                  <Text style={{ fontSize: 18, color: theme.textSecondary }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.modalInfoGrid, { backgroundColor: theme.inputBg }]}>
                  <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>
                    👤 Client: <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{activeModalOrder.customer_name || activeModalOrder.name}</Text>
                  </Text>
                  <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>
                    🏢 Company: <Text style={{ color: theme.textPrimary }}>{activeModalOrder.company_name || activeModalOrder.company || 'Direct Client'}</Text>
                  </Text>
                  <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>
                    📞 Phone: <Text style={{ color: theme.accent }}>{activeModalOrder.customer_phone || activeModalOrder.phone || 'N/A'}</Text>
                  </Text>
                  <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>
                    ✉️ Email: <Text style={{ color: theme.accent }}>{activeModalOrder.customer_email || activeModalOrder.email || 'N/A'}</Text>
                  </Text>
                  <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>
                    🏷️ Service: <Text style={{ color: theme.primary, fontWeight: '700' }}>{activeModalOrder.service_type || activeModalOrder.service_requested}</Text>
                  </Text>
                  <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>
                    ⚡ Status: <Text style={{ fontWeight: '700' }}>{(activeModalOrder.status || 'new').toUpperCase()}</Text>
                  </Text>
                  <Text style={[styles.gridSubText, { color: theme.textMuted }]}>
                    Ref: {activeModalOrder.order_ref} • {new Date(activeModalOrder.created_at).toLocaleString()}
                  </Text>
                </View>

                {/* Scope Details */}
                <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>Customer Scope & Requirements</Text>
                <View style={[styles.scopeBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={[styles.scopeText, { color: theme.textPrimary }]}>
                    {activeModalOrder.order_details || activeModalOrder.message || 'No additional scope details provided.'}
                  </Text>
                </View>

                {/* Manager Internal Notes */}
                <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>Internal Manager Notes (Saved to Supabase)</Text>
                <TextInput
                  style={[styles.notesInput, { backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }]}
                  placeholder="Record private client discussion, quote estimates, or booking time..."
                  placeholderTextColor={theme.textMuted}
                  value={managerNotesInput}
                  onChangeText={setManagerNotesInput}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.saveNotesBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSaveNotes}
                  disabled={savingNotes}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveNotesBtnText}>
                    {savingNotes ? 'Saving to Database...' : 'Save Notes to Cloud ✓'}
                  </Text>
                </TouchableOpacity>

                {/* Status Switcher inside Modal */}
                <Text style={[styles.sectionHeading, { color: theme.textSecondary, marginTop: 16 }]}>Update Status</Text>
                <View style={styles.statusButtonsRow}>
                  {['new', 'accepted', 'in_progress', 'completed', 'cancelled'].map(st => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusToggleBtn,
                        {
                          backgroundColor: activeModalOrder.status === st ? theme.primary : theme.inputBg
                        }
                      ]}
                      onPress={() => {
                        handleStatusChange(activeModalOrder.id, st);
                        activeModalOrder.status = st;
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: activeModalOrder.status === st ? '#ffffff' : theme.textSecondary
                        }}
                      >
                        {st.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

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
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  metricTile: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  metricNumber: {
    fontSize: 26,
    fontWeight: '800',
  },
  metricPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  metricPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7c3aed',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: 40,
  },
  filterWrapper: {
    height: 46,
    marginVertical: 6,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  ordersList: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  refText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeAgoText: {
    fontSize: 11,
    marginRight: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 1,
  },
  companyText: {
    fontSize: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  servicePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scopeSnippet: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 10,
  },
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnCall: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  actionBtnTextCall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalInfoGrid: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 6,
  },
  gridLabel: {
    fontSize: 13,
  },
  gridSubText: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  scopeBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  scopeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  notesInput: {
    minHeight: 80,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveNotesBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  saveNotesBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  statusToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
