import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
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

const DashboardScreen = ({ route, navigation }) => {
  const { username } = route.params || { username: 'Driver' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Dynamic current date
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const fetchDashboardData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        if (showLoader) setLoading(false);
        return;
      }

      const backendUrl = CONFIG.API_BASE_URL;
      const response = await fetch(`${backendUrl}/api/vehicle/dashboard-summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setDashboardData(data);
      } else {
        setError(data.error || 'Failed to fetch dashboard summary.');
      }
    } catch (err) {
      console.error('Fetch dashboard summary error:', err);
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData(false);
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(false);
  };

  // Stats Grid calculation
  const stats = useMemo(() => {
    if (!dashboardData?.stats) {
      return [
        { label: 'Total Stocks', value: '0', icon: '⊞' },
        { label: 'Sold Stocks', value: '0', icon: '⇱' },
        { label: 'Total Invoices', value: '0', icon: '◈' },
        { label: 'Total Sales', value: '₹0', icon: '₹' },
      ];
    }
    return [
      { 
        label: 'Total Stocks', 
        value: dashboardData.stats.total_stocks_loaded?.toLocaleString('en-IN') || '0', 
        icon: '⊞' 
      },
      { 
        label: 'Sold Stocks', 
        value: dashboardData.stats.total_stocks_sold?.toLocaleString('en-IN') || '0', 
        icon: '⇱' 
      },
      { 
        label: 'Total Invoices', 
        value: dashboardData.stats.total_sales_count?.toString() || '0', 
        icon: '◈' 
      },
      { 
        label: 'Total Sales', 
        value: `₹${dashboardData.stats.total_sales_amount?.toLocaleString('en-IN') || '0'}`, 
        icon: '₹' 
      },
    ];
  }, [dashboardData]);

  // Dynamic stock list (slice to top 5)
  const currentStocks = useMemo(() => {
    return dashboardData?.stocks_summary || [];
  }, [dashboardData]);

  const getStockStatus = (qty) => {
    if (qty <= 0) return { label: 'Out of Stock', color: '#EF4444' };
    if (qty < 10) return { label: 'Low Stock', color: '#F59E0B' };
    return { label: 'In Stock', color: '#10B981' };
  };

  // Dynamic areas covered list — only show assigned areas
  const areas = useMemo(() => {
    const breakdown = dashboardData?.area_coverage_summary?.breakdown || [];
    return breakdown.filter(a => a.is_assigned);
  }, [dashboardData]);

  const getAreaPerformance = (area) => {
    if (area.sales_count === 0) {
      return {
        label: area.is_assigned ? 'Pending' : 'No Sales',
        color: '#64748B',
        bgColor: '#F1F5F9'
      };
    }
    if (area.coverage_percentage >= 50) {
      return {
        label: 'High',
        color: '#10B981',
        bgColor: '#ECFDF5'
      };
    }
    return {
      label: 'Medium',
      color: '#087E66',
      bgColor: '#E6F2F0'
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => setIsSidebarOpen(true)}>
            <Text style={styles.menuIconText}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{dashboardData?.organization_name || 'JO GOLD'}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#087E66" />
          <Text style={styles.loadingText}>Loading dashboard summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>{dashboardData?.organization_name || 'JO GOLD'}</Text>
        </View>

        <TouchableOpacity style={styles.profileBtn} onPress={() => fetchDashboardData()}>
          <Text style={styles.profileIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#087E66']} />
        }
      >
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeaderRow}>
            <View>
              <Text style={styles.welcomeName}>Hello, {username}</Text>
              <Text style={styles.welcomeDate}>{currentDate}</Text>
            </View>
            {dashboardData?.vehicle && (
              <View style={styles.vehicleBadge}>
                <Text style={styles.vehicleBadgeLabel}>Active Vehicle</Text>
                <Text style={styles.vehicleBadgeNo}>{dashboardData.vehicle.vehicle_no}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Warning Notice Card if No Active Trip */}
        {error ? (
          <View style={styles.errorNoticeCard}>
            <Text style={styles.errorNoticeIcon}>🚚</Text>
            <View style={styles.errorNoticeTextContainer}>
              <Text style={styles.errorNoticeTitle}>Trip Status Warning</Text>
              <Text style={styles.errorNoticeDesc}>
                {error.includes('No active trip')
                  ? 'You do not have any active trip or vehicle assigned at the moment. Please contact your supervisor to assign a trip.'
                  : error}
              </Text>
            </View>
            <TouchableOpacity style={styles.syncBtn} onPress={() => fetchDashboardData()}>
              <Text style={styles.syncBtnText}>🔄</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((item, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.cardContent}>
                <View style={styles.iconBox}>
                  <Text style={styles.cardIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Current Stocks Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Stocks Summary</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Inventory')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          {currentStocks.slice(0, 5).map((item, index) => {
            const statusInfo = getStockStatus(item.quantity_remaining);
            return (
              <View key={item.product_id || index} style={[styles.summaryItem, index === Math.min(currentStocks.length, 5) - 1 && styles.noBorder]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                  <View style={styles.itemMetaRow}>
                    {item.sku_code ? <Text style={styles.itemSkuText}>{item.sku_code} • </Text> : null}
                    <Text style={[styles.itemStatus, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemQty}>{item.quantity_remaining} {item.unit || 'units'}</Text>
              </View>
            );
          })}

          {currentStocks.length === 0 && (
            <View style={styles.emptyStocksBox}>
              <Text style={styles.emptyStocksIcon}>📦</Text>
              <Text style={styles.emptyStocksText}>No stocks loaded on active vehicle</Text>
            </View>
          )}
        </View>

        {/* Areas to be Covered */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Areas to be Covered</Text>
        </View>

        <View style={styles.areasContainer}>
          {areas.map((area, index) => {
            const perf = getAreaPerformance(area);
            return (
              <TouchableOpacity key={area.area_name || index} style={styles.areaCard} activeOpacity={0.8}>
                <View style={styles.areaHeader}>
                  <View>
                    <Text style={styles.areaName}>{area.area_name}</Text>
                    {!area.is_assigned && <Text style={styles.unassignedLabel}>Unassigned Route</Text>}
                  </View>
                  <Text style={[styles.areaPerformance, { color: perf.color, backgroundColor: perf.bgColor }]}>
                    {perf.label}
                  </Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, area.coverage_percentage))}%` }]} />
                </View>
                <View style={styles.areaFooter}>
                  <Text style={styles.coverageText}>Coverage: {area.coverage_percentage}%</Text>
                  {area.sales_count > 0 && (
                    <Text style={styles.areaSalesText}>
                      ₹{area.sales_amount.toLocaleString('en-IN')} ({area.sales_count} sales)
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {areas.length === 0 && (
            <View style={styles.emptyAreasBox}>
              <Text style={styles.emptyAreasIcon}>📍</Text>
              <Text style={styles.emptyAreasText}>No assigned areas for this trip</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} currentRoute="Dashboard" />
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 16,
  },
  headerRight: {
    width: 38,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  welcomeSection: {
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  vehicleBadge: {
    backgroundColor: '#E6F2F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(8, 126, 102, 0.1)',
  },
  vehicleBadgeLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#087E66',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleBadgeNo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#087E66',
    marginTop: 2,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardIcon: {
    fontSize: 20,
    color: '#087E66',
    fontWeight: '700',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  viewAll: {
    fontSize: 13,
    color: '#087E66',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemSkuText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  itemStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  emptyStocksBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyStocksIcon: {
    fontSize: 32,
    marginBottom: 8,
    opacity: 0.3,
  },
  emptyStocksText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  areasContainer: {
    gap: 12,
    marginBottom: 20,
  },
  areaCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1.5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  areaName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  areaPerformance: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  unassignedLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#E11D48',
    marginTop: 2,
    fontStyle: 'italic',
  },
  progressBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#087E66',
    borderRadius: 4,
  },
  coverageText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  areaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  areaSalesText: {
    fontSize: 11,
    color: '#087E66',
    fontWeight: '700',
  },
  emptyAreasBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyAreasIcon: {
    fontSize: 32,
    marginBottom: 8,
    opacity: 0.3,
  },
  emptyAreasText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

export default DashboardScreen;
