import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import CONFIG from '../config/config';

const { width } = Dimensions.get('window');

const InventoryScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Driver' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const backendUrl = CONFIG.API_BASE_URL;
      const response = await fetch(`${backendUrl}/api/vehicle/inventory`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setInventoryData(data);
      } else {
        setError(data.error || 'Failed to fetch inventory.');
      }
    } catch (err) {
      console.error('Fetch inventory error:', err);
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchInventory();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (inventoryData?.categories) {
      setExpandedCategories(prev => {
        const next = { ...prev };
        inventoryData.categories.forEach(cat => {
          if (next[cat.category_name] === undefined) {
            next[cat.category_name] = true;
          }
        });
        return next;
      });
    }
  }, [inventoryData]);

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const filteredCategories = useMemo(() => {
    if (!inventoryData?.categories) return [];
    if (!searchQuery.trim()) return inventoryData.categories;

    return inventoryData.categories.map(cat => {
      const isCatMatch = cat.category_name.toLowerCase().includes(searchQuery.toLowerCase());
      if (isCatMatch) return cat;
      
      const matchedProducts = cat.products.filter(prod => 
        prod.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.sku_code && prod.sku_code.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      return {
        ...cat,
        products: matchedProducts
      };
    }).filter(cat => cat.products.length > 0);
  }, [inventoryData, searchQuery]);

  const totalItemsCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.products.length, 0);
  }, [filteredCategories]);

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
          <Text style={styles.headerTitle}>VEHICLE INVENTORY</Text>
        </View>

        <TouchableOpacity style={styles.profileBtn} onPress={fetchInventory}>
          <Text style={styles.profileIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#087E66" />
          <Text style={styles.loadingText}>Loading vehicle inventory...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContent}>
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>🚚</Text>
            <Text style={styles.errorTitle}>Trip Status</Text>
            <Text style={styles.errorText}>
              {error.includes('No active trip')
                ? 'You do not have any active trip or vehicle assigned at the moment. Please contact your supervisor to assign a trip.'
                : error}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchInventory} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry / Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Vehicle Info Card */}
          {inventoryData?.vehicle && (
            <View style={styles.vehicleInfoCard}>
              <View style={styles.vehicleInfoRow}>
                <View>
                  <Text style={styles.vehicleNoText}>{inventoryData.vehicle.vehicle_no}</Text>
                  <Text style={styles.vehicleNameText}>{inventoryData.vehicle.vehicle_name || 'Assigned Vehicle'}</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateLabelText}>Trip Date</Text>
                  <Text style={styles.dateValText}>
                    {inventoryData.date ? new Date(inventoryData.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'Today'}
                  </Text>
                </View>
              </View>
              <View style={styles.vehicleInfoFooter}>
                <Text style={styles.totalValueLabel}>Total Manifest Value:</Text>
                <Text style={styles.totalValueAmount}>₹{inventoryData.grand_total_value?.toLocaleString('en-IN') || '0'}</Text>
              </View>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search categories or products..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>📦 Loaded Stock Manifest</Text>
            <Text style={styles.itemCount}>{totalItemsCount} Products</Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          >
            {filteredCategories.map((category, index) => (
              <View key={category.category_id || index} style={styles.categorySection}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleCategory(category.category_name)}
                >
                  <Text style={styles.categoryTitle}>{category.category_name}</Text>
                  <Text style={styles.accordionIcon}>
                    {expandedCategories[category.category_name] ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {expandedCategories[category.category_name] && category.products.map((item) => (
                  <View key={item.product_id} style={styles.inventoryCard}>
                    <View style={styles.cardMain}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.product_name}</Text>
                        <View style={styles.metaRow}>
                          {item.sku_code ? <Text style={styles.skuText}>{item.sku_code} • </Text> : null}
                          <Text style={styles.skuText}>Rate: ₹{item.rate} / {item.unit || 'unit'}</Text>
                        </View>
                      </View>
                      <View style={styles.stockInfo}>
                        <Text style={styles.stockQty}>{item.quantity_loaded} {item.unit || 'units'}</Text>
                        <Text style={styles.totalValue}>
                          ₹{(item.total_price || (item.rate * item.quantity_loaded)).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {filteredCategories.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>No matching products found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      <BottomNav navigation={navigation} currentRoute="Inventory" />
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconText: {
    fontSize: 20,
    color: '#1E293B',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 1,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  errorContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#087E66',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#087E66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  vehicleInfoCard: {
    backgroundColor: '#087E66',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#087E66',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  vehicleNoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vehicleNameText: {
    fontSize: 13,
    color: '#A7F3D0',
    fontWeight: '600',
    marginTop: 2,
  },
  dateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateLabelText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A7F3D0',
    textTransform: 'uppercase',
  },
  dateValText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  vehicleInfoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalValueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A7F3D0',
  },
  totalValueAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 12,
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
  infoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  itemCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#087E66',
    backgroundColor: '#E6F2F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listContainer: { paddingHorizontal: 0, paddingBottom: 20 },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F2F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#087E66',
  },
  accordionIcon: {
    fontSize: 11,
    color: '#087E66',
    fontWeight: '800',
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#087E66',
    textTransform: 'uppercase',
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    paddingRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skuText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stockInfo: {
    alignItems: 'flex-end',
  },
  stockQty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#087E66',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
});

export default InventoryScreen;
