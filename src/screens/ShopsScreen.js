import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

export let globalShopsList = [
  { id: '1', shopName: 'City Supermarket', areaName: 'Downtown', balance: 1200, status: 'Active' },
  { id: '2', shopName: 'Green Grocers', areaName: 'West Side', balance: 500, status: 'Active' },
  { id: '3', shopName: 'Morning Mart', areaName: 'North Industrial', balance: 0, status: 'Active' },
  { id: '4', shopName: 'Quick Stop', areaName: 'East Gate', balance: 2450, status: 'Inactive' },
  { id: '5', shopName: 'Reliable Stores', areaName: 'Downtown', balance: 300, status: 'Active' },
];

const ShopsScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync with global runtime memory when screen comes into focus
  const [shops, setShops] = useState(globalShopsList);
  useFocusEffect(
    React.useCallback(() => {
      setShops([...globalShopsList]);
    }, [])
  );

  const filteredShops = shops.filter(shop =>
    shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.areaName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Text style={styles.headerTitle}>SHOPS</Text>
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

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {filteredShops.map((shop) => (
            <TouchableOpacity
              key={shop.id}
              style={styles.shopCard}
              onPress={() => navigation.navigate('Billing', { shop })}
            >
              <View style={styles.shopInfo}>
                <View style={styles.shopIconBox}>
                  <Text style={styles.shopIcon}>🏬</Text>
                </View>
                <View>
                  <Text style={styles.shopName}>{shop.shopName}</Text>
                  <Text style={styles.areaName}>📍 {shop.areaName}</Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <View style={styles.statusDotContainer}>
                  <View style={[styles.statusDot, shop.status === 'Active' ? styles.statusActive : styles.statusInactive]} />
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('AddShop', { shop })}>
                  <Text style={styles.editIcon}>✎</Text>
                </TouchableOpacity>
                <View style={styles.arrowIcon}>
                  <Text style={styles.arrowText}>❯</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredShops.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyText}>No shops found</Text>
            </View>
          )}
        </ScrollView>
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
    fontSize: 16,
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
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
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
    alignItems: 'center',
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
  },
  shopIcon: {
    fontSize: 20,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  areaName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
  },
  editIcon: {
    fontSize: 14,
    color: '#64748B',
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
    marginRight: 4,
  },
  statusActive: {
    backgroundColor: '#10B981', // Green
  },
  statusInactive: {
    backgroundColor: '#EF4444', // Red
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
