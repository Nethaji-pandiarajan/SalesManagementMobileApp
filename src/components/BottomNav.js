import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BottomNav = ({ navigation, currentRoute }) => {
  const tabs = [
    { name: 'Home', icon: '⌂', route: 'Dashboard' },
    { name: 'Inventory', icon: '☷', route: 'Inventory' },
    { name: 'Shops', icon: '⚲', route: 'Shops' },
    { name: 'Reports', icon: '◫', route: 'Reports' },
    { name: 'Audit', icon: '◈', route: 'Reconciliation' },
  ];

  return (
    <View style={styles.bottomTab}>
      {tabs.map((tab, index) => {
        const isActive = currentRoute === tab.route;
        return (
          <TouchableOpacity
            key={index}
            style={styles.tabItem}
            onPress={() => navigation.navigate(tab.route)}
          >
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.name}</Text>
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
  tabIcon: {
    fontSize: 22,
    color: '#94A3B8',
    marginBottom: 4,
  },
  tabIconActive: {
    color: '#087E66',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#1E293B',
  },
});

export default BottomNav;
