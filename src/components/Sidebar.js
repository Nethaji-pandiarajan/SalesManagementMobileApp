import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

const Sidebar = ({ isOpen, onClose, navigation, username }) => {
  const { logout, userData } = useAuth();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, fadeAnim, slideAnim]);

  const isAdmin = userData?.role === 'admin';

  const adminMenuItems = [
    { name: 'Dashboard', icon: '⌂', route: 'AdminDashboard' },
    { name: 'Product Management', icon: '📦', route: 'ProductManagement' },
    { name: 'User Management', icon: '👥', route: 'UserManagement' },
    { name: 'Supply Management', icon: '🚚', route: 'SupplyManagement' },
    { name: 'Sales Reports', icon: '📊', route: 'Reports' },
    { name: 'EOD Reconciliation', icon: '💰', route: 'AdminEOD' },
    { name: 'Vehicles', icon: '🚚', route: 'Vehicles' },
  ];

  const executiveMenuItems = [
    { name: 'Dashboard', icon: '⌂', route: 'Dashboard' },
    { name: 'Inventory', icon: '☷', route: 'Inventory' },
    { name: 'Shops', icon: '⚲', route: 'Shops' },
    { name: 'Reports', icon: '◫', route: 'Reports' },
    { name: 'Sales audit', icon: '◈', route: 'Reconciliation' },
    { name: 'Vehicles', icon: '🚚', route: 'Vehicles' },
  ];

  const menuItems = isAdmin ? adminMenuItems : executiveMenuItems;

  const handleNavigate = (route) => {
    onClose();
    if (route) {
      navigation.navigate(route);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout(); // Clears token + switches App.tsx back to AuthStack
  };

  return (
    <View style={[styles.overlayContainer, { pointerEvents: isOpen ? 'auto' : 'none' }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.brandName}>JO GOLD</Text>
          <Text style={styles.userRole}>Welcome, {username || 'Admin'}</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleNavigate(item.route)}
            >
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.menuText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <View style={styles.logoutIconContainer}>
              <Text style={styles.logoutIcon}>⎋</Text>
            </View>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    height: height,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sidebarHeader: {
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'flex-start',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#087E66',
    letterSpacing: 1,
  },
  userRole: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  menuContainer: {
    marginTop: 10,
    paddingHorizontal: 15,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  menuIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuIcon: {
    fontSize: 14,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  logoutContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
  },
  logoutIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoutIcon: {
    fontSize: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E11D48',
  },
});


export default Sidebar;
