import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const PreorderDetailScreen = ({ navigation, route }) => {
  const { preorder, onStatusChange, onDelete } = route.params || {};
  const [status, setStatus] = useState(preorder?.status || 'PENDING');

  if (!preorder) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>Preorder not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const items = preorder.items || [];
  const totalAmount = items.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  const totalQty = items.reduce((sum, i) => sum + parseInt(i.quantity || 0, 10), 0);

  const getStatusStyle = (s) => {
    if (s === 'COMPLETED') return { badge: styles.statusCompleted, text: styles.statusCompletedText };
    if (s === 'CANCELLED') return { badge: styles.statusCancelled, text: styles.statusCancelledText };
    return { badge: styles.statusPending, text: styles.statusPendingText };
  };

  const handleToggleStatus = () => {
    const order = ['PENDING', 'COMPLETED', 'CANCELLED'];
    const next = order[(order.indexOf(status) + 1) % order.length];
    setStatus(next);
    if (onStatusChange) onStatusChange(preorder.preorder_id, next);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Preorder',
      `Delete the preorder for ${preorder.shop_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) onDelete(preorder.preorder_id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const { badge, text: badgeText } = getStatusStyle(status);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>❮</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{preorder.shop_name}</Text>
          <Text style={styles.headerSubtitle}>Preorder Details</Text>
        </View>
        <TouchableOpacity style={[styles.statusPill, badge]} onPress={handleToggleStatus}>
          <Text style={[styles.statusPillText, badgeText]}>{status}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Sales Executive</Text>
              <Text style={styles.summaryValue}>{preorder.sales_executive || '—'}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Order Date</Text>
              <Text style={styles.summaryValue}>{preorder.preorder_date || '—'}</Text>
            </View>
          </View>
          <View style={styles.summaryCardDivider} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Delivery Date</Text>
              <Text style={[styles.summaryValue, { color: '#E11D48' }]}>
                {preorder.delivery_date || '—'}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryValue}>{items.length} products</Text>
            </View>
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📦 Ordered Products</Text>
          <Text style={styles.sectionSubtitle}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Product</Text>
            <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>

          {/* Table Rows */}
          {items.map((item, index) => (
            <View
              key={index}
              style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
            >
              <View style={{ flex: 2 }}>
                <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>
                {item.category_name ? (
                  <Text style={styles.categoryTag}>{item.category_name}</Text>
                ) : null}
              </View>
              <Text style={[styles.qtyText, { flex: 0.8, textAlign: 'center' }]}>
                ×{item.quantity}
              </Text>
              <Text style={[styles.amtText, { flex: 1, textAlign: 'right' }]}>
                ₹{parseFloat(item.amount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          ))}

          {items.length === 0 && (
            <View style={styles.noItemsRow}>
              <Text style={styles.noItemsText}>No products in this preorder</Text>
            </View>
          )}
        </View>

        {/* Totals Card */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Quantity</Text>
            <Text style={styles.totalQtyValue}>{totalQty} units</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.editBtnText}>✎  Edit Preorder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteBtnText}>🗑  Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight + 10 || 50,
    paddingBottom: 16,
    backgroundColor: '#087E66',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPending: { backgroundColor: '#FFFBEB' },
  statusPendingText: { color: '#D97706' },
  statusCompleted: { backgroundColor: '#ECFDF5' },
  statusCompletedText: { color: '#059669' },
  statusCancelled: { backgroundColor: '#FEF2F2' },
  statusCancelledText: { color: '#DC2626' },

  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryItem: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  summaryCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },

  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  tableRowEven: {
    backgroundColor: '#FFFFFF',
  },
  tableRowOdd: {
    backgroundColor: '#FAFBFC',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  categoryTag: {
    fontSize: 10,
    color: '#087E66',
    fontWeight: '600',
    marginTop: 2,
    backgroundColor: '#E6F2F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  amtText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  noItemsRow: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },

  totalsCard: {
    backgroundColor: '#087E66',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#087E66',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  totalQtyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editBtn: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  editBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
});

export default PreorderDetailScreen;
