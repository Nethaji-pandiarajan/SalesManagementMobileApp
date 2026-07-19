import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

const BottomNav = ({ navigation, currentRoute }) => {
  const { userData } = useAuth();
  const isAdmin = userData?.role === 'admin' || userData?.role_id === 1 || userData?.role_id === 3 || userData?.role_name?.toLowerCase() === 'admin';

  const adminTabs = [
    { name: 'Dashboard', icon: '⌂', route: 'AdminDashboard' },
    { name: 'Products', icon: '📦', route: 'ProductManagement' },
    { name: 'Users', icon: '👥', route: 'UserManagement' },
    { name: 'Supply', icon: '🚚', route: 'SupplyManagement' },
    { name: 'Reports', icon: '📊', route: 'Reports' },
    { name: 'EOD', icon: '💰', route: 'AdminEOD' },
    { name: 'Vehicles', icon: '🚚', route: 'AdminVehicleList' },
  ];

  const executiveTabs = [
    { name: 'Home', icon: '⌂', route: 'Dashboard' },
    { name: 'Preorders', icon: '📝', route: 'Preorder' },
    { name: 'Inventory', icon: '☷', route: 'Inventory' },
    { name: 'Shops', icon: '⚲', route: 'Shops' },
    { name: 'Reports', icon: '◫', route: 'Reports' },
    { name: 'Audit', icon: '◈', route: 'UserSalesAudit' },
  ];

  const tabs = isAdmin ? adminTabs : executiveTabs;

  return (
    <View style={styles.bottomTab}>
      {tabs.map((tab, index) => {
        const isActive = currentRoute === tab.route ||
          (tab.route === 'Preorder' && (currentRoute === 'Preorders' || currentRoute === 'PreorderDetail')) ||
          (tab.route === 'AdminEOD' && currentRoute === 'Reconciliation') ||
          (tab.route === 'Reports' && currentRoute === 'AdminSalesReports') ||
          (tab.route === 'AdminDashboard' && currentRoute === 'Dashboard');
        return (
          <TouchableOpacity
            key={index}
            style={[styles.tabItem, isAdmin && styles.adminTabItem]}
            onPress={() => navigation.navigate(tab.route)}
          >
            <Text style={[styles.tabIcon, isAdmin && styles.adminTabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
            <Text style={[styles.tabText, isAdmin && styles.adminTabText, isActive && styles.tabTextActive]} numberOfLines={1}>{tab.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomTab: {
    height: 65,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  adminTabItem: {
    paddingHorizontal: 2,
  },
  tabIcon: {
    fontSize: 22,
    color: '#94A3B8',
    marginBottom: 4,
  },
  adminTabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabIconActive: {
    color: '#087E66',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  adminTabText: {
    fontSize: 8,
  },
  tabTextActive: {
    color: '#1E293B',
  },
});

export default BottomNav;
