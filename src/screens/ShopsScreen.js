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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import CONFIG from '../config/config';

const { width } = Dimensions.get('window');

// Keep globalShopsList exported to prevent import errors in AddShopScreen
export let globalShopsList = [];

const ShopsScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Driver' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [shopsByArea, setShopsByArea] = useState({});
  const [supplyId, setSupplyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssignedShops = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        if (showLoader) setLoading(false);
        return;
      }

      const response = await fetch(`${CONFIG.API_BASE_URL}/api/vehicle/assigned-shops`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setShopsByArea(data.shops_by_area || {});
        setSupplyId(data.supply_id || null);
      } else if (response.status === 404) {
        setError(data.error || 'No active trip assignment found for this driver.');
      } else {
        setError(data.error || 'Failed to fetch assigned shops.');
      }
    } catch (err) {
      console.error('Fetch assigned shops error:', err);
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignedShops();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchAssignedShops(false);
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignedShops(false);
  };

  // Grouped search filtering
  const filteredGroupedShops = Object.entries(shopsByArea).reduce((acc, [area, shopsList]) => {
    const filteredList = shopsList.filter(shop =>
      shop.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const listToDisplay = area.toLowerCase().includes(searchQuery.toLowerCase()) ? shopsList : filteredList;
    if (listToDisplay.length > 0) {
      acc[area] = listToDisplay;
    }
    return acc;
  }, {});

  const hasMatchedShops = Object.keys(filteredGroupedShops).length > 0;

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
          <Text style={styles.headerTitle}>ASSIGNED SHOPS</Text>
        </View>

        <TouchableOpacity
          style={styles.newShopBtn}
          onPress={() => navigation.navigate('AddShop')}
        >
          <Text style={styles.newShopBtnText}>+ New Shop</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops or areas..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1C1C1E" />
            <Text style={styles.loadingText}>Loading assigned shops...</Text>
          </View>
        ) : error ? (
          <ScrollView
            contentContainerStyle={styles.errorContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E293B']} />
            }
          >
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAssignedShops(true)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E293B']} />
            }
          >
            {Object.entries(filteredGroupedShops).map(([area, shopsList]) => (
              <View key={area} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>📍</Text>
                  <Text style={styles.sectionTitle}>{area.toUpperCase()}</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{shopsList.length}</Text>
                  </View>
                </View>

                {shopsList.map((shop) => (
                  <TouchableOpacity
                    key={shop.shop_id}
                    style={styles.shopCard}
                    onPress={() => navigation.navigate('Billing', {
                      shop: {
                        id: shop.shop_id,
                        shop_id: shop.shop_id,
                        shopName: shop.shop_name,
                        shop_name: shop.shop_name,
                        areaName: area,
                        area_name: area,
                        balance: shop.pending_balance || 0,
                        status: shop.status === 'ACTIVE' ? 'Active' : 'Inactive',
                        ...shop
                      },
                      supply_id: supplyId,
                    })}
                  >
                    <View style={styles.shopInfo}>
                      <View style={styles.shopIconBox}>
                        <Text style={styles.shopIcon}>🏬</Text>
                      </View>
                      <View style={styles.shopDetails}>
                        <Text style={styles.shopName} numberOfLines={1}>{shop.shop_name}</Text>
                        {shop.owner_name ? (
                          <Text style={styles.shopDetailItem} numberOfLines={1}>
                            👤 <Text style={styles.shopDetailValue}>{shop.owner_name}</Text>
                          </Text>
                        ) : null}
                        {shop.phone ? (
                          <Text style={styles.shopDetailItem} numberOfLines={1}>
                            📞 <Text style={styles.shopDetailValue}>{shop.phone}</Text>
                          </Text>
                        ) : null}
                        {shop.address ? (
                          <Text style={styles.shopDetailItem} numberOfLines={1}>
                            🏠 <Text style={styles.shopDetailValue}>{shop.address}, {shop.city || ''}</Text>
                          </Text>
                        ) : null}
                        {shop.pending_balance !== undefined && shop.pending_balance !== null ? (
                          <Text style={styles.shopDetailItem} numberOfLines={1}>
                            💰 Balance: <Text style={[
                              styles.shopDetailValue,
                              shop.pending_balance > 0 ? styles.balanceDueText : styles.balanceCleanText
                            ]}>₹{shop.pending_balance.toLocaleString('en-IN')}</Text>
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.cardRight}>
                      <View style={styles.statusDotContainer}>
                        <View style={[
                          styles.statusDot,
                          shop.status?.toUpperCase() === 'ACTIVE' ? styles.statusActive : styles.statusInactive
                        ]} />
                      </View>
                      <View style={styles.arrowIcon}>
                        <Text style={styles.arrowText}>❯</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {!hasMatchedShops && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏢</Text>
                <Text style={styles.emptyText}>No assigned shops found</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <BottomNav navigation={navigation} currentRoute="Shops" />
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
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 1,
  },
  newShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  newShopBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
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
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  sectionBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  shopIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  shopIcon: {
    fontSize: 20,
  },
  shopDetails: {
    flex: 1,
    paddingRight: 8,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  shopDetailItem: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  shopDetailValue: {
    color: '#475569',
    fontWeight: '500',
  },
  arrowIcon: {
    opacity: 0.2,
  },
  arrowText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDotContainer: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusInactive: {
    backgroundColor: '#EF4444',
  },
  balanceDueText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  balanceCleanText: {
    color: '#10B981',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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

export default ShopsScreen;
