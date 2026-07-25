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

const AreaManagementScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form / Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [areaName, setAreaName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [submitting, setSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const fetchAreas = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('No token found');
        return;
      }
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/areas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setAreas(data);
      } else {
        setError(data.error || 'Failed to fetch areas');
      }
    } catch (err) {
      console.error('Fetch areas error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAreas();
    }, [])
  );

  const resetForm = () => {
    setEditingAreaId(null);
    setAreaName('');
    setDescription('');
    setStatus('ACTIVE');
  };

  const startEditArea = (area) => {
    setEditingAreaId(area.area_id);
    setAreaName(area.area_name);
    setDescription(area.description || '');
    setStatus(area.status || 'ACTIVE');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!areaName.trim()) {
      Alert.alert('Validation Error', 'Area name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const payload = {
        area_name: areaName.trim(),
        description: description.trim() || null,
        status,
      };

      const url = editingAreaId
        ? `${CONFIG.API_BASE_URL}/api/areas/${editingAreaId}`
        : `${CONFIG.API_BASE_URL}/api/areas`;

      const method = editingAreaId ? 'PUT' : 'POST';

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
        Alert.alert('Success', editingAreaId ? 'Area updated successfully!' : 'Area created successfully!');
        setIsModalOpen(false);
        resetForm();
        fetchAreas();
      } else {
        Alert.alert('Error', data.error || 'Failed to save area details.');
      }
    } catch (err) {
      console.error('Save area details error:', err);
      Alert.alert('Error', 'Network error. Failed to save area details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (area) => {
    Alert.alert(
      'Delete Area',
      `Are you sure you want to delete "${area.area_name}"? This will restrict assigning this area to future routes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) return;
              const response = await fetch(`${CONFIG.API_BASE_URL}/api/areas/${area.area_id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              const data = await response.json();
              if (response.ok) {
                Alert.alert('Success', 'Area deleted successfully.');
                fetchAreas();
              } else {
                Alert.alert('Error', data.error || 'Failed to delete area.');
              }
            } catch (err) {
              console.error('Delete area error:', err);
              Alert.alert('Error', 'Network error.');
            }
          }
        }
      ]
    );
  };

  const filteredAreas = areas.filter(area =>
    (area.area_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (area.description || '').toLowerCase().includes(searchQuery.toLowerCase())
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
          <Text style={styles.headerTitle}>AREA MANAGEMENT</Text>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Text style={styles.newBtnText}>+ New Area</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search areas by name or description..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {loading && areas.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#087E66" />
              <Text style={styles.loadingText}>Loading areas...</Text>
            </View>
          ) : filteredAreas.map((area) => (
            <View key={area.area_id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.avatarIconContainer}>
                  <Text style={styles.avatarIcon}>📍</Text>
                </View>
                <View style={styles.areaMeta}>
                  <Text style={styles.name} numberOfLines={1}>{area.area_name}</Text>
                  {area.description ? (
                    <Text style={styles.descriptionSubtext} numberOfLines={2}>
                      {area.description}
                    </Text>
                  ) : (
                    <Text style={[styles.descriptionSubtext, { fontStyle: 'italic', color: '#94A3B8' }]}>
                      No description provided
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.cardRight}>
                <View
                  style={[
                    styles.statusDot,
                    (area.status || '').trim().toUpperCase() === 'ACTIVE'
                      ? styles.statusActiveDot
                      : styles.statusInactiveDot
                  ]}
                />
                <TouchableOpacity
                  style={styles.actionEditBtn}
                  onPress={() => startEditArea(area)}
                >
                  <Text style={styles.actionEditIcon}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionDeleteBtn}
                  onPress={() => handleDelete(area)}
                >
                  <RedTrashIcon />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {!loading && filteredAreas.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.emptyText}>No areas found</Text>
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
                {editingAreaId ? 'Edit Area Details' : 'Create New Area'}
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
                <Text style={styles.label}>Area Name *</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'areaName' && styles.inputFocused]}
                  placeholder="Enter area name (e.g. Area A)"
                  placeholderTextColor="#94A3B8"
                  value={areaName}
                  onChangeText={areaName => setAreaName(areaName)}
                  onFocus={() => setFocusedInput('areaName')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 75 }, focusedInput === 'description' && styles.inputFocused]}
                  placeholder="Enter area description or details..."
                  placeholderTextColor="#94A3B8"
                  multiline={true}
                  value={description}
                  onChangeText={text => setDescription(text)}
                  onFocus={() => setFocusedInput('description')}
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
                    {editingAreaId ? 'Update Area' : 'Create Area'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} currentRoute="AreaManagement" />
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
  areaMeta: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  descriptionSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
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
});

export default AreaManagementScreen;
