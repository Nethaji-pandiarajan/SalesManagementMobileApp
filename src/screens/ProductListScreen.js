import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

const categoryProducts = {
  'Jo gold chekku gingelly oil': [
    { productId: 'JG-G-1L-B', sku_code: 'JG-G-1L-B', productName: '1 ltr bottle', unit: 'Liter', rate: 180, status: 'Active' },
    { productId: 'JG-G-500-B', sku_code: 'JG-G-500-B', productName: '500 ml bottle', unit: '500ml', rate: 95, status: 'Active' },
    { productId: 'JG-G-200-B', sku_code: 'JG-G-200-B', productName: '200 ml bottle', unit: '200ml', rate: 40, status: 'Active' },
    { productId: 'JG-G-100-B', sku_code: 'JG-G-100-B', productName: '100 ml bottle', unit: '100ml', rate: 22, status: 'Active' },
    { productId: 'JG-G-1L-P', sku_code: 'JG-G-1L-P', productName: '1 ltr pouch', unit: 'Liter', rate: 175, status: 'Active' },
    { productId: 'JG-G-500-P', sku_code: 'JG-G-500-P', productName: '500 ml pouch', unit: '500ml', rate: 90, status: 'Active' },
    { productId: 'JG-G-100-P', sku_code: 'JG-G-100-P', productName: '100 ml pouch', unit: '100ml', rate: 20, status: 'Active' },
    { productId: 'JG-G-50-P', sku_code: 'JG-G-50-P', productName: '50 ml pouch', unit: '50ml', rate: 12, status: 'Active' },
    { productId: 'JG-G-5L-C', sku_code: 'JG-G-5L-C', productName: '5 ltr can', unit: '5 Liters', rate: 850, status: 'Active' },
    { productId: 'JG-G-15K-T', sku_code: 'JG-G-15K-T', productName: '15 kg Tin', unit: '15 kg', rate: 2500, status: 'Active' },
    { productId: 'JG-G-40K-OC', sku_code: 'JG-G-40K-OC', productName: '40 kg oil cake', unit: '40 kg', rate: 1200, status: 'Active' },
    { productId: 'JG-G-50K-OC', sku_code: 'JG-G-50K-OC', productName: '50 kg oil cake', unit: '50 kg', rate: 1500, status: 'Active' },
    { productId: 'JG-G-40K-GOC', sku_code: 'JG-G-40K-GOC', productName: '40 kg grinded oil cake', unit: '40 kg', rate: 1300, status: 'Active' },
    { productId: 'JG-G-50K-GOC', sku_code: 'JG-G-50K-GOC', productName: '50 kg grinded oil cake', unit: '50 kg', rate: 1600, status: 'Active' },
  ],
  'Sri Lakshmi chekku gingelly oil': [
    { productId: 'SL-G-1L-B', sku_code: 'SL-G-1L-B', productName: '1 ltr bottle', unit: 'Liter', rate: 170, status: 'Active' },
    { productId: 'SL-G-500-B', sku_code: 'SL-G-500-B', productName: '500 ml bottle', unit: '500ml', rate: 85, status: 'Active' },
    { productId: 'SL-G-5L-C', sku_code: 'SL-G-5L-C', productName: '5 ltr can', unit: '5 Liters', rate: 800, status: 'Active' },
    { productId: 'SL-G-15K-T', sku_code: 'SL-G-15K-T', productName: '15 kg Tin', unit: '15 kg', rate: 2400, status: 'Active' },
  ],
  'Jo gold chekku groundnut oil': [
    { productId: 'JG-GN-1L-B', sku_code: 'JG-GN-1L-B', productName: '1 ltr bottle', unit: 'Liter', rate: 160, status: 'Active' },
    { productId: 'JG-GN-500-B', sku_code: 'JG-GN-500-B', productName: '500 ml bottle', unit: '500ml', rate: 85, status: 'Active' },
    { productId: 'JG-GN-5L-C', sku_code: 'JG-GN-5L-C', productName: '5 ltr can', unit: '5 Liters', rate: 780, status: 'Active' },
    { productId: 'JG-GN-15K-T', sku_code: 'JG-GN-15K-T', productName: '15 kg Tin', unit: '15 kg', rate: 2300, status: 'Active' },
    { productId: 'JG-GN-50K-OC', sku_code: 'JG-GN-50K-OC', productName: '50 kg oil cake', unit: '50 kg', rate: 1400, status: 'Active' },
  ],
  'Maha gold deepam oil': [
    { productId: 'MG-D-1L-B', sku_code: 'MG-D-1L-B', productName: '1 ltr bottle', unit: 'Liter', rate: 120, status: 'Active' },
    { productId: 'MG-D-500-B', sku_code: 'MG-D-500-B', productName: '500 ml bottle', unit: '500ml', rate: 65, status: 'Active' },
    { productId: 'MG-D-200-B', sku_code: 'MG-D-200-B', productName: '200 ml bottle', unit: '200ml', rate: 30, status: 'Active' },
    { productId: 'MG-D-100-B', sku_code: 'MG-D-100-B', productName: '100 ml bottle', unit: '100ml', rate: 18, status: 'Active' },
    { productId: 'MG-D-15K-T', sku_code: 'MG-D-15K-T', productName: '15 kg Tin', unit: '15 kg', rate: 1800, status: 'Active' },
  ],
};

const ProductListScreen = ({ navigation, route }) => {
  const { category, username } = route.params || { category: { categoryName: 'Products' }, username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial products from dictionary
  const [products, setProducts] = useState(categoryProducts[category.categoryName] || []);

  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        username={username}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backBtnInner}>
            <Text style={styles.backBtnText}>❮</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{category.categoryName.toUpperCase()}</Text>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('AddProduct', { categoryId: category.categoryId })}
        >
          <Text style={styles.newBtnText}>+ New Product</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {filteredProducts.map((product) => (
            <View key={product.productId} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.productIconContainer}>
                  <Text style={styles.productIcon}>💧</Text>
                </View>
                <Text style={styles.name} numberOfLines={2}>{product.productName}</Text>
              </View>

              <View style={styles.cardRight}>
                <View style={styles.priceInfo}>
                  <Text style={styles.rate}>₹{product.rate}</Text>
                  <Text style={styles.unit}>/ {product.unit}</Text>
                </View>
                <View style={[styles.statusDot, product.status === 'Active' ? styles.statusActiveDot : styles.statusInactiveDot]} />
                <TouchableOpacity
                  style={styles.actionEditBtn}
                  onPress={() => navigation.navigate('AddProduct', { product })}
                >
                  <Text style={styles.actionEditIcon}>✎</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filteredProducts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <BottomNav navigation={navigation} currentRoute="ProductManagement" />
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
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight + 10 || 50,
    paddingBottom: 15,
    backgroundColor: '#087E66',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 2,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#087E66',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#64748B',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  productIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  productIcon: {
    fontSize: 16,
  },
  productMeta: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
  },
  sku: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  unit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  rate: {
    fontSize: 16,
    fontWeight: '900',
    color: '#087E66',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActiveDot: {
    backgroundColor: '#10B981',
  },
  statusInactiveDot: {
    backgroundColor: '#EF4444',
  },
  actionEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionEditIcon: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
    opacity: 0.2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
});

export default ProductListScreen;
