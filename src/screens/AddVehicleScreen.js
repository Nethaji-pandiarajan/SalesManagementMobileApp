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
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    if (!vehicleNo || !vehicleName) {
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
        vehicleNo,
        vehicleName,
        vehicleOwner,
        description,
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
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backBtnInner}>
            <Text style={styles.backBtnText}>❮</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>ADD NEW VEHICLE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. TN 01 AB 1234"
              value={vehicleNo}
              onChangeText={setVehicleNo}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Name / Model</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Tata Ace"
              value={vehicleName}
              onChangeText={setVehicleName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Owner</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              value={vehicleOwner}
              onChangeText={setVehicleOwner}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Additional details..."
              value={description}
              onChangeText={setDescription}
              multiline={true}
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
  headerRight: {
    width: 38,
  },
  content: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 25,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
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
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#10B981', // Green
  },
  statusBtnInactive: {
    backgroundColor: '#EF4444', // Red
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
    backgroundColor: '#1C1C1E',
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
