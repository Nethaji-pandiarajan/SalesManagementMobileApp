import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ route, navigation }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Dynamic current date
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Mock Data
  const stats = [
    { label: 'Total Stocks', value: '1,250', color: '#FFFFFF', icon: '⊞' },
    { label: 'Sold Stocks', value: '840', color: '#FFFFFF', icon: '⇱' },
    { label: 'Total Sales Count', value: '124', color: '#FFFFFF', icon: '◈' },
    { label: 'Total Sales', value: '₹45,200', color: '#FFFFFF', icon: '₹' },
  ];

  const currentStocks = [
    { name: 'JO GOLD 1L', quantity: 450, status: 'In Stock' },
    { name: 'JO GOLD 500ml', quantity: 320, status: 'Low Stock' },
    { name: 'JO GOLD 2L', quantity: 280, status: 'In Stock' },
  ];

  const areas = [
    { name: 'Downtown Center', performance: 'High', coverage: '85%' },
    { name: 'West Side Mall', performance: 'Medium', coverage: '60%' },
    { name: 'North Industrial', performance: 'Low', coverage: '30%' },
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

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeName}>Hello, {username}</Text>
          <Text style={styles.welcomeDate}>{currentDate}</Text>
        </View>

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
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          {currentStocks.map((item, index) => (
            <View key={index} style={[styles.summaryItem, index === currentStocks.length - 1 && styles.noBorder]}>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={[styles.itemStatus, { color: item.status === 'Low Stock' ? '#EF4444' : '#10B981' }]}>
                  {item.status}
                </Text>
              </View>
              <Text style={styles.itemQty}>{item.quantity} units</Text>
            </View>
          ))}
        </View>

        {/* Areas to be Covered */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Areas to be Covered</Text>
        </View>

        <View style={styles.areasContainer}>
          {areas.map((area, index) => (
            <TouchableOpacity key={index} style={styles.areaCard}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaName}>{area.name}</Text>
                <Text style={styles.areaPerformance}>{area.performance}</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: area.coverage }]} />
              </View>
              <Text style={styles.coverageText}>Coverage: {area.coverage}</Text>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: 20,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconText: {
    fontSize: 24,
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
    padding: 20,
    paddingBottom: 20,
  },
  welcomeSection: {
    marginBottom: 25,
    marginTop: 10,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 15,
  },
  statCard: {
    width: (width - 55) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
  },
  cardContent: {
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardIcon: {
    fontSize: 22,
    color: '#087E66',
    fontWeight: '700',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  viewAll: {
    fontSize: 14,
    color: '#087E66',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  itemQty: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  areasContainer: {
    gap: 16,
  },
  areaCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  areaPerformance: {
    fontSize: 12,
    fontWeight: '700',
    color: '#087E66',
    backgroundColor: '#E6F2F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  progressBg: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#087E66',
    borderRadius: 5,
  },
  coverageText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});


export default DashboardScreen;
