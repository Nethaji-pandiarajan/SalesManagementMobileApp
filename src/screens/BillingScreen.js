import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const BillingScreen = ({ navigation, route }) => {
  const { shop } = route.params;
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');

  // Mock Products (In a real app, these would come from the inventory)
  const products = [
    { id: 'P001', name: 'JO GOLD 1L', rate: 12 },
    { id: 'P002', name: 'JO GOLD 500ml', rate: 6.5 },
    { id: 'P003', name: 'JO GOLD 2L', rate: 22 },
  ];

  const toggleProduct = (product) => {
    const exists = selectedProducts.find(p => p.id === product.id);
    if (exists) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1, currentRate: product.rate }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setSelectedProducts(selectedProducts.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };

  const updateRate = (id, rate) => {
    setSelectedProducts(selectedProducts.map(p => {
      if (p.id === id) {
        return { ...p, currentRate: parseFloat(rate) || 0 };
      }
      return p;
    }));
  };

  const calculateTotalBill = () => {
    return selectedProducts.reduce((sum, p) => sum + (p.quantity * p.currentRate), 0);
  };

  const totalBill = calculateTotalBill();
  const currentPaid = parseFloat(paidAmount) || 0;
  const liveBalance = (shop.balance + totalBill) - currentPaid;

  const handleFinish = () => {
    if (selectedProducts.length === 0 && currentPaid === 0) {
      Alert.alert('Empty Bill', 'Please add products or record a payment.');
      return;
    }
    Alert.alert('Success', 'Bill generated and balance updated!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>BILLING</Text>
          <Text style={styles.shopNameHeader}>{shop.shopName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Balance Overview */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Previous Balance</Text>
            <Text style={styles.balanceValue}>${shop.balance.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Current Bill</Text>
            <Text style={styles.billValue}>+ ${totalBill.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Amount Paid</Text>
            <Text style={styles.paidValue}>- ${currentPaid.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.balanceRow}>
            <Text style={styles.liveBalanceLabel}>New Balance</Text>
            <Text style={[styles.liveBalanceValue, liveBalance > 0 && styles.negativeBalance]}>
              ${liveBalance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Product Picker */}
        <Text style={styles.sectionTitle}>Pick Products</Text>
        <View style={styles.pickerContainer}>
          {products.map(p => {
            const isSelected = selectedProducts.find(sp => sp.id === p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                onPress={() => toggleProduct(p)}
              >
                <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                  {p.name}
                </Text>
                <Text style={[styles.pickerRate, isSelected && styles.pickerRateSelected]}>
                  ${p.rate}/unit
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Products Details */}
        {selectedProducts.length > 0 && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Bill Details</Text>
            {selectedProducts.map(p => (
              <View key={p.id} style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <View style={styles.rateInputRow}>
                    <Text style={styles.rateLabel}>Rate: $</Text>
                    <TextInput
                      style={styles.rateInput}
                      keyboardType="numeric"
                      value={p.currentRate.toString()}
                      onChangeText={(val) => updateRate(p.id, val)}
                    />
                  </View>
                </View>
                <View style={styles.qtyContainer}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(p.id, -1)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{p.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(p.id, 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.totalItemContainer}>
                  <Text style={styles.itemTotal}>${(p.quantity * p.currentRate).toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Payment Options */}
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.paymentCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Paid Amount ($)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={paidAmount}
              onChangeText={setPaidAmount}
            />
          </View>
          
          <Text style={styles.inputLabel}>Payment Type</Text>
          <View style={styles.typeRow}>
            {['Cash', 'UPI', 'Cheque'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeBtn, paymentType === type && styles.typeBtnActive]}
                onPress={() => setPaymentType(type)}
              >
                <Text style={[styles.typeBtnText, paymentType === type && styles.typeBtnTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishBtnText}>Finish Transaction</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 10 || 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 24,
    color: '#1E293B',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 2,
  },
  shopNameHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerRight: {
    width: 44,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  billValue: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  },
  paidValue: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  liveBalanceLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  liveBalanceValue: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '900',
  },
  negativeBalance: {
    color: '#EF4444',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 15,
    marginTop: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 25,
  },
  pickerItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: (width - 60) / 2,
  },
  pickerItemSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  pickerItemTextSelected: {
    color: '#FFFFFF',
  },
  pickerRate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pickerRateSelected: {
    color: '#DBEAFE',
  },
  detailsContainer: {
    marginBottom: 25,
  },
  productRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rateLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  rateInput: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '700',
    padding: 0,
    minWidth: 40,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '800',
    marginHorizontal: 12,
    color: '#1E293B',
  },
  totalItemContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#1E293B',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  finishBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 18,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default BillingScreen;
