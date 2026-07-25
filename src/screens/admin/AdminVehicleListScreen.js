import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { deleteVehicle, getVehicles, getStoredToken } from '../../services/vehicleService';

const { width } = Dimensions.get('window');

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

const AdminVehicleListScreen = ({ navigation, route }) => {
  const { username: routeUsername } = route?.params || {};
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userData } = useAuth();
  const username = routeUsername || userData?.email?.split('@')[0] || 'Admin';

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
          <Text style={styles.headerTitle}>VEHICLE LIST</Text>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('AddVehicle')}
        >
          <Text style={styles.newBtnText}>+ New Vehicle</Text>
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

        {loading && vehicles.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#087E66" />
            <Text style={styles.loadingText}>Loading vehicles...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={fetchVehicles}
            >
              <Text style={styles.retryBtnText}>Retry / Refresh</Text>
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.avatarIconContainer}>
                    <Text style={styles.avatarIcon}>🚚</Text>
                  </View>
                  <View style={styles.vehicleMeta}>
                    <Text style={styles.name} numberOfLines={1}>{item.vehicle_name || 'N/A'}</Text>
                    <Text style={styles.numberSubtext}>🔢 {item.vehicle_no || 'N/A'}</Text>
                    {item.vehicle_owner ? (
                      <Text style={styles.contactSubtext}>Owner: {item.vehicle_owner}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <View
                    style={[
                      styles.statusDot,
                      (item.vehicle_status || item.status || '').trim().toUpperCase() === 'ACTIVE'
                        ? styles.statusActiveDot
                        : styles.statusInactiveDot
                    ]}
                  />
                  <TouchableOpacity
                    style={styles.actionEditBtn}
                    onPress={() => navigation.navigate('AddVehicle', { vehicle: item })}
                  >
                    <Text style={styles.actionEditIcon}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionDeleteBtn}
                    onPress={() => handleDeleteVehicle(item.vehicle_id ?? item.vehicleId ?? item.id)}
                  >
                    <RedTrashIcon />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <BottomNav navigation={navigation} currentRoute="AdminVehicleList" />
    </SafeAreaView>
  );
};

const iconStyles = StyleSheet.create({
  trashContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trashHandle: {
    width: 6,
    height: 2,
    backgroundColor: '#DC2626',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    marginBottom: 1,
  },
  trashLid: {
    width: 14,
    height: 2,
    backgroundColor: '#DC2626',
    borderRadius: 1,
    marginBottom: 1,
  },
  trashBody: {
    width: 10,
    height: 10,
    backgroundColor: '#DC2626',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  trashLine: {
    width: 1.5,
    height: '100%',
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
});

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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
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
    borderRadius: 10,
    backgroundColor: '#E6F2F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 20,
  },
  vehicleMeta: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  numberSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#087E66',
    marginTop: 2,
  },
  contactSubtext: {
    fontSize: 11,
    color: '#64748B',
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
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionEditIcon: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#087E66',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
    opacity: 0.2,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
});

export default AdminVehicleListScreen;
