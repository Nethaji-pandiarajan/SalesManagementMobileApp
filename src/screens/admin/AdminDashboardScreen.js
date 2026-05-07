import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Sidebar from '../../components/Sidebar';
import BottomNav from '../../components/BottomNav';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// Placeholder Data
const REVENUE_DATA = {
  daily: { sales: '₹45,000', collected: '₹40,000', pending: '₹5,000' },
  weekly: { sales: '₹3,15,000', collected: '₹2,90,000', pending: '₹25,000' },
  monthly: { sales: '₹12,50,000', collected: '₹11,00,000', pending: '₹1,50,000' },
};

const VEHICLES = [
  { id: '1', name: 'TN 38 BX 1234', status: 'On Road', driver: 'Mani' },
  { id: '2', name: 'TN 38 BX 5678', status: 'Loading', driver: 'Kumar' },
  { id: '3', name: 'TN 38 CX 9012', status: 'Reconciled', driver: 'Raja' },
  { id: '4', name: 'TN 38 CX 3456', status: 'On Road', driver: 'Suresh' },
];

const TOP_SHOPS = [
  { id: '1', name: 'Sri Murugan Stores', volume: '₹1,25,000', rank: 1 },
  { id: '2', name: 'Krishna Supermarket', volume: '₹98,000', rank: 2 },
  { id: '3', name: 'Ganesh Traders', volume: '₹85,000', rank: 3 },
  { id: '4', name: 'Lakshmi Maligai', volume: '₹72,000', rank: 4 },
  { id: '5', name: ' बालाजी Provisions', volume: '₹65,000', rank: 5 },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'On Road': return '#10B981'; // Green
    case 'Loading': return '#F59E0B'; // Amber
    case 'Reconciled': return '#3B82F6'; // Blue
    default: return '#6B7280'; // Gray
  }
};

const AdminDashboardScreen = ({ navigation }) => {
  const [timeframe, setTimeframe] = React.useState('daily');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { userData } = useAuth();
  const username = userData?.email?.split('@')[0] || 'Admin';

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeName}>Hello, {username}</Text>
          <Text style={styles.welcomeDate}>Executive Dashboard - {currentDate}</Text>
        </View>

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

            <Text style={styles.revenueAmount}>{REVENUE_DATA[timeframe].sales}</Text>
            <View style={styles.revenueSplit}>
              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>Cash Collected</Text>
                <Text style={styles.splitValueGreen}>{REVENUE_DATA[timeframe].collected}</Text>
              </View>
              <View style={styles.splitDivider} />
              <View style={styles.splitItem}>
                <Text style={styles.splitLabel}>Pending</Text>
                <Text style={styles.splitValueRed}>{REVENUE_DATA[timeframe].pending}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Live Vehicle Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Vehicle Status</Text>
          <View style={styles.vehicleGrid}>
            {VEHICLES.map((vehicle) => (
              <View key={vehicle.id} style={styles.vehicleCard}>
                <View style={styles.vehicleHeader}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vehicle.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(vehicle.status) }]} />
                  </View>
                </View>
                <Text style={styles.driverName}>Driver: {vehicle.driver}</Text>
              </View>
            ))}
          </View>
        </View>



        {/* Top 5 Shops */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Top 5 Shops</Text>
          <View style={styles.shopsContainer}>
            {TOP_SHOPS.map((shop) => (
              <View key={shop.id} style={styles.shopRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{shop.rank}</Text>
                </View>
                <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
                <Text style={styles.shopVolume}>{shop.volume}</Text>
              </View>
            ))}
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
});

export default AdminDashboardScreen;
