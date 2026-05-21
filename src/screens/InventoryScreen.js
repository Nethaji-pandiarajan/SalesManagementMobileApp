import React, { useState, useMemo } from 'react';
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
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

const InventoryScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Structured Data based on user request
  const inventoryCategories = [
    {
      categoryName: 'Jo gold chekku gingelly oil',
      items: [
        { id: 'JG-G-1L-B', name: '1 ltr bottle', stock: 120, price: 180 },
        { id: 'JG-G-500-B', name: '500 ml bottle', stock: 240, price: 95 },
        { id: 'JG-G-200-B', name: '200 ml bottle', stock: 150, price: 40 },
        { id: 'JG-G-100-B', name: '100 ml bottle', stock: 100, price: 22 },
        { id: 'JG-G-1L-P', name: '1 ltr pouch', stock: 50, price: 175 },
        { id: 'JG-G-500-P', name: '500 ml pouch', stock: 80, price: 90 },
        { id: 'JG-G-100-P', name: '100 ml pouch', stock: 120, price: 20 },
        { id: 'JG-G-50-P', name: '50 ml pouch', stock: 200, price: 12 },
        { id: 'JG-G-5L-C', name: '5 ltr can', stock: 30, price: 850 },
        { id: 'JG-G-15K-T', name: '15 kg Tin', stock: 15, price: 2500 },
        { id: 'JG-G-40K-OC', name: '40 kg oil cake', stock: 10, price: 1200 },
        { id: 'JG-G-50K-OC', name: '50 kg oil cake', stock: 5, price: 1500 },
        { id: 'JG-G-40K-GOC', name: '40 kg grinded oil cake', stock: 8, price: 1300 },
        { id: 'JG-G-50K-GOC', name: '50 kg grinded oil cake', stock: 4, price: 1600 },
      ]
    },
    {
      categoryName: 'Sri Lakshmi chekku gingelly oil',
      items: [
        { id: 'SL-G-1L-B', name: '1 ltr bottle', stock: 80, price: 170 },
        { id: 'SL-G-500-B', name: '500 ml bottle', stock: 150, price: 85 },
        { id: 'SL-G-5L-C', name: '5 ltr can', stock: 20, price: 800 },
        { id: 'SL-G-15K-T', name: '15 kg Tin', stock: 10, price: 2400 },
      ]
    },
    {
      categoryName: 'Jo gold chekku groundnut oil',
      items: [
        { id: 'JG-GN-1L-B', name: '1 ltr bottle', stock: 100, price: 160 },
        { id: 'JG-GN-500-B', name: '500 ml bottle', stock: 180, price: 85 },
        { id: 'JG-GN-5L-C', name: '5 ltr can', stock: 25, price: 780 },
        { id: 'JG-GN-15K-T', name: '15 kg Tin', stock: 12, price: 2300 },
        { id: 'JG-GN-50K-OC', name: '50 kg oil cake', stock: 6, price: 1400 },
      ]
    },
    {
      categoryName: 'Maha gold deepam oil',
      items: [
        { id: 'MG-D-1L-B', name: '1 ltr bottle', stock: 200, price: 120 },
        { id: 'MG-D-500-B', name: '500 ml bottle', stock: 300, price: 65 },
        { id: 'MG-D-200-B', name: '200 ml bottle', stock: 150, price: 30 },
        { id: 'MG-D-100-B', name: '100 ml bottle', stock: 100, price: 18 },
        { id: 'MG-D-15K-T', name: '15 kg Tin', stock: 20, price: 1800 },
      ]
    }
  ];

  const [expandedCategories, setExpandedCategories] = useState(
    inventoryCategories.reduce((acc, cat) => ({ ...acc, [cat.categoryName]: true }), {})
  );

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventoryCategories;
    return inventoryCategories.map(cat => {
      const isCatMatch = cat.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      if (isCatMatch) return cat; // If category matches, show all items
      return {
        ...cat,
        items: cat.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      };
    }).filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  const totalItemsCount = useMemo(() => {
    return filteredInventory.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [filteredInventory]);

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
          <Text style={styles.headerTitle}>VEHICLE INVENTORY</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories or items..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>🚛 Currently loaded in Van</Text>
          <Text style={styles.itemCount}>{totalItemsCount} Items</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {filteredInventory.map((category, index) => (
            <View key={index} style={styles.categorySection}>
              <TouchableOpacity
                style={styles.categoryHeader}
                activeOpacity={0.7}
                onPress={() => toggleCategory(category.categoryName)}
              >
                <Text style={styles.categoryTitle}>{category.categoryName}</Text>
                <Text style={styles.accordionIcon}>
                  {expandedCategories[category.categoryName] ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {expandedCategories[category.categoryName] && category.items.map((item) => (
                <View key={item.id} style={styles.inventoryCard}>
                  <View style={styles.cardMain}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.skuText}>Rate: ₹{item.price}</Text>
                    </View>
                    <View style={styles.stockInfo}>
                      <Text style={styles.stockQty}>{item.stock} units</Text>
                      <Text style={styles.totalValue}>
                        ₹{(item.price * item.stock).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {filteredInventory.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No items found in inventory</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <BottomNav navigation={navigation} currentRoute="Inventory" />
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
  headerRight: {
    width: 38,
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
    marginBottom: 12,
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
  infoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#087E66',
    backgroundColor: '#E6F2F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listContainer: { paddingHorizontal: 0, paddingBottom: 20 },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F2F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#087E66',
  },
  accordionIcon: {
    fontSize: 12,
    color: '#087E66',
    fontWeight: '800',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#087E66',
    textTransform: 'uppercase',
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  skuText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stockInfo: {
    alignItems: 'flex-end',
  },
  stockQty: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#087E66',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
});

export default InventoryScreen;
