import React, { useEffect, useState } from 'react';
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
import { useRoute } from '@react-navigation/native';
import { createVehicle, getStoredToken, updateVehicle } from '../services/vehicleService';

const AddVehicleScreen = ({ navigation }) => {
  const route = useRoute();
  const existingVehicle = route?.params?.vehicle;

  const [vehicleId, setVehicleId] = useState(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleOwner, setVehicleOwner] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  useEffect(() => {
    if (existingVehicle) {
      setVehicleId(existingVehicle.vehicle_id || existingVehicle.vehicleId || null);
      setVehicleNo(existingVehicle.vehicle_no || existingVehicle.vehicleNo || '');
      setVehicleName(existingVehicle.vehicle_name || existingVehicle.VehicleName || '');
      setVehicleOwner(existingVehicle.vehicle_owner || existingVehicle.vehicleOwner || '');
      setDescription(existingVehicle.description || '');
      setStatus(((existingVehicle.vehicle_status || existingVehicle.status || 'ACTIVE')).toString().toUpperCase());
    } else {
      setVehicleId(null);
      setVehicleNo('');
      setVehicleName('');
      setVehicleOwner('');
      setDescription('');
      setStatus('ACTIVE');
    }
  }, [existingVehicle?.vehicle_id || existingVehicle?.vehicleId]);

  const handleSave = async () => {
    if (!vehicleNo.trim() || !vehicleName.trim()) {
      Alert.alert('Error', 'Please fill in vehicle number and name.');
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
        vehicleNo: vehicleNo.trim(),
        vehicleName: vehicleName.trim(),
        vehicleOwner: vehicleOwner.trim() || null,
        description: description.trim() || null,
        status,
      };

      const { response, data } = vehicleId
        ? await updateVehicle(token, vehicleId, payload)
        : await createVehicle(token, payload);

      if (response.ok) {
        Alert.alert('Success', vehicleId ? 'Vehicle updated successfully!' : 'Vehicle added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to save vehicle.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save vehicle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backBtnInner}>
            <Text style={styles.backBtnText}>❮</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {vehicleId ? 'EDIT VEHICLE DETAILS' : 'ADD NEW VEHICLE'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Number *</Text>
            <TextInput
              style={[styles.input, focusedInput === 'vehicleNo' && styles.inputFocused]}
              placeholder="e.g. TN 01 AB 1234"
              placeholderTextColor="#94A3B8"
              value={vehicleNo}
              onChangeText={setVehicleNo}
              onFocus={() => setFocusedInput('vehicleNo')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Name / Model *</Text>
            <TextInput
              style={[styles.input, focusedInput === 'vehicleName' && styles.inputFocused]}
              placeholder="e.g. Tata Ace"
              placeholderTextColor="#94A3B8"
              value={vehicleName}
              onChangeText={setVehicleName}
              onFocus={() => setFocusedInput('vehicleName')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Owner</Text>
            <TextInput
              style={[styles.input, focusedInput === 'vehicleOwner' && styles.inputFocused]}
              placeholder="e.g. John Doe"
              placeholderTextColor="#94A3B8"
              value={vehicleOwner}
              onChangeText={setVehicleOwner}
              onFocus={() => setFocusedInput('vehicleOwner')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }, focusedInput === 'description' && styles.inputFocused]}
              placeholder="Additional details..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              onFocus={() => setFocusedInput('description')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusToggleContainer}>
              <TouchableOpacity
                style={[styles.statusBtn, status === 'ACTIVE' && styles.statusBtnActive]}
                onPress={() => setStatus('ACTIVE')}
              >
                <View style={styles.statusBtnContent}>
                  <View style={[styles.toggleDot, { backgroundColor: status === 'ACTIVE' ? '#FFFFFF' : '#10B981' }]} />
                  <Text style={[styles.statusBtnText, status === 'ACTIVE' && styles.statusBtnTextActive]}>Active</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, status === 'INACTIVE' && styles.statusBtnInactive]}
                onPress={() => setStatus('INACTIVE')}
              >
                <View style={styles.statusBtnContent}>
                  <View style={[styles.toggleDot, { backgroundColor: status === 'INACTIVE' ? '#FFFFFF' : '#EF4444' }]} />
                  <Text style={[styles.statusBtnText, status === 'INACTIVE' && styles.statusBtnTextActive]}>Inactive</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>{vehicleId ? 'Update Vehicle' : 'Save Vehicle'}</Text>
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
    backgroundColor: '#087E66',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerRight: {
    width: 38,
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
  inputFocused: {
    borderColor: '#087E66',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  statusBtnActive: {
    backgroundColor: '#10B981',
  },
  statusBtnInactive: {
    backgroundColor: '#EF4444',
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
  },
  statusBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  saveBtn: {
    backgroundColor: '#087E66',
    borderRadius: 14,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default AddVehicleScreen;
