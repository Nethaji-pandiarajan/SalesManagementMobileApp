import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert, LayoutAnimation, Platform,
  UIManager, Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/config';
import { useAuth } from '../context/AuthContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BillingScreen = ({ navigation, route }) => {
  const { shop, supply_id } = route.params || { shop: { shopName: 'Test Shop', balance: 1200 } };
  const { userData } = useAuth();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [description, setDescription] = useState('');
  const [isBalanceExpanded, setIsBalanceExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryDropOpen, setCategoryDropOpen] = useState(false);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setFetchError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setFetchError('No authentication token found. Please log in again.');
        setLoadingProducts(false);
        return;
      }

      const response = await fetch(`${CONFIG.API_BASE_URL}/api/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        const mapped = data.map(cat => ({
          categoryName: cat.category_name,
          categoryId: cat.category_id,
          items: (cat.products || []).map(p => ({
            id: String(p.product_id),
            name: p.product_name,
            price: p.rate,
            sku_code: p.sku_code,
            unit: p.unit
          }))
        }));

        setCategories(mapped);
        if (mapped.length > 0) {
          setSelectedCategory(mapped[0]);
        }
      } else {
        setFetchError(data.error || 'Failed to load products.');
      }
    } catch (err) {
      console.error('Fetch products catalog error:', err);
      setFetchError('Network error. Unable to load products catalog.');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleProduct = (product) => {
    const exists = selectedProducts.find(p => p.id === product.id);
    if (exists) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      // find which category this product belongs to
      const cat = categories.find(c => c.items.some(i => i.id === product.id));
      setSelectedProducts([...selectedProducts, {
        ...product,
        quantity: 1,
        currentRate: product.price,
        categoryName: cat ? cat.categoryName : 'Other',
      }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setSelectedProducts(prev => prev.map(p =>
      p.id === id ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p
    ));
  };

  const updateRate = (id, delta) => {
    setSelectedProducts(prev => prev.map(p =>
      p.id === id ? { ...p, currentRate: Math.max(0, p.currentRate + delta) } : p
    ));
  };

  const totalBill = selectedProducts.reduce((sum, p) => sum + p.quantity * p.currentRate, 0);
  const currentPaid = parseFloat(paidAmount) || 0;
  const previousBalance = shop.pending_balance !== undefined && shop.pending_balance !== null
    ? shop.pending_balance
    : (shop.balance !== undefined && shop.balance !== null ? shop.balance : 0);
  const liveBalance = previousBalance + totalBill - currentPaid;

  const handleFinish = async () => {
    if (selectedProducts.length === 0) {
      Alert.alert('No Products', 'Please add at least one product before finishing the transaction.');
      return;
    }

    if (!supply_id) {
      Alert.alert('Error', 'Active trip not found. Please go back and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Session Expired', 'Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        shop_id: shop.shop_id,
        supply_id: supply_id,
        org_id: userData?.org_id || shop?.org_id,
        items: selectedProducts.map(p => ({
          product_id: parseInt(p.id),
          quantity_sold: p.quantity,
          rate_at_sale: p.currentRate,
        })),
        paid_amount: currentPaid,
        payment_type: paymentType.toUpperCase(),
        description: description || null,
      };

      const response = await fetch(`${CONFIG.API_BASE_URL}/api/sales/record-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          '✅ Transaction Recorded',
          `Bill: ₹${data.total_amount}  |  Paid: ₹${data.paid_amount}  |  Pending: ₹${data.pending_amount}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Transaction Failed', data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Record transaction error:', err);
      Alert.alert('Network Error', 'Unable to connect to the server. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsBalanceExpanded(v => !v);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backBtnInner}>
            <Text style={styles.backBtnText}>❮</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>BILLING</Text>
          <Text style={styles.shopNameHeader}>{shop.shopName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Bill Details */}
      <ScrollView style={styles.mainArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainContent}>
        <View style={styles.billDetailsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bill Details</Text>
            <TouchableOpacity style={styles.addProductBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.addProductBtnText}>+ Add Product</Text>
            </TouchableOpacity>
          </View>

          {selectedProducts.length === 0 ? (
            <TouchableOpacity style={styles.emptyState} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyStateIcon}>＋</Text>
              <Text style={styles.emptyStateText}>Tap to add products</Text>
            </TouchableOpacity>
          ) : (() => {
            // Group products by category
            const grouped = selectedProducts.reduce((acc, p) => {
              const key = p.categoryName || 'Other';
              if (!acc[key]) acc[key] = [];
              acc[key].push(p);
              return acc;
            }, {});
            return Object.entries(grouped).map(([catName, products]) => (
              <View key={catName} style={styles.categoryGroup}>
                <Text style={styles.categoryGroupTitle}>{catName}</Text>
                {products.map(p => (
                  <View key={p.id} style={styles.productRow}>
                    <View style={styles.productRowTop}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <View style={styles.productRowRight}>
                        <Text style={styles.itemTotal}>₹{(p.quantity * p.currentRate).toLocaleString()}</Text>
                        <TouchableOpacity style={styles.removeBtnWrap} onPress={() => toggleProduct(p)}>
                          <Text style={styles.removeBtn}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.productRowBottom}>
                      <View style={styles.labeledStepper}>
                        <Text style={styles.stepLabel}>Qty</Text>
                        <View style={styles.stepperGroup}>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuantity(p.id, -1)}>
                            <Text style={styles.stepBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.stepValue}>{p.quantity}</Text>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuantity(p.id, 1)}>
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.labeledStepper}>
                        <Text style={styles.stepLabel}>Rate</Text>
                        <View style={styles.stepperGroup}>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => updateRate(p.id, -1)}>
                            <Text style={styles.stepBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.stepValue}>₹{p.currentRate}</Text>
                          <TouchableOpacity style={styles.stepBtn} onPress={() => updateRate(p.id, 1)}>
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ));
          })()}
        </View>
      </ScrollView>

      {/* Backdrop */}
      {isBalanceExpanded && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsBalanceExpanded(false); }}
        />
      )}

      {/* Bottom Accordion */}
      <View style={styles.bottomAccordion}>
        <TouchableOpacity style={styles.accordionHeader} onPress={toggleAccordion} activeOpacity={0.8}>
          <View>
            <View style={styles.accordionTitleRow}>
              <Text style={styles.accordionTitle}>Total Bill</Text>
              <Text style={styles.accordionToggleIcon}>{isBalanceExpanded ? '▼' : '▲'}</Text>
            </View>
            <Text style={styles.accordionTotalValue}>₹{totalBill.toLocaleString()}</Text>
          </View>
        </TouchableOpacity>

        {isBalanceExpanded && (
          <View style={styles.accordionBody}>
            <View style={styles.paymentRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelDark}>Paid Amount (₹)</Text>
                <TextInput
                  style={styles.amountInputDark}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                />
              </View>
              <View style={styles.inputGroupFlexible}>
                <Text style={styles.inputLabelDark}>Payment Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                  {['Cash', 'UPI', 'Cheque'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeBtnDark, paymentType === type && styles.typeBtnActiveDark]}
                      onPress={() => setPaymentType(type)}
                    >
                      <Text style={[styles.typeBtnTextDark, paymentType === type && styles.typeBtnTextActiveDark]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.descriptionRow}>
              <View style={styles.inputGroupFull}>
                <Text style={styles.inputLabelDark}>Description / Remarks</Text>
                <TextInput
                  style={styles.descriptionInputDark}
                  placeholder="Enter transaction details (optional)"
                  placeholderTextColor="#64748B"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceRow}><Text style={styles.balanceLabel}>Previous Balance</Text><Text style={styles.balanceValue}>₹{previousBalance.toLocaleString()}</Text></View>
            <View style={styles.balanceRow}><Text style={styles.balanceLabel}>Current Bill</Text><Text style={styles.billValue}>+ ₹{totalBill.toLocaleString()}</Text></View>
            <View style={styles.balanceRow}><Text style={styles.balanceLabel}>Amount Paid</Text><Text style={styles.paidValue}>- ₹{currentPaid.toLocaleString()}</Text></View>
            <View style={styles.divider} />
            <View style={styles.balanceRow}>
              <Text style={styles.liveBalanceLabel}>New Balance</Text>
              <Text style={[styles.liveBalanceValue, liveBalance > 0 && styles.negativeBalance]}>₹{liveBalance.toLocaleString()}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.finishBtn,
            (selectedProducts.length === 0 || !paidAmount || paidAmount.trim() === '' || isSubmitting) && styles.finishBtnDisabled,
          ]}
          onPress={handleFinish}
          disabled={selectedProducts.length === 0 || !paidAmount || paidAmount.trim() === '' || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.finishBtnText}>
              {selectedProducts.length === 0
                ? 'Add Products to Finish'
                : (!paidAmount || paidAmount.trim() === '')
                ? 'Enter Paid Amount'
                : 'Finish Transaction'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Picker Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Products</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setCategoryDropOpen(false); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingProducts ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#087E66" />
                <Text style={styles.modalLoadingText}>Loading products catalog...</Text>
              </View>
            ) : fetchError ? (
              <View style={styles.modalErrorContainer}>
                <Text style={styles.modalErrorText}>⚠️ {fetchError}</Text>
                <TouchableOpacity style={styles.modalRetryBtn} onPress={fetchProducts}>
                  <Text style={styles.modalRetryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Category Dropdown */}
                <Text style={styles.modalLabel}>Category</Text>
                <TouchableOpacity style={styles.dropdownBtn} onPress={() => setCategoryDropOpen(v => !v)}>
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>{selectedCategory?.categoryName || 'Select Category'}</Text>
                  <Text style={styles.dropdownArrow}>{categoryDropOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {categoryDropOpen && (
                  <View style={styles.dropdownList}>
                    {categories.map((cat, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.dropdownItem, selectedCategory?.categoryName === cat.categoryName && styles.dropdownItemActive]}
                        onPress={() => { setSelectedCategory(cat); setCategoryDropOpen(false); }}
                      >
                        <Text style={[styles.dropdownItemText, selectedCategory?.categoryName === cat.categoryName && styles.dropdownItemTextActive]}>
                          {cat.categoryName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Products List */}
                {!categoryDropOpen && (
                  <>
                    <Text style={styles.modalLabel}>Products</Text>
                    <FlatList
                      data={selectedCategory ? selectedCategory.items : []}
                      keyExtractor={item => item.id}
                      style={styles.productList}
                      showsVerticalScrollIndicator={false}
                      renderItem={({ item }) => {
                        const isSelected = selectedProducts.find(p => p.id === item.id);
                        return (
                          <TouchableOpacity
                            style={[styles.modalProductItem, isSelected && styles.modalProductItemSelected]}
                            onPress={() => toggleProduct(item)}
                          >
                            <View>
                              <Text style={[styles.modalProductName, isSelected && styles.modalProductNameSelected]}>{item.name}</Text>
                              <Text style={[styles.modalProductPrice, isSelected && styles.modalProductPriceSelected]}>₹{item.price}/unit</Text>
                            </View>
                            {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                          </TouchableOpacity>
                        );
                      }}
                    />
                    <TouchableOpacity style={styles.modalDoneBtn} onPress={() => { setModalVisible(false); setCategoryDropOpen(false); }}>
                      <Text style={styles.modalDoneBtnText}>Done  ({selectedProducts.length} selected)</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: StatusBar.currentHeight + 10 || 50,
    paddingBottom: 15, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnInner: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: 'bold',
    marginRight: 2,
  },
  headerTitleContainer: { flex: 1, alignItems: 'flex-start', marginLeft: 12 },
  headerTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 2 },
  shopNameHeader: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  headerRight: { width: 38 },
  mainArea: { flex: 1 },
  mainContent: { padding: 16, paddingBottom: 120 },
  billDetailsSection: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  addProductBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#087E66',
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
  },
  addProductBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  emptyState: {
    height: 110, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5,
    borderColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 10,
  },
  emptyStateIcon: { fontSize: 28, color: '#CBD5E1', marginBottom: 6 },
  emptyStateText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  productRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryGroup: {
    marginBottom: 12,
  },
  categoryGroupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  productRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productName: { fontSize: 13, fontWeight: '500', color: '#64748B', flex: 1, marginRight: 8 },
  itemTotal: { fontSize: 14, fontWeight: '900', color: '#087E66' },
  removeBtnWrap: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center',
  },
  removeBtn: { fontSize: 10, color: '#EF4444', fontWeight: '900' },
  productRowBottom: {
    flexDirection: 'row',
    gap: 12,
  },
  labeledStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  stepBtn: {
    width: 28, height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  stepBtnText: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  stepValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    paddingHorizontal: 4,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 10 },
  bottomAccordion: {
    backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, elevation: 20, zIndex: 20,
  },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  accordionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accordionTitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  accordionTotalValue: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  accordionToggleIcon: { color: '#94A3B8', fontSize: 12 },
  accordionBody: { marginBottom: 15 },
  paymentRow: { flexDirection: 'row', gap: 15 },
  inputGroup: { width: 130 },
  inputGroupFlexible: { flex: 1 },
  inputLabelDark: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 8 },
  amountInputDark: {
    backgroundColor: '#334155', borderRadius: 12, height: 48,
    paddingHorizontal: 15, fontSize: 16, fontWeight: '800', color: '#FFFFFF',
    borderWidth: 1, borderColor: '#475569',
  },
  descriptionRow: {
    marginTop: 12,
  },
  inputGroupFull: {
    width: '100%',
  },
  descriptionInputDark: {
    backgroundColor: '#334155',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#475569',
  },
  typeRow: { gap: 8 },
  typeBtnDark: {
    height: 48, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#334155',
    borderWidth: 1, borderColor: '#475569', justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  typeBtnActiveDark: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  typeBtnTextDark: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  typeBtnTextActiveDark: { color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  balanceLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  balanceValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  billValue: { color: '#087E66', fontSize: 14, fontWeight: '700' },
  paidValue: { color: '#10B981', fontSize: 14, fontWeight: '700' },
  liveBalanceLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  liveBalanceValue: { color: '#10B981', fontSize: 20, fontWeight: '900' },
  negativeBalance: { color: '#EF4444' },
  finishBtn: {
    backgroundColor: '#087E66', borderRadius: 14, height: 56,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  finishBtnDisabled: {
    backgroundColor: '#334155',
    elevation: 0,
  },
  finishBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  modalClose: { fontSize: 18, color: '#94A3B8', fontWeight: '700' },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 4 },
  dropdownBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 13,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8,
  },
  dropdownBtnText: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1, marginRight: 8 },
  dropdownArrow: { fontSize: 11, color: '#64748B', fontWeight: '800' },
  dropdownList: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 14, overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemActive: { backgroundColor: '#E6F2F0' },
  dropdownItemText: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  dropdownItemTextActive: { color: '#087E66', fontWeight: '800' },
  productList: { maxHeight: 340 },
  modalProductItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9',
  },
  modalProductItemSelected: { backgroundColor: '#E6F2F0', borderColor: '#087E66' },
  modalProductName: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  modalProductNameSelected: { color: '#087E66', fontWeight: '700' },
  modalProductPrice: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  modalProductPriceSelected: { color: '#087E66' },
  checkIcon: { fontSize: 14, color: '#087E66', fontWeight: '800' },
  modalDoneBtn: {
    backgroundColor: '#1E293B', borderRadius: 12, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
  },
  modalDoneBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // Loader & Error styling inside modal
  modalLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  modalErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  modalErrorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  modalRetryBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalRetryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default BillingScreen;
