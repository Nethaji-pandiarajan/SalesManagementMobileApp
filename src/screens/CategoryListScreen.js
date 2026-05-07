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
    { categoryId: '1', categoryName: 'Beverages', description: 'Soft drinks, juices, and water', status: 'Active' },
    { categoryId: '2', categoryName: 'Snacks', description: 'Chips, biscuits, and nuts', status: 'Active' },
    { categoryId: '3', categoryName: 'Dairy', description: 'Milk, cheese, and yogurt', status: 'Active' },
    { categoryId: '4', categoryName: 'Produce', description: 'Fresh fruits and vegetables', status: 'Inactive' },
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
              <View style={styles.cardInfo}>
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>📁</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{category.categoryName}</Text>
                  <Text style={styles.description} numberOfLines={1}>{category.description}</Text>
                </View>
              </View>
              
              <View style={styles.cardRight}>
                <View style={styles.statusDotContainer}>
                  <View style={[styles.statusDot, category.status === 'Active' ? styles.statusActive : styles.statusInactive]} />
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('AddCategory', { category })}>
                  <Text style={styles.editIcon}>✎</Text>
                </TouchableOpacity>
                <View style={styles.arrowIcon}>
                  <Text style={styles.arrowText}>❯</Text>
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
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  newBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 56,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  description: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  arrowIcon: {
    opacity: 0.2,
    marginLeft: 10,
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

export default CategoryListScreen;
