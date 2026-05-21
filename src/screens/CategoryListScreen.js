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
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

const CategoryListScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Data for Categories
  const [categories, setCategories] = useState([
    { categoryId: '1', categoryName: 'Jo gold chekku gingelly oil', description: 'Pure cold pressed gingelly oil', status: 'Active' },
    { categoryId: '2', categoryName: 'Sri Lakshmi chekku gingelly oil', description: 'Traditional chekku gingelly oil', status: 'Active' },
    { categoryId: '3', categoryName: 'Jo gold chekku groundnut oil', description: 'Pure cold pressed groundnut oil', status: 'Active' },
    { categoryId: '4', categoryName: 'Maha gold deepam oil', description: 'Premium quality deepam oil', status: 'Active' },
  ]);

  const filteredCategories = categories.filter(c =>
    c.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Text style={styles.headerTitle}>CATEGORIES</Text>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('AddCategory')}
        >
          <Text style={styles.newBtnText}>+ New Category</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {filteredCategories.map((category) => (
            <TouchableOpacity
              key={category.categoryId}
              style={styles.card}
              onPress={() => navigation.navigate('ProductList', { category })}
            >
              <View style={styles.cardLeft}>
                <View style={styles.folderIconContainer}>
                  <Text style={styles.folderIcon}>🛢️</Text>
                </View>
                <Text style={styles.name} numberOfLines={2}>{category.categoryName}</Text>
              </View>

              <View style={styles.cardRight}>
                <View style={[styles.statusDot, category.status === 'Active' ? styles.statusActiveDot : styles.statusInactiveDot]} />
                <TouchableOpacity
                  style={styles.actionEditBtn}
                  onPress={() => navigation.navigate('AddCategory', { category })}
                >
                  <Text style={styles.actionEditIcon}>✎</Text>
                </TouchableOpacity>
                <View style={styles.chevronContainer}>
                  <Text style={styles.chevronText}>❯</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredCategories.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyText}>No categories found</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <BottomNav navigation={navigation} currentRoute="ProductManagement" />
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#087E66',
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
  card: {
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  folderIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E6F2F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  folderIcon: {
    fontSize: 16,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActiveDot: {
    backgroundColor: '#10B981',
  },
  statusInactiveDot: {
    backgroundColor: '#EF4444',
  },
  actionEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionEditIcon: {
    fontSize: 14,
    color: '#64748B',
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: 'bold',
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

export default CategoryListScreen;
