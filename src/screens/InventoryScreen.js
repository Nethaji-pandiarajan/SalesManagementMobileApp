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

const { width } = Dimensions.get('window');

const InventoryScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Data for Van Inventory
  const inventoryData = [
    { productId: 'P001', skuId: 'SKU-JG-1L', productName: 'JO GOLD 1L Bottle', quantityLoaded: 450, ratePerUnit: '$12.00' },
    { productId: 'P002', skuId: 'SKU-JG-500', productName: 'JO GOLD 500ml', quantityLoaded: 320, ratePerUnit: '$6.50' },
    { productId: 'P003', skuId: 'SKU-JG-2L', productName: 'JO GOLD 2L Premium', quantityLoaded: 280, ratePerUnit: '$22.00' },
    { productId: 'P004', skuId: 'SKU-JG-CAN', productName: 'JO GOLD 5L Can', quantityLoaded: 150, ratePerUnit: '$45.00' },
    { productId: 'P005', skuId: 'SKU-JG-SACK', productName: 'JO GOLD 10L Sack', quantityLoaded: 80, ratePerUnit: '$85.00' },
  ];

  const filteredInventory = inventoryData.filter(item =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.skuId.toLowerCase().includes(searchQuery.toLowerCase())
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
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setIsSidebarOpen(true)}
        >
          <Text style={styles.menuIconText}>☰</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>VAN INVENTORY</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or SKU..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>🚛 Currently loaded in Van</Text>
          <Text style={styles.itemCount}>{filteredInventory.length} Items</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredInventory.map((item, index) => (
            <View key={item.productId} style={styles.inventoryCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.skuText}>{item.skuId}</Text>
                  <Text style={styles.productName}>{item.productName}</Text>
                </View>
                <View style={styles.idBadge}>
                  <Text style={styles.idText}>{item.productId}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>LOADED QTY</Text>
                  <Text style={styles.footerValue}>{item.quantityLoaded}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>RATE / UNIT</Text>
                  <Text style={styles.rateValue}>{item.ratePerUnit}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>TOTAL VALUE</Text>
                  <Text style={styles.totalValue}>
                    ${(parseFloat(item.ratePerUnit.replace('$', '')) * item.quantityLoaded).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          
          {filteredInventory.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No items found in inventory</Text>
            </View>
          )}
        </ScrollView>
      </View>
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
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconText: {
    fontSize: 24,
    color: '#1E293B',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 1,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 56,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  skuText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  idBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  idText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    alignItems: 'flex-start',
  },
  footerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
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

export default InventoryScreen;
