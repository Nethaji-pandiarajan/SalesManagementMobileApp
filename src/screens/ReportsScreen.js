import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const ReportsScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mock Data for Report
  const totalSales = 45200;
  const collections = 38500;
  const cashInHand = 25000;
  
  const stockStatus = {
    totalLoaded: 1280,
    sold: 840,
    remaining: 440
  };

  const shopsVisited = [
    { id: 1, name: 'City Supermarket', time: '09:30 AM', amount: 12500, status: 'Paid' },
    { id: 2, name: 'Downtown Grocery', time: '11:15 AM', amount: 8400, status: 'Partial' },
    { id: 3, name: 'Westside Mart', time: '01:45 PM', amount: 15300, status: 'Paid' },
    { id: 4, name: 'North Corner Shop', time: '03:20 PM', amount: 9000, status: 'Credit' },
  ];

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
        <TouchableOpacity style={styles.menuBtn} onPress={() => setIsSidebarOpen(true)}>
          <Text style={styles.menuIconText}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>DAILY TRIP SUMMARY</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Date Banner */}
        <View style={styles.dateBanner}>
          <Text style={styles.dateText}>Today, 27 April 2026</Text>
        </View>

        {/* Top Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.iconBoxTeal}>
              <Text style={styles.iconText}>📈</Text>
            </View>
            <Text style={styles.cardLabel}>Total Sales</Text>
            <Text style={styles.cardValue}>₹{totalSales.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.iconBoxDark}>
              <Text style={styles.iconText}>💰</Text>
            </View>
            <Text style={styles.cardLabel}>Collections</Text>
            <Text style={styles.cardValue}>₹{collections.toLocaleString()}</Text>
          </View>
        </View>

        {/* Cash in Hand */}
        <View style={styles.cashCard}>
          <View style={styles.cashIconContainer}>
            <Text style={styles.cashIcon}>💵</Text>
          </View>
          <View>
            <Text style={styles.cashLabel}>Total Cash in Hand</Text>
            <Text style={styles.cashValue}>₹{cashInHand.toLocaleString()}</Text>
          </View>
        </View>

        {/* Stock Status */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stock Status</Text>
        </View>
        <View style={styles.stockCard}>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Loaded</Text>
            <Text style={styles.stockNum}>{stockStatus.totalLoaded}</Text>
          </View>
          <View style={styles.stockDivider} />
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Sold</Text>
            <Text style={[styles.stockNum, { color: '#087E66' }]}>{stockStatus.sold}</Text>
          </View>
          <View style={styles.stockDivider} />
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Remaining</Text>
            <Text style={[styles.stockNum, { color: '#EAB308' }]}>{stockStatus.remaining}</Text>
          </View>
        </View>

        {/* Shops Visited */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shops Visited Today</Text>
          <View style={styles.shopCountBadge}>
            <Text style={styles.shopCount}>{shopsVisited.length}</Text>
          </View>
        </View>
        
        <View style={styles.shopsList}>
          {shopsVisited.map(shop => (
            <View key={shop.id} style={styles.shopCard}>
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{shop.name}</Text>
                <Text style={styles.shopTime}>{shop.time}</Text>
              </View>
              <View style={styles.shopFinancials}>
                <Text style={styles.shopAmount}>₹{shop.amount.toLocaleString()}</Text>
                <View style={[
                  styles.statusBadge, 
                  shop.status === 'Paid' ? styles.statusPaid : 
                  shop.status === 'Partial' ? styles.statusPartial : styles.statusCredit
                ]}>
                  <Text style={[
                    styles.statusText,
                    shop.status === 'Paid' ? styles.statusTextPaid : 
                    shop.status === 'Partial' ? styles.statusTextPartial : styles.statusTextCredit
                  ]}>{shop.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      <BottomNav navigation={navigation} currentRoute="Reports" />
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
    alignItems: 'flex-start',
    marginLeft: 15,
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 20 },
  dateBanner: {
    marginBottom: 20,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBoxTeal: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E6F2F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBoxDark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 18,
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  cashCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  cashIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cashIcon: {
    fontSize: 24,
  },
  cashLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  cashValue: {
    color: '#10B981',
    fontSize: 28,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  stockCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 25,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  stockNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  stockDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  shopCountBadge: {
    backgroundColor: '#087E66',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shopCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  shopsList: {
    gap: 10,
  },
  shopCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  shopTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  shopFinancials: {
    alignItems: 'flex-end',
  },
  shopAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: '#E6F2F0',
  },
  statusPartial: {
    backgroundColor: '#FEF3C7',
  },
  statusCredit: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextPaid: {
    color: '#087E66',
  },
  statusTextPartial: {
    color: '#D97706',
  },
  statusTextCredit: {
    color: '#DC2626',
  },
});

export default ReportsScreen;
