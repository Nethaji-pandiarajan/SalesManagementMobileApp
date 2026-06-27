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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/config';

const AddShopScreen = ({ navigation }) => {
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [areaName, setAreaName] = useState('');

  const [assignedAreas, setAssignedAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchAssignedAreas = async () => {
    setLoadingAreas(true);
    setFetchError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setFetchError('No authentication token found.');
        setLoadingAreas(false);
        return;
      }

      const response = await fetch(`${CONFIG.API_BASE_URL}/api/vehicle/assigned-shops`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        const rawAreas = data.areas_covered || '';
        const list = rawAreas.split(',').map(a => a.trim()).filter(Boolean);
        setAssignedAreas(list);
        if (list.length > 0) {
          setAreaName(list[0]);
        } else {
          setFetchError('No active route areas assigned to your current trip.');
        }
      } else {
        setFetchError(data.error || 'Failed to fetch assigned trip areas.');
      }
    } catch (err) {
      console.error('Fetch active trip areas error:', err);
      setFetchError('Network error. Unable to load assigned areas.');
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    fetchAssignedAreas();
  }, []);

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('Validation Error', 'Shop name is required.');
      return;
    }
    if (!areaName) {
      Alert.alert('Validation Error', 'Please select an assigned area.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        setSubmitting(false);
        return;
      }

      const payload = {
        shop_name: shopName.trim(),
        owner_name: ownerName.trim() || null,
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        area_name: areaName,
      };

      const response = await fetch(`${CONFIG.API_BASE_URL}/api/vehicle/add-shop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Shop added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to create shop.');
      }
    } catch (err) {
      console.error('Add shop submission error:', err);
      Alert.alert('Network Error', 'Unable to submit shop details to server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backBtnInner}>
            <Text style={styles.backBtnText}>❮</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>ADD NEW SHOP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Shop Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shop Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. City Supermarket"
              placeholderTextColor="#94A3B8"
              value={shopName}
              onChangeText={setShopName}
            />
          </View>

          {/* Area (Select Dropdown) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assigned Area *</Text>
            {loadingAreas ? (
              <View style={styles.loadingAreasContainer}>
                <ActivityIndicator size="small" color="#1E293B" />
                <Text style={styles.loadingAreasText}>Loading assigned areas...</Text>
              </View>
            ) : fetchError ? (
              <View style={styles.errorAreasContainer}>
                <Text style={styles.errorAreasText}>⚠️ {fetchError}</Text>
                <TouchableOpacity style={styles.retryAreasBtn} onPress={fetchAssignedAreas}>
                  <Text style={styles.retryAreasText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.dropdownBtn, areaDropdownOpen && styles.dropdownBtnActive]} 
                  onPress={() => setAreaDropdownOpen(v => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    📍 {areaName || 'Select Area'}
                  </Text>
                  <Text style={styles.dropdownArrow}>{areaDropdownOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {areaDropdownOpen && (
                  <View style={styles.dropdownList}>
                    {assignedAreas.map((area, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.dropdownItem, areaName === area && styles.dropdownItemActive]}
                        onPress={() => {
                          setAreaName(area);
                          setAreaDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dropdownItemText, areaName === area && styles.dropdownItemTextActive]}>
                          {area}
                        </Text>
                        {areaName === area && <Text style={styles.checkIcon}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Owner Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Owner Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              placeholderTextColor="#94A3B8"
              value={ownerName}
              onChangeText={setOwnerName}
            />
          </View>

          {/* Contact Person */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Person</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Jane Doe"
              placeholderTextColor="#94A3B8"
              value={contactPerson}
              onChangeText={setContactPerson}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +919443212345"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Madurai"
              placeholderTextColor="#94A3B8"
              value={city}
              onChangeText={setCity}
            />
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. 14, Mahal Vadampokki St"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, submitting && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={submitting || loadingAreas}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Shop</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnInner: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: 'bold',
    marginRight: 2,
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  loadingAreasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingAreasText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorAreasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorAreasText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  retryAreasBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryAreasText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownBtnActive: {
    borderColor: '#087E66',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownBtnText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: '#087E66',
    borderTopWidth: 0,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#E6F2F0',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  dropdownItemTextActive: {
    color: '#087E66',
    fontWeight: '700',
  },
  checkIcon: {
    fontSize: 14,
    color: '#087E66',
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default AddShopScreen;
