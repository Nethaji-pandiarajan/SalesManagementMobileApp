import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Sidebar from '../../components/Sidebar';
import BottomNav from '../../components/BottomNav';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../../config/config';

const { width } = Dimensions.get('window');

// Placeholder Data
const REVENUE_DATA = {
  daily: { sales: '₹45,000', collected: '₹40,000', pending: '₹5,000' },
  weekly: { sales: '₹3,15,000', collected: '₹2,90,000', pending: '₹25,000' },
  monthly: { sales: '₹12,50,000', collected: '₹11,00,000', pending: '₹1,50,000' },
};

const getStatusColor = (status) => {
  switch (status) {
    case 'On Road': return '#10B981'; // Green
    case 'Active': return '#3B82F6'; // Blue
    case 'Inactive': return '#EF4444'; // Red
    case 'Loading': return '#F59E0B'; // Amber
    case 'Reconciled': return '#6366F1'; // Indigo
    default: return '#6B7280'; // Gray
  }
};

const AdminDashboardScreen = ({ navigation }) => {
  const [timeframe, setTimeframe] = useState('daily');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userData } = useAuth();
  const username = userData?.email?.split('@')[0] || 'Admin';

  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const backendUrl = CONFIG.API_BASE_URL;
      const response = await fetch(`${backendUrl}/api/admin/dashboard-summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setRevenueData(data);
      } else {
        setError(data.error || 'Failed to fetch dashboard summary.');
      }
    } catch (err) {
      console.error('Fetch admin dashboard summary error:', err);
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getVehicleStatus = (vehicle) => {
    if (vehicle.supply_id && vehicle.trip_status === 'OPEN') {
      return 'On Road';
    }
    const stat = (vehicle.vehicle_status || '').toUpperCase();
    if (stat === 'ACTIVE') {
      return 'Active';
    }
    return 'Inactive';
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setIsSidebarOpen(true)}
          >
            <Text style={styles.menuIconText}>☰</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>JO GOLD</Text>
          </View>

          <TouchableOpacity style={styles.profileBtn}>
            <Text style={styles.profileIcon}>{username.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#087E66" />
          <Text style={styles.loadingText}>Loading dashboard summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentSales = revenueData ? formatCurrency(revenueData[timeframe]?.sales) : '₹0';
  const currentCollected = revenueData ? formatCurrency(revenueData[timeframe]?.collected) : '₹0';
  const currentPending = revenueData ? formatCurrency(revenueData[timeframe]?.pending) : '₹0';

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
          <Text style={styles.headerTitle}>JO GOLD</Text>
        </View>

        <TouchableOpacity style={styles.profileBtn} onPress={() => fetchDashboardData()}>
          <Text style={styles.profileIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeName}>Hello, {username}</Text>
          <Text style={styles.welcomeDate}>Executive Dashboard - {currentDate}</Text>
        </View>

        {/* Error Notice Card */}
        {error ? (
          <View style={styles.errorNoticeCard}>
            <Text style={styles.errorNoticeIcon}>⚠️</Text>
            <View style={styles.errorNoticeTextContainer}>
              <Text style={styles.errorNoticeTitle}>Status Warning</Text>
              <Text style={styles.errorNoticeDesc}>{error}</Text>
            </View>
            <TouchableOpacity style={styles.syncBtn} onPress={() => fetchDashboardData()}>
              <Text style={styles.syncBtnText}>🔄</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Revenue Section */}
        <View style={styles.section}>

          <LinearGradient colors={['#087E66', '#055b49']} style={styles.revenueCard}>
            <View style={styles.revenueCardHeader}>
              <Text style={styles.revenueLabel}>Total Sales</Text>
              <View style={styles.timeframeToggle}>
                {['daily', 'weekly', 'monthly'].map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    style={[styles.tfButton, timeframe === tf && styles.tfButtonActive]}
                    onPress={() => setTimeframe(tf)}
                  >
                    <Text style={[styles.tfText, timeframe === tf && styles.tfTextActive]}>
                      {tf.charAt(0).toUpperCase() + tf.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.revenueAmount}>{currentSales}</Text>
            <View style={styles.revenueSplit}>
              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>Cash Collected</Text>
                <Text style={styles.splitValueGreen}>{currentCollected}</Text>
              </View>
              <View style={styles.splitDivider} />
              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>Pending</Text>
                <Text style={styles.splitValueRed}>{currentPending}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Live Vehicle Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Vehicle Status</Text>
          <View style={styles.vehicleGrid}>
            {(revenueData?.vehicles || []).map((vehicle) => {
              const status = getVehicleStatus(vehicle);
              const isOnRoad = status === 'On Road';
              return (
                <View key={vehicle.vehicle_id} style={styles.vehicleCard}>
                  <View style={styles.vehicleHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.vehicleName}>
                        {vehicle.vehicle_name || 'Unnamed Vehicle'}
                      </Text>
                      <Text style={styles.vehicleNoText}>{vehicle.vehicle_no}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '15' }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
                    </View>
                  </View>
                  <View style={styles.vehicleDetailsRow}>
                    <Text style={styles.driverLabel}>
                      👤 Driver: <Text style={styles.driverValue}>{vehicle.driver_name || 'Not Assigned'}</Text>
                    </Text>
                    {isOnRoad && vehicle.supply_id && (
                      <View style={styles.tripBadge}>
                        <Text style={styles.tripBadgeText}>Trip #{vehicle.supply_id}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            {(revenueData?.vehicles || []).length === 0 && (
              <Text style={{ textAlign: 'center', color: '#64748B', paddingVertical: 10 }}>No vehicles registered</Text>
            )}
          </View>
        </View>

        {/* Top 5 Shops */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Top 5 Shops</Text>
          <View style={styles.shopsContainer}>
            {(revenueData?.top_shops || []).map((shop, index) => (
              <View key={shop.shop_id || index} style={styles.shopRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName} numberOfLines={1}>{shop.shop_name}</Text>
                  <Text style={styles.shopDetails} numberOfLines={1}>
                    👤 {shop.owner_name || 'No Owner'} • 📍 {shop.area_name || 'No Area'}
                  </Text>
                </View>
                <Text style={styles.shopVolume}>{formatCurrency(shop.total_sales)}</Text>
              </View>
            ))}
            {(revenueData?.top_shops || []).length === 0 && (
              <Text style={{ textAlign: 'center', color: '#64748B', paddingVertical: 10 }}>No shop transactions recorded yet</Text>
            )}
            {revenueData?.top_shops && revenueData.top_shops.length > 0 && (
              <View style={styles.shopTotalRow}>
                <Text style={styles.shopTotalLabel}>Top 5 Shops Sales Total</Text>
                <Text style={styles.shopTotalValue}>{formatCurrency(revenueData.top_shops_sales_sum)}</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      <BottomNav navigation={navigation} currentRoute="AdminDashboard" />
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  welcomeSection: {
    marginBottom: 16,
    marginTop: 5,
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  welcomeDate: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  lastSection: {
    marginBottom: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 15,
  },
  timeframeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 20,
    padding: 2,
    alignSelf: 'flex-start',
  },
  tfButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tfButtonActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tfText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  tfTextActive: {
    color: '#087E66',
  },
  revenueCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#087E66',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  revenueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#A7F3D0',
    fontWeight: '600',
    marginRight: 12,
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 24,
  },
  revenueSplit: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  splitItem: {
    flex: 1,
  },
  splitLabel: {
    fontSize: 12,
    color: '#A7F3D0',
    marginBottom: 4,
  },
  splitValueGreen: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  splitValueRed: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FECACA',
  },
  splitDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  vehicleGrid: {
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  driverName: {
    fontSize: 13,
    color: '#64748B',
  },
  vehicleNoText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  driverLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  driverValue: {
    fontWeight: '600',
    color: '#334155',
  },
  tripBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tripBadgeText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
  },
  shopInfo: {
    flex: 1,
    marginRight: 10,
  },
  shopDetails: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  shopTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
  },
  shopTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  shopTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#087E66',
  },

  managementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  managementCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  managementIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  managementCardText: {
    flex: 1,
  },
  managementCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  managementCardDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  managementCardArrow: {
    fontSize: 24,
    color: '#087E66',
    fontWeight: '600',
    marginLeft: 10,
  },

  shopsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  shopName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginRight: 10,
  },
  shopVolume: {
    fontSize: 15,
    fontWeight: '700',
    color: '#087E66',
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
  errorNoticeCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorNoticeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  errorNoticeTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  errorNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  errorNoticeDesc: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 16,
  },
  syncBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#991B1B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  syncBtnText: {
    fontSize: 12,
  },
});

export default AdminDashboardScreen;
