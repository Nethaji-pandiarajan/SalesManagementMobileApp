import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/config';

// Custom red trash can icon drawn with components
const RedTrashIcon = () => (
  <View style={iconStyles.trashContainer}>
    <View style={iconStyles.trashHandle} />
    <View style={iconStyles.trashLid} />
    <View style={iconStyles.trashBody}>
      <View style={iconStyles.trashLine} />
      <View style={iconStyles.trashLine} />
    </View>
  </View>
);

// Initial Mock DB Users
const INITIAL_USERS = [
  {
    user_id: 1,
    role_id: 1, // Admin
    username: 'admin',
    email: 'admin@jogold.com',
    phone: '9876543210',
    status: 'ACTIVE',
    address: '12, Main Street, Chennai',
    state: 'Tamil Nadu',
    org_id: 1,
  },
  {
    user_id: 2,
    role_id: 2, // Executive
    username: 'Thiru',
    email: 'thiru@jogold.com',
    phone: '9876543211',
    status: 'ACTIVE',
    address: '45, Gandhi Nagar, Madurai',
    state: 'Tamil Nadu',
    org_id: 1,
  },
  {
    user_id: 3,
    role_id: 2, // Executive
    username: 'Kathir',
    email: 'kathir@jogold.com',
    phone: '9876543212',
    status: 'INACTIVE',
    address: '78, Anna Salai, Trichy',
    state: 'Tamil Nadu',
    org_id: 1,
  }
];

// Global runtime memory for CRUD operations
export let globalUsersList = [...INITIAL_USERS];

const UserListScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('No token found');
        return;
      }
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
    }, [])
  );

  const getRoleName = (roleId) => {
    return roleId === 1 ? 'Admin' : 'Sales Executive';
  };

  const handleDelete = (user) => {
    Alert.alert(
      'Deactivate User',
      `Are you sure you want to deactivate "${user.username}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) return;
              const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/${user.user_id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              const data = await response.json();
              if (response.ok) {
                Alert.alert('Success', 'User deactivated successfully.');
                fetchUsers();
              } else {
                Alert.alert('Error', data.error || 'Failed to deactivate user.');
              }
            } catch (err) {
              console.error('Delete user error:', err);
              Alert.alert('Error', 'Network error.');
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(u =>
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone || '').includes(searchQuery) ||
    (u.role_name || getRoleName(u.role_id)).toLowerCase().includes(searchQuery.toLowerCase())
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
          <Text style={styles.headerTitle}>USER MANAGEMENT</Text>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('AddUser')}
        >
          <Text style={styles.newBtnText}>+ New User</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {loading && users.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#087E66" />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : filteredUsers.map((user) => (
            <View key={user.user_id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.avatarIconContainer}>
                  <Text style={styles.avatarIcon}>👤</Text>
                </View>
                <View style={styles.userMeta}>
                  <Text style={styles.name} numberOfLines={1}>{user.username}</Text>
                  <Text style={styles.roleSubtext}>{user.role_name || getRoleName(user.role_id)}</Text>
                  <Text style={styles.contactSubtext}>{user.phone || 'No phone'} • {user.email || 'No email'}</Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <View
                  style={[
                    styles.statusDot,
                    (user.status || '').trim().toUpperCase() === 'ACTIVE'
                      ? styles.statusActiveDot
                      : styles.statusInactiveDot
                  ]}
                />
                {user.role_id === 1 ? (
                  <View style={styles.protectedBadge}>
                    <Text style={styles.protectedBadgeText}>🔒 Admin</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.actionEditBtn}
                      onPress={() => navigation.navigate('AddUser', { user })}
                    >
                      <Text style={styles.actionEditIcon}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionDeleteBtn}
                      onPress={() => handleDelete(user)}
                    >
                      <RedTrashIcon />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}

          {!loading && filteredUsers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )}
        </ScrollView>
      </View>
      <BottomNav navigation={navigation} currentRoute="UserManagement" />
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
    fontWeight: 'bold',
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
    padding: 14,
    marginBottom: 10,
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
  avatarIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F2F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 22,
  },
  userMeta: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  roleSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: '#087E66',
    marginTop: 1,
  },
  contactSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  actionDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  protectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  protectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
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
  centerContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});

// Styles for custom vector trash icon
const iconStyles = StyleSheet.create({
  trashContainer: {
    width: 14,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashHandle: {
    width: 5,
    height: 2,
    backgroundColor: '#EF4444',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  trashLid: {
    width: 12,
    height: 2,
    backgroundColor: '#EF4444',
    borderRadius: 1,
  },
  trashBody: {
    width: 9,
    height: 9,
    borderWidth: 1.2,
    borderColor: '#EF4444',
    borderBottomLeftRadius: 1.5,
    borderBottomRightRadius: 1.5,
    borderTopWidth: 0,
    marginTop: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 1,
    paddingTop: 1,
  },
  trashLine: {
    width: 1,
    height: 5,
    backgroundColor: '#EF4444',
  },
});

export default UserListScreen;
