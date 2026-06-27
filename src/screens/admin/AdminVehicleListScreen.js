import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Sidebar from '../../components/Sidebar';
import BottomNav from '../../components/BottomNav';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteVehicle, getVehicles, getStoredToken } from '../../services/vehicleService';

const { width } = Dimensions.get('window');

const AdminVehicleListScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userData } = useAuth();
  const username = userData?.email?.split('@')[0] || 'Admin';

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getStoredToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const { response, data } = await getVehicles(token);
      if (response.ok) {
        const vehicleList = Array.isArray(data.vehicles) ? data.vehicles : Array.isArray(data) ? data : [];
        setVehicles(vehicleList);
        setFilteredVehicles(vehicleList);
      } else {
        setError(data.error || 'Failed to fetch vehicles.');
      }
    } catch (err) {
      console.error('Fetch vehicles error:', err);
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchVehicles();
    }, [])
  );

  useEffect(() => {
    const filtered = vehicles.filter(v =>
      (v.vehicle_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.vehicle_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.vehicle_owner || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredVehicles(filtered);
  }, [searchQuery, vehicles]);

  const getStatusColor = (status) => {
    const stat = (status || 'ACTIVE').toUpperCase();
    return stat === 'ACTIVE' ? '#10B981' : '#EF4444';
  };

  const normalizeVehicleId = (id) => id?.toString?.() || '';

  const handleDeleteVehicle = (vehicleId) => {
    const targetId = normalizeVehicleId(vehicleId);
    if (!targetId) {
      Alert.alert('Error', 'Unable to delete vehicle. Vehicle ID is missing.');
      return;
    }

    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await getStoredToken();
              if (!token) {
                Alert.alert('Error', 'No authentication token found. Please log in again.');
                return;
              }

              const { response, data } = await deleteVehicle(token, targetId);
              if (response.ok) {
                await fetchVehicles();
                Alert.alert('Success', 'Vehicle deleted successfully!');
              } else {
                const errorMessage = data.error || data.message || response.statusText || 'Failed to delete vehicle.';
                Alert.alert('Error', `Delete failed (${response.status}): ${errorMessage}`);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete vehicle: ' + err.message);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setIsSidebarOpen(true)}
          >
            <Text style={styles.menuIconText}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>VEHICLES</Text>
          </View>
          <TouchableOpacity style={styles.menuBtn}>
            <Text style={styles.menuIconText}>{username.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#087E66" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>VEHICLES</Text>
        </View>

        <TouchableOpacity
          style={styles.newVehicleBtn}
          onPress={() => navigation.navigate('AddVehicle')}
        >
          <Text style={styles.newVehicleBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, number, or owner..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={fetchVehicles}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredVehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚚</Text>
            <Text style={styles.emptyText}>No vehicles found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredVehicles}
            keyExtractor={(item) => item.vehicle_id?.toString() || Math.random().toString()}
            renderItem={({ item }) => (
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleLeft}>
                  <Text style={styles.vehicleIcon}>🚚</Text>
                </View>

                <View style={styles.vehicleMiddle}>
                  <Text style={styles.vehicleName}>{item.vehicle_name || 'N/A'}</Text>
                  <Text style={styles.vehicleNo}>Reg: {item.vehicle_no || 'N/A'}</Text>
                  <Text style={styles.vehicleOwner}>Owner: {item.vehicle_owner || 'N/A'}</Text>
                </View>

                <View style={styles.vehicleRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.vehicle_status || item.status) + '20', borderColor: getStatusColor(item.vehicle_status || item.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.vehicle_status || item.status) }]}>
                      {((item.vehicle_status || item.status || 'ACTIVE')).toString().toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.moreBtn}
                      onPress={() => navigation.navigate('AddVehicle', { vehicle: item })}
                    >
                      <Text style={styles.moreBtnText}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteVehicle(item.vehicle_id ?? item.vehicleId ?? item.id)}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
          />
        )}
      </View>

      <BottomNav navigation={navigation} currentRoute="AdminVehicleList" />
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
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#087E66',
  },
  menuBtn: {
    padding: 8,
  },
  menuIconText: {
    fontSize: 24,
    color: '#087E66',
  },
  newVehicleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#087E66',
    borderRadius: 6,
  },
  newVehicleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleLeft: {
    fontSize: 32,
    marginRight: 12,
  },
  vehicleIcon: {
    fontSize: 32,
  },
  vehicleMiddle: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  vehicleNo: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  vehicleOwner: {
    fontSize: 12,
    color: '#64748B',
  },
  vehicleRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreBtnText: {
    fontSize: 14,
    color: '#1E293B',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
    color: '#DC2626',
  },
  moreBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  moreBtnText: {
    fontSize: 18,
    color: '#087E66',
  },
  listContent: {
    paddingBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#087E66',
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default AdminVehicleListScreen;
