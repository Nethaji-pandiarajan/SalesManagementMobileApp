import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Sidebar from '../components/Sidebar';
import { globalUsersList } from './UserListScreen';
import { globalVehiclesList } from './VehicleListScreen';
import BottomNav from '../components/BottomNav';
import CONFIG from '../config/config';
import { getStoredToken } from '../services/vehicleService';


// Custom universal red trash can icon
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

// 4 default oil types for load sheet generator
const DEFAULT_OIL_TYPES = [
  { id: '1', name: 'Jo Gold Chekku Gingelly Oil', defaultQty: '0' },
  { id: '2', name: 'Sri Lakshmi Chekku Gingelly Oil', defaultQty: '0' },
  { id: '3', name: 'Jo Gold Chekku Groundnut Oil', defaultQty: '0' },
  { id: '4', name: 'Maha Gold Deepam Oil', defaultQty: '0' },
];

const SupplyManagementScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'monitor'

  // Lists synced from database
  const [executives, setExecutives] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);
  const [tripInvoices, setTripInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [oilTypes, setOilTypes] = useState(DEFAULT_OIL_TYPES);
  const [areasList, setAreasList] = useState([]);

  const toggleAreaSelection = (areaId) => {
    const selectedIds = formAreas ? formAreas.split(',').filter(Boolean) : [];
    const idStr = String(areaId);
    let newIds;
    if (selectedIds.includes(idStr)) {
      newIds = selectedIds.filter(id => id !== idStr);
    } else {
      newIds = [...selectedIds, idStr];
    }
    setFormAreas(newIds.join(','));
  };

  // Modal / Plan Creator State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  // Date Filter State
  const [showTodayOnly, setShowTodayOnly] = useState(true);
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'vehicle'

  // Form State
  const [formDate, setFormDate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [formAreas, setFormAreas] = useState('');
  const [formOils, setFormOils] = useState({
    '1': '0',
    '2': '0',
    '3': '0',
    '4': '0',
  });

  // Dropdown visibility simulation
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);

  // Sync users/vehicles when focused
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getStoredToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      // 1. Fetch active users/executives
      const usersResponse = await fetch(`${CONFIG.API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersResponse.json();
      if (usersResponse.ok) {
        const activeUsers = usersData.filter(u => (u.status || '').toUpperCase() === 'ACTIVE' && (u.role_id === 2 || (u.role_name || '').toLowerCase() === 'sales executive'));
        setExecutives(activeUsers);
      }

      // 2. Fetch active vehicles
      const vehiclesResponse = await fetch(`${CONFIG.API_BASE_URL}/api/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const vehiclesData = await vehiclesResponse.json();
      if (vehiclesResponse.ok) {
        const vList = Array.isArray(vehiclesData.vehicles) ? vehiclesData.vehicles : Array.isArray(vehiclesData) ? vehiclesData : [];
        const activeVehicles = vList.filter(v => (v.status || v.vehicle_status || '').toUpperCase() === 'ACTIVE');
        setVehicles(activeVehicles);
      }

      // 3. Fetch products to build load sheet columns
      const productsResponse = await fetch(`${CONFIG.API_BASE_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (productsResponse.ok) {
        const categories = await productsResponse.json();
        const flatProducts = Array.isArray(categories) 
          ? categories.flatMap(c => c.products || []) 
          : [];
        if (flatProducts.length > 0) {
          const formattedOils = flatProducts.map(p => ({
            id: p.product_id.toString(),
            name: p.product_name,
            defaultQty: '0'
          }));
          setOilTypes(formattedOils);
        }
      }

      // 4. Fetch areas
      const areasResponse = await fetch(`${CONFIG.API_BASE_URL}/api/areas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const areasData = await areasResponse.json();
      if (areasResponse.ok) {
        setAreasList(areasData || []);
      }

      // 5. Fetch supply plans & invoices
      const supplyResponse = await fetch(`${CONFIG.API_BASE_URL}/api/admin/supply`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const supplyData = await supplyResponse.json();
      if (supplyResponse.ok) {
        setRecords(supplyData.records || []);
        setTripInvoices(supplyData.invoices || []);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('Network error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const getVehicleInfo = (id) => {
    const v = vehicles.find(item => String(item.vehicle_id || item.vehicleId || '') === String(id)) || 
              globalVehiclesList.find(item => String(item.vehicle_id || item.vehicleId || '') === String(id));
    return v ? `${v.vehicle_name || v.VehicleName} (${v.vehicle_no || v.vehicleNo})` : 'Unknown Vehicle';
  };

  const getUserInfo = (id) => {
    const u = executives.find(item => item.user_id === Number(id)) || 
              globalUsersList.find(item => item.user_id === Number(id));
    return u ? u.username : 'Unknown Executive';
  };

  // Open Form for Adding New Record
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    setSelectedVehicleId(vehicles.length > 0 ? String(vehicles[0].vehicle_id || vehicles[0].vehicleId) : '');
    setSelectedUserId(executives.length > 0 ? String(executives[0].user_id) : '');
    setFormAreas('');
    const initialOils = {};
    oilTypes.forEach(oil => {
      initialOils[oil.id] = '0';
    });
    setFormOils(initialOils);
    setSelectedRecordId(null);
    setIsModalOpen(true);
  };

  // Open Form for Editing Existing Record
  const handleOpenEdit = (record) => {
    setFormDate(record.date);
    setSelectedVehicleId(String(record.vehicle_id));
    setSelectedUserId(String(record.user_id));
    setFormAreas(record.areas_covered);
    setFormOils({ ...record.oils });
    setSelectedRecordId(record.supply_id);
    setIsModalOpen(true);
  };

  const handleOilQtyChange = (oilId, value) => {
    // Sanitize to numerical string
    const sanitized = value.replace(/[^0-9.]/g, '');
    setFormOils(prev => ({
      ...prev,
      [oilId]: sanitized || '0',
    }));
  };

  const handleSave = async () => {
    if (!formDate.trim()) {
      Alert.alert('Error', 'Please enter a valid date.');
      return;
    }
    if (!selectedVehicleId) {
      Alert.alert('Error', 'Please select a vehicle.');
      return;
    }
    if (!selectedUserId) {
      Alert.alert('Error', 'Please select an executive.');
      return;
    }
    if (!formAreas.trim()) {
      Alert.alert('Error', 'Please enter areas covered.');
      return;
    }

    setLoading(true);
    try {
      const token = await getStoredToken();
      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please log in again.');
        return;
      }

      const payload = {
        date: formDate,
        vehicle_id: parseInt(selectedVehicleId, 10),
        user_id: parseInt(selectedUserId, 10),
        areas_covered: formAreas,
        oils: formOils,
      };

      const url = selectedRecordId
        ? `${CONFIG.API_BASE_URL}/api/admin/supply/${selectedRecordId}`
        : `${CONFIG.API_BASE_URL}/api/admin/supply`;

      const method = selectedRecordId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', selectedRecordId ? 'Plan updated successfully!' : 'Daily Plan & Load Sheet created successfully!');
        setIsModalOpen(false);
        await fetchData();
      } else {
        Alert.alert('Error', data.error || 'Failed to save supply record.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save supply record.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getStoredToken();
              if (!token) {
                Alert.alert('Error', 'No authentication token found. Please log in again.');
                return;
              }

              const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/supply/${id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();
              if (response.ok) {
                Alert.alert('Success', 'Plan deleted successfully!');
                await fetchData();
              } else {
                Alert.alert('Error', data.error || 'Failed to delete plan.');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete plan.');
            }
          },
        },
      ]
    );
  };

  const filteredRecords = records.filter(rec => {
    const driverName = getUserInfo(rec.user_id).toLowerCase();
    const vehicleInfo = getVehicleInfo(rec.vehicle_id).toLowerCase();
    const areas = (rec.area_names || rec.areas_covered || '').toLowerCase();
    const date = rec.date;
    const query = searchQuery.toLowerCase();

    const matchesSearch = driverName.includes(query) || vehicleInfo.includes(query) || areas.includes(query) || date.includes(query);

    if (showTodayOnly) {
      const todayDate = new Date().toISOString().split('T')[0];
      return matchesSearch && rec.date === todayDate;
    }
    return matchesSearch;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date) - new Date(a.date);
    } else {
      const vehicleA = getVehicleInfo(a.vehicle_id).toLowerCase();
      const vehicleB = getVehicleInfo(b.vehicle_id).toLowerCase();
      return vehicleA.localeCompare(vehicleB);
    }
  });

  const groupedRecords = {};
  sortedRecords.forEach(rec => {
    const key = sortBy === 'date' ? rec.date : getVehicleInfo(rec.vehicle_id);
    if (!groupedRecords[key]) {
      groupedRecords[key] = [];
    }
    groupedRecords[key].push(rec);
  });

  const groupKeys = Object.keys(groupedRecords).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b) - new Date(a);
    } else {
      return a.localeCompare(b);
    }
  });

  const formatDateString = (dateStr) => {
    try {
      const todayDateStr = new Date().toISOString().split('T')[0];
      if (dateStr === todayDateStr) {
        return `TODAY • ${dateStr}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
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
        <TouchableOpacity style={styles.menuBtn} onPress={() => setIsSidebarOpen(true)}>
          <Text style={styles.menuIconText}>☰</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>SUPPLY MANAGEMENT</Text>
        </View>

        <TouchableOpacity style={styles.newBtn} onPress={handleOpenAdd}>
          <Text style={styles.newBtnText}>+ Create Plan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}
        {loading && records.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#087E66" />
          </View>
        ) : (
          <>
            {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'plans' && styles.activeTabButton]}
            onPress={() => setActiveTab('plans')}
          >
            <Text style={[styles.tabText, activeTab === 'plans' && styles.activeTabText]}>
              Daily Plans & Loads
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'monitor' && styles.activeTabButton]}
            onPress={() => setActiveTab('monitor')}
          >
            <Text style={[styles.tabText, activeTab === 'monitor' && styles.activeTabText]}>
              Active Trip Monitor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search driver, vehicle or area..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Modern Sort & Filter Chips */}
        <View style={styles.chipsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScrollContent}>
            {/* Filter Date Chips */}
            <TouchableOpacity
              style={[styles.chip, showTodayOnly && styles.activeChip]}
              onPress={() => setShowTodayOnly(true)}
            >
              <Text style={[styles.chipText, showTodayOnly && styles.activeChipText]}>
                📅 Today's Data
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, !showTodayOnly && styles.activeChip]}
              onPress={() => setShowTodayOnly(false)}
            >
              <Text style={[styles.chipText, !showTodayOnly && styles.activeChipText]}>
                🗓️ All Dates
              </Text>
            </TouchableOpacity>

            <View style={styles.chipDivider} />

            {/* Sort Chips */}
            <TouchableOpacity
              style={[styles.chip, sortBy === 'date' && styles.activeChip]}
              onPress={() => setSortBy('date')}
            >
              <Text style={[styles.chipText, sortBy === 'date' && styles.activeChipText]}>
                Sort: Date ⬇️
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, sortBy === 'vehicle' && styles.activeChip]}
              onPress={() => setSortBy('vehicle')}
            >
              <Text style={[styles.chipText, sortBy === 'vehicle' && styles.activeChipText]}>
                Sort: Vehicle 🚚
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {activeTab === 'plans' ? (
          /* Daily Plans Scrollable List */
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {groupKeys.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No supply records found.</Text>
              </View>
            ) : (
              groupKeys.map(groupKey => (
                <View key={groupKey}>
                  {/* Group Section Header */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>
                      {sortBy === 'date' ? formatDateString(groupKey) : groupKey}
                    </Text>
                  </View>

                  {groupedRecords[groupKey].map(rec => (
                    <View key={rec.supply_id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View>
                          <Text style={styles.cardDate}>{rec.date}</Text>
                          <Text style={styles.cardVehicle}>{getVehicleInfo(rec.vehicle_id)}</Text>
                        </View>
                        <View style={styles.cardActions}>
                          <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(rec)}>
                            <Text style={styles.editBtnText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(rec.supply_id)}>
                            <RedTrashIcon />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Plan details */}
                      <View style={styles.cardDetail}>
                        <Text style={styles.detailLabel}>Driver:</Text>
                        <Text style={styles.detailValue}>{getUserInfo(rec.user_id)}</Text>
                      </View>
                      <View style={styles.cardDetail}>
                        <Text style={styles.detailLabel}>Areas:</Text>
                        <Text style={styles.detailValue}>{rec.area_names || rec.areas_covered}</Text>
                      </View>

                      <View style={styles.divider} />

                      {/* Load Sheet Section */}
                      <Text style={styles.loadSheetTitle}>Morning Load Sheet (Liters/Units)</Text>
                      <View style={styles.oilGrid}>
                        {oilTypes.map(oil => {
                          const qty = rec.oils[oil.id] || '0';
                          return (
                            <View key={oil.id} style={styles.oilGridItem}>
                              <Text style={oil.id} numberOfLines={1}>{oil.name}</Text>
                              <Text style={styles.oilQty}>{qty}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          /* Active Trip Monitor Scrollable List Grouped by Date/Vehicle */
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {groupKeys.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No active trips found.</Text>
              </View>
            ) : (
              groupKeys.map(groupKey => (
                <View key={groupKey}>
                  {/* Group Section Header */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>
                      {sortBy === 'date' ? formatDateString(groupKey) : groupKey}
                    </Text>
                  </View>

                  {groupedRecords[groupKey].map(rec => {
                    // Calculate Loaded Totals
                    const totalLoaded = Object.values(rec.oils).reduce((sum, q) => sum + (parseFloat(q) || 0), 0);
                    
                    // Filter invoices for this trip
                    const invoices = tripInvoices.filter(inv => inv.supply_id === rec.supply_id);
                    
                    // Calculate Sold Totals
                    const totalSold = invoices.reduce((sum, inv) => sum + inv.qty, 0);
                    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.value, 0);
                    
                    // Calculate Progress percentage
                    const progressPercent = totalLoaded > 0 ? Math.min(Math.round((totalSold / totalLoaded) * 100), 100) : 0;

                    return (
                      <View key={rec.supply_id} style={styles.card}>
                        {/* Header */}
                        <View style={styles.cardHeader}>
                          <View style={styles.flex1}>
                            <Text style={styles.cardDate}>{rec.date}</Text>
                            <Text style={styles.cardVehicle}>{getVehicleInfo(rec.vehicle_id)}</Text>
                          </View>
                        </View>

                        {/* Trip details */}
                        <View style={styles.cardDetail}>
                          <Text style={styles.detailLabel}>Driver:</Text>
                          <Text style={styles.detailValue}>{getUserInfo(rec.user_id)}</Text>
                        </View>
                        <View style={styles.cardDetail}>
                          <Text style={styles.detailLabel}>Areas:</Text>
                          <Text style={styles.detailValue}>{rec.area_names || rec.areas_covered}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Progress Bar */}
                        <View style={styles.progressHeaderRow}>
                          <Text style={styles.progressLabel}>Stock Sold Progress</Text>
                          <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                        </View>

                        <View style={styles.statsSummaryRow}>
                          <View style={styles.statsSummaryItem}>
                            <Text style={styles.statsLabel}>Total Loaded</Text>
                            <Text style={styles.statsValue}>{totalLoaded} L</Text>
                          </View>
                          <View style={styles.statsSummaryItem}>
                            <Text style={styles.statsLabel}>Total Sold</Text>
                            <Text style={styles.statsValue}>{totalSold} L</Text>
                          </View>
                          <View style={styles.statsSummaryItem}>
                            <Text style={styles.statsLabel}>Revenue</Text>
                            <Text style={styles.statsValueColor}>₹{totalRevenue.toLocaleString()}</Text>
                          </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Submitted Invoices Feed list */}
                        <Text style={styles.feedTitle}>Submitted Invoices Feed</Text>
                        {invoices.length === 0 ? (
                          <View style={styles.emptyFeed}>
                            <Text style={styles.emptyFeedText}>No invoices submitted yet today.</Text>
                          </View>
                        ) : (
                          invoices.map((inv, idx) => {
                            const oilType = oilTypes.find(o => o.id === inv.oil_id);
                            const oilName = oilType ? oilType.name : 'Oil';
                            return (
                              <View key={`${inv.invoice_id}-${inv.oil_id}-${idx}`} style={styles.invoiceItem}>
                                <View style={styles.flex1}>
                                  <View style={styles.invoiceHeaderRow}>
                                    <Text style={styles.invoiceShopName}>{inv.shopName}</Text>
                                    <Text style={styles.invoiceTime}>{inv.time}</Text>
                                  </View>
                                  <Text style={styles.invoiceDetails}>
                                    {oilName} • {inv.qty} L sold
                                  </Text>
                                </View>
                                <View style={styles.invoiceValueContainer}>
                                  <Text style={styles.invoiceValueText}>₹{inv.value}</Text>
                                </View>
                              </View>
                            );
                          })
                        )}
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        )}
          </>
        )}
      </View>

      {/* Daily Plan Creator & Load Sheet Generator Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedRecordId ? 'EDIT DAILY PLAN' : 'CREATE DAILY PLAN'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Daily Plan Creator Fields */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Daily Plan Creator</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2026-05-21"
                    placeholderTextColor="#94A3B8"
                    value={formDate}
                    onChangeText={setFormDate}
                  />
                </View>

                {/* Vehicle Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Vehicle</Text>
                  <TouchableOpacity
                    style={styles.pickerSelector}
                    onPress={() => {
                      setShowVehiclePicker(!showVehiclePicker);
                      setShowUserPicker(false);
                    }}
                  >
                    <Text style={styles.pickerSelectorText}>
                      {selectedVehicleId ? getVehicleInfo(selectedVehicleId) : 'Choose a Vehicle'}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>
                  {showVehiclePicker && (
                    <View style={styles.pickerDropdown}>
                      {vehicles.map(v => {
                        const vId = String(v.vehicle_id || v.vehicleId);
                        const vName = v.vehicle_name || v.VehicleName || '';
                        const vNo = v.vehicle_no || v.vehicleNo || '';
                        return (
                          <TouchableOpacity
                            key={vId}
                            style={styles.pickerOption}
                            onPress={() => {
                              setSelectedVehicleId(vId);
                              setShowVehiclePicker(false);
                            }}
                          >
                            <Text style={styles.pickerOptionText}>
                              {vName} ({vNo})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Driver / Executive Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Driver / Executive</Text>
                  <TouchableOpacity
                    style={styles.pickerSelector}
                    onPress={() => {
                      setShowUserPicker(!showUserPicker);
                      setShowVehiclePicker(false);
                    }}
                  >
                    <Text style={styles.pickerSelectorText}>
                      {selectedUserId ? getUserInfo(selectedUserId) : 'Choose a Driver'}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>
                  {showUserPicker && (
                    <View style={styles.pickerDropdown}>
                      {executives.map(u => (
                        <TouchableOpacity
                          key={u.user_id}
                          style={styles.pickerOption}
                          onPress={() => {
                            setSelectedUserId(String(u.user_id));
                            setShowUserPicker(false);
                          }}
                        >
                          <Text style={styles.pickerOptionText}>{u.username}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Areas Covered</Text>
                  {areasList.length === 0 ? (
                    <Text style={styles.emptyAreasText}>No active areas found.</Text>
                  ) : (
                    <View style={styles.areasSelectGrid}>
                      {areasList.map(area => {
                        const isSelected = (formAreas ? formAreas.split(',').filter(Boolean) : []).includes(String(area.area_id));
                        return (
                          <TouchableOpacity
                            key={area.area_id}
                            style={[
                              styles.areaChip,
                              isSelected && styles.areaChipSelected
                            ]}
                            onPress={() => toggleAreaSelection(area.area_id)}
                          >
                            <Text style={[
                              styles.areaChipText,
                              isSelected && styles.areaChipTextSelected
                            ]}>
                              {area.area_name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>

              {/* Load Sheet Generator Fields */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Morning Load Sheet Generator</Text>
                <Text style={styles.sectionSubtitle}>Enter quantities loaded for the 4 oil types:</Text>

                {oilTypes.map(oil => (
                  <View key={oil.id} style={styles.oilInputRow}>
                    <Text style={styles.oilInputLabel}>{oil.name}</Text>
                    <TextInput
                      style={styles.oilQtyInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                      value={formOils[oil.id]}
                      onChangeText={(val) => handleOilQtyChange(oil.id, val)}
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {selectedRecordId ? 'Update Supply Record' : 'Save Supply Record'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <BottomNav navigation={navigation} currentRoute="SupplyManagement" />
    </SafeAreaView>
  );
};

const iconStyles = StyleSheet.create({
  trashContainer: {
    width: 20,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trashHandle: {
    width: 6,
    height: 2,
    backgroundColor: '#EF4444',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    marginBottom: 1,
  },
  trashLid: {
    width: 16,
    height: 2,
    backgroundColor: '#EF4444',
    borderRadius: 1,
    marginBottom: 2,
  },
  trashBody: {
    width: 12,
    height: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  trashLine: {
    width: 1.5,
    height: 6,
    backgroundColor: '#EF4444',
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
  emptyState: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  cardVehicle: {
    fontSize: 12,
    color: '#087E66',
    fontWeight: '700',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 14,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetail: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    width: 60,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  loadSheetTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  oilGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  oilGridItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oilName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    flex: 1,
    marginRight: 4,
  },
  oilQty: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalForm: {
    padding: 16,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#087E66',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
    zIndex: 100, // Handle overlay picker layering
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerSelectorText: {
    fontSize: 14,
    color: '#1E293B',
  },
  pickerArrow: {
    fontSize: 10,
    color: '#64748B',
  },
  pickerDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    padding: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#1E293B',
  },
  oilInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  oilInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  oilQtyInput: {
    width: 80,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
    padding: 0,
  },
  saveBtn: {
    backgroundColor: '#087E66',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#087E66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 10,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabText: {
    color: '#087E66',
  },
  submitInvoiceMiniBtn: {
    backgroundColor: '#087E66',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  submitInvoiceMiniBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#087E66',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  statsSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statsValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  statsValueColor: {
    fontSize: 13,
    fontWeight: '800',
    color: '#087E66',
  },
  feedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyFeed: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyFeedText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  invoiceShopName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  invoiceTime: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
    marginLeft: 6,
  },
  invoiceDetails: {
    fontSize: 11,
    color: '#64748B',
  },
  invoiceValueContainer: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  invoiceValueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#087E66',
  },
  priceDetailContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  priceDetailText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#087E66',
  },
  flex1: {
    flex: 1,
  },
  chipsRow: {
    marginBottom: 12,
  },
  chipsScrollContent: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#087E66',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  chipDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#CBD5E1',
    marginRight: 8,
  },
  sectionHeader: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  areasSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  areaChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  areaChipSelected: {
    backgroundColor: '#087E66',
    borderColor: '#087E66',
  },
  areaChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  areaChipTextSelected: {
    color: '#FFFFFF',
  },
  emptyAreasText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SupplyManagementScreen;
