import React, { useState, useEffect } from 'react';
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
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Sidebar from '../../components/Sidebar';
import BottomNav from '../../components/BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../../config/config';

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

const ShopManagementScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form / Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShopId, setEditingShopId] = useState(null);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [areaName, setAreaName] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  // Areas selection / search states
  const [availableAreas, setAvailableAreas] = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  const fetchShops = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('No token found');
        return;
      }
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/shops`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setShops(data);
      } else {
        setError(data.error || 'Failed to fetch shops');
      }
    } catch (err) {
      console.error('Fetch shops error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/areas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setAvailableAreas(data);
      }
    } catch (err) {
      console.error('Error fetching areas for shop management:', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchShops();
      fetchAreas();
    }, [])
  );

  const resetForm = () => {
    setEditingShopId(null);
    setShopName('');
    setOwnerName('');
    setContactPerson('');
    setPhone('');
    setAddress('');
    setAreaName('');
    setStatus('ACTIVE');
    setAreaSearchQuery('');
    setShowAreaSuggestions(false);
  };

  const startEditShop = (shop) => {
    setEditingShopId(shop.shop_id);
    setShopName(shop.shop_name);
    setOwnerName(shop.owner_name || '');
    setContactPerson(shop.contact_person || '');
    setPhone(shop.phone || '');
    setAddress(shop.address || '');
    setAreaName(shop.area_name);
    setStatus(shop.status || 'ACTIVE');
    setAreaSearchQuery(shop.area_name || '');
    setShowAreaSuggestions(false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('Validation Error', 'Shop name is required.');
      return;
    }
    if (!areaName.trim()) {
      Alert.alert('Validation Error', 'Area name is required.');
      return;
    }

    const matchedArea = availableAreas.find(a => 
      (a.area_name || '').trim().toLowerCase() === areaName.trim().toLowerCase()
    );
    if (!matchedArea) {
      Alert.alert('Validation Error', 'Please select a valid Area Name from the suggested database list.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const payload = {
        shop_name: shopName.trim(),
        owner_name: ownerName.trim() || null,
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        area_name: areaName.trim(),
        status,
      };

      const url = editingShopId
        ? `${CONFIG.API_BASE_URL}/api/admin/shops/${editingShopId}`
        : `${CONFIG.API_BASE_URL}/api/admin/shops`;

      const method = editingShopId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', editingShopId ? 'Shop updated successfully!' : 'Shop added successfully!');
        setIsModalOpen(false);
        resetForm();
        fetchShops();
      } else {
        Alert.alert('Error', data.error || 'Failed to save shop details.');
      }
    } catch (err) {
      console.error('Save shop details error:', err);
      Alert.alert('Error', 'Network error. Failed to save shop details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (shop) => {
    Alert.alert(
      'Delete Shop',
      `Are you sure you want to delete "${shop.shop_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) return;
              const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/shops/${shop.shop_id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              const data = await response.json();
              if (response.ok) {
                Alert.alert('Success', 'Shop deleted successfully.');
                fetchShops();
              } else {
                Alert.alert('Error', data.error || 'Failed to delete shop.');
              }
            } catch (err) {
              console.error('Delete shop error:', err);
              Alert.alert('Error', 'Network error.');
            }
          }
        }
      ]
    );
  };

  const filteredShops = shops.filter(shop =>
    (shop.shop_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.owner_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.area_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.phone || '').includes(searchQuery)
  );

  const filteredAreas = availableAreas.filter(area =>
    (area.area_name || '').toLowerCase().includes(areaSearchQuery.toLowerCase())
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
          <Text style={styles.headerTitle}>SHOP MANAGEMENT</Text>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Text style={styles.newBtnText}>+ New Shop</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops by name, owner, area..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {loading && shops.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#087E66" />
              <Text style={styles.loadingText}>Loading shops...</Text>
            </View>
          ) : filteredShops.map((shop) => (
            <View key={shop.shop_id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.avatarIconContainer}>
                  <Text style={styles.avatarIcon}>🏪</Text>
                </View>
                <View style={styles.shopMeta}>
                  <Text style={styles.name} numberOfLines={1}>{shop.shop_name}</Text>
                  <Text style={styles.areaSubtext}>📍 {shop.area_name}</Text>
                  {shop.owner_name ? (
                    <Text style={styles.contactSubtext}>Owner: {shop.owner_name}</Text>
                  ) : null}
                  <Text style={styles.contactSubtext}>
                    {shop.phone || 'No phone'} • Balance: ₹{(shop.pending_balance || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <View
                  style={[
                    styles.statusDot,
                    (shop.status || '').trim().toUpperCase() === 'ACTIVE'
                      ? styles.statusActiveDot
                      : styles.statusInactiveDot
                  ]}
                />
                <TouchableOpacity
                  style={styles.actionEditBtn}
                  onPress={() => startEditShop(shop)}
                >
                  <Text style={styles.actionEditIcon}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionDeleteBtn}
                  onPress={() => handleDelete(shop)}
                >
                  <RedTrashIcon />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {!loading && filteredShops.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={styles.emptyText}>No shops found</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingShopId ? 'Edit Shop Details' : 'Add New Shop'}
              </Text>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shop Name *</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'shopName' && styles.inputFocused]}
                  placeholder="Enter shop name"
                  placeholderTextColor="#94A3B8"
                  value={shopName}
                  onChangeText={setShopName}
                  onFocus={() => setFocusedInput('shopName')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Owner Name</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'ownerName' && styles.inputFocused]}
                  placeholder="Enter owner name"
                  placeholderTextColor="#94A3B8"
                  value={ownerName}
                  onChangeText={setOwnerName}
                  onFocus={() => setFocusedInput('ownerName')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Person</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'contactPerson' && styles.inputFocused]}
                  placeholder="Enter contact person"
                  placeholderTextColor="#94A3B8"
                  value={contactPerson}
                  onChangeText={setContactPerson}
                  onFocus={() => setFocusedInput('contactPerson')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'phone' && styles.inputFocused]}
                  placeholder="Enter phone number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={[styles.inputGroup, { zIndex: 100 }]}>
                <Text style={styles.label}>Area Name *</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'areaName' && styles.inputFocused]}
                  placeholder="Type to search or enter area name..."
                  placeholderTextColor="#94A3B8"
                  value={areaName}
                  onChangeText={(text) => {
                    setAreaName(text);
                    setAreaSearchQuery(text);
                    setShowAreaSuggestions(true);
                  }}
                  onFocus={() => {
                    setFocusedInput('areaName');
                    setShowAreaSuggestions(true);
                  }}
                  onBlur={() => {
                    setFocusedInput(null);
                  }}
                />
                {showAreaSuggestions && (
                  <View style={styles.suggestionsContainer}>
                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                      {filteredAreas.map((area) => (
                        <TouchableOpacity
                          key={area.area_id}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setAreaName(area.area_name);
                            setAreaSearchQuery(area.area_name);
                            setShowAreaSuggestions(false);
                          }}
                        >
                          <Text style={styles.suggestionText}>{area.area_name}</Text>
                        </TouchableOpacity>
                      ))}
                      {filteredAreas.length === 0 && (
                        <View style={styles.suggestionItem}>
                          <Text style={[styles.suggestionText, { color: '#EF4444', fontStyle: 'italic' }]}>
                            No matching areas found in database
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, { height: 60 }, focusedInput === 'address' && styles.inputFocused]}
                  placeholder="Enter address"
                  placeholderTextColor="#94A3B8"
                  multiline={true}
                  value={address}
                  onChangeText={setAddress}
                  onFocus={() => setFocusedInput('address')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>


              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusRow}>
                  {['ACTIVE', 'INACTIVE'].map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.statusBtn,
                        status === item && (item === 'ACTIVE' ? styles.statusActiveBtn : styles.statusInactiveBtn)
                      ]}
                      onPress={() => setStatus(item)}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          status === item && styles.statusBtnTextActive
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingShopId ? 'Update Shop' : 'Create Shop'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} currentRoute="ShopManagement" />
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
  shopMeta: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  areaSubtext: {
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
    backgroundColor: '#94A3B8',
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeModalBtn: {
    padding: 4,
  },
  closeModalText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
  },
  modalFormContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#1E293B',
  },
  inputFocused: {
    borderColor: '#087E66',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  statusActiveBtn: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  statusInactiveBtn: {
    borderColor: '#94A3B8',
    backgroundColor: '#F1F5F9',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  statusBtnTextActive: {
    color: '#1E293B',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 20,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#087E66',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 160,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 1000,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
});

export default ShopManagementScreen;
