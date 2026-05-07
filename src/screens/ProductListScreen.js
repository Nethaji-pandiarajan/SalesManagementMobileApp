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

const ProductListScreen = ({ navigation, route }) => {
  const { category, username } = route.params || { category: { categoryName: 'Products' }, username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Data for Products
  const [products, setProducts] = useState([
    { productId: '1', sku_code: 'SKU001', productName: 'Apple Juice', unit: 'Liter', rate: 45, status: 'Active' },
    { productId: '2', sku_code: 'SKU002', productName: 'Orange Juice', unit: 'Liter', rate: 50, status: 'Active' },
    { productId: '3', sku_code: 'SKU003', productName: 'Water Bottle', unit: '500ml', rate: 20, status: 'Inactive' },
  ]);

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
            <Text style={styles.backBtnText}>←</Text>
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
              <View style={styles.cardInfo}>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>📦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{product.productName}</Text>
                    <View style={styles.cardRight}>
                      <View style={[styles.statusDot, product.status === 'Active' ? styles.statusActive : styles.statusInactive]} />
                      <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('AddProduct', { product })}>
                        <Text style={styles.editIcon}>✎</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.sku}>SKU: {product.sku_code}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.unit}>{product.unit}</Text>
                    <Text style={styles.rate}>₹{product.rate}</Text>
                  </View>
                </View>
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
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 10 || 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 20,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 1,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  newBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 56,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    fontSize: 24,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginLeft: 10,
  },
  editIcon: {
    fontSize: 14,
    color: '#64748B',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sku: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  unit: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  rate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#087E66',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusActive: {
    backgroundColor: '#10B981', // Green
  },
  statusInactive: {
    backgroundColor: '#EF4444', // Red
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
