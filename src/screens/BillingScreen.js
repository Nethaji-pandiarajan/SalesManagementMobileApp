import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Alert, LayoutAnimation, Platform,
  UIManager, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const inventoryCategories = [
  {
    categoryName: 'Jo gold chekku gingelly oil',
    items: [
      { id: 'JG-G-1L-B', name: '1 ltr bottle', price: 180 },
      { id: 'JG-G-500-B', name: '500 ml bottle', price: 95 },
      { id: 'JG-G-200-B', name: '200 ml bottle', price: 40 },
      { id: 'JG-G-100-B', name: '100 ml bottle', price: 22 },
      { id: 'JG-G-1L-P', name: '1 ltr pouch', price: 175 },
      { id: 'JG-G-500-P', name: '500 ml pouch', price: 90 },
      { id: 'JG-G-100-P', name: '100 ml pouch', price: 20 },
      { id: 'JG-G-50-P', name: '50 ml pouch', price: 12 },
      { id: 'JG-G-5L-C', name: '5 ltr can', price: 850 },
      { id: 'JG-G-15K-T', name: '15 kg Tin', price: 2500 },
      { id: 'JG-G-40K-OC', name: '40 kg oil cake', price: 1200 },
      { id: 'JG-G-50K-OC', name: '50 kg oil cake', price: 1500 },
      { id: 'JG-G-40K-GOC', name: '40 kg grinded oil cake', price: 1300 },
      { id: 'JG-G-50K-GOC', name: '50 kg grinded oil cake', price: 1600 },
    ],
  },
  {
    categoryName: 'Sri Lakshmi chekku gingelly oil',
    items: [
      { id: 'SL-G-1L-B', name: '1 ltr bottle', price: 170 },
      { id: 'SL-G-500-B', name: '500 ml bottle', price: 85 },
      { id: 'SL-G-5L-C', name: '5 ltr can', price: 800 },
      { id: 'SL-G-15K-T', name: '15 kg Tin', price: 2400 },
    ],
  },
  {
    categoryName: 'Jo gold chekku groundnut oil',
    items: [
      { id: 'JG-GN-1L-B', name: '1 ltr bottle', price: 160 },
      { id: 'JG-GN-500-B', name: '500 ml bottle', price: 85 },
      { id: 'JG-GN-5L-C', name: '5 ltr can', price: 780 },
      { id: 'JG-GN-15K-T', name: '15 kg Tin', price: 2300 },
      { id: 'JG-GN-50K-OC', name: '50 kg oil cake', price: 1400 },
    ],
  },
  {
    categoryName: 'Maha gold deepam oil',
    items: [
      { id: 'MG-D-1L-B', name: '1 ltr bottle', price: 120 },
      { id: 'MG-D-500-B', name: '500 ml bottle', price: 65 },
      { id: 'MG-D-200-B', name: '200 ml bottle', price: 30 },
      { id: 'MG-D-100-B', name: '100 ml bottle', price: 18 },
      { id: 'MG-D-15K-T', name: '15 kg Tin', price: 1800 },
    ],
  },
];

const BillingScreen = ({ navigation, route }) => {
  const { shop } = route.params || { shop: { shopName: 'Test Shop', balance: 1200 } };

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [isBalanceExpanded, setIsBalanceExpanded] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(inventoryCategories[0]);
  const [categoryDropOpen, setCategoryDropOpen] = useState(false);

  const toggleProduct = (product) => {
    const exists = selectedProducts.find(p => p.id === product.id);
    if (exists) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      // find which category this product belongs to
      const cat = inventoryCategories.find(c => c.items.some(i => i.id === product.id));
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
  const liveBalance = shop.balance + totalBill - currentPaid;

  const handleFinish = () => {
    if (selectedProducts.length === 0 && currentPaid === 0) {
      Alert.alert('Empty Bill', 'Please add products or record a payment.');
      return;
    }
    Alert.alert('Success', 'Bill generated and balance updated!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
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
          <Text style={styles.backBtnText}>‹</Text>
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
            <View style={styles.divider} />
            <View style={styles.balanceRow}><Text style={styles.balanceLabel}>Previous Balance</Text><Text style={styles.balanceValue}>₹{shop.balance.toLocaleString()}</Text></View>
            <View style={styles.balanceRow}><Text style={styles.balanceLabel}>Current Bill</Text><Text style={styles.billValue}>+ ₹{totalBill.toLocaleString()}</Text></View>
            <View style={styles.balanceRow}><Text style={styles.balanceLabel}>Amount Paid</Text><Text style={styles.paidValue}>- ₹{currentPaid.toLocaleString()}</Text></View>
            <View style={styles.divider} />
            <View style={styles.balanceRow}>
              <Text style={styles.liveBalanceLabel}>New Balance</Text>
              <Text style={[styles.liveBalanceValue, liveBalance > 0 && styles.negativeBalance]}>₹{liveBalance.toLocaleString()}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishBtnText}>Finish Transaction</Text>
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

            {/* Category Dropdown */}
            <Text style={styles.modalLabel}>Category</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setCategoryDropOpen(v => !v)}>
              <Text style={styles.dropdownBtnText} numberOfLines={1}>{selectedCategory.categoryName}</Text>
              <Text style={styles.dropdownArrow}>{categoryDropOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {categoryDropOpen && (
              <View style={styles.dropdownList}>
                {inventoryCategories.map((cat, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dropdownItem, selectedCategory.categoryName === cat.categoryName && styles.dropdownItemActive]}
                    onPress={() => { setSelectedCategory(cat); setCategoryDropOpen(false); }}
                  >
                    <Text style={[styles.dropdownItemText, selectedCategory.categoryName === cat.categoryName && styles.dropdownItemTextActive]}>
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
                  data={selectedCategory.items}
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
    paddingHorizontal: 20, paddingTop: StatusBar.currentHeight + 10 || 50,
    paddingBottom: 15, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { fontSize: 20, color: '#1E293B', fontWeight: '700', lineHeight: 22 },
  headerTitleContainer: { flex: 1, alignItems: 'flex-start', marginLeft: 12 },
  headerTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 2 },
  shopNameHeader: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  headerRight: { width: 36 },
  mainArea: { flex: 1 },
  mainContent: { padding: 20, paddingBottom: 120 },
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
});

export default BillingScreen;
