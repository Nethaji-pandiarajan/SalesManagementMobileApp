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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { globalShopsList } from './ShopsScreen';

const AddShopScreen = ({ navigation }) => {
  const [shopName, setShopName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [status, setStatus] = useState('Active');

  const handleSave = () => {
    if (!shopName || !areaName) {
      Alert.alert('Error', 'Please fill in shop name and area.');
      return;
    }

    const newShop = {
      id: String(globalShopsList.length + 1),
      shopName,
      areaName,
      balance: Number(initialBalance) || 0,
      status,
    };

    globalShopsList.push(newShop);

    Alert.alert('Success', 'Shop added successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
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

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shop Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. City Supermarket"
              value={shopName}
              onChangeText={setShopName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Downtown"
              value={areaName}
              onChangeText={setAreaName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Initial Balance (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={initialBalance}
              onChangeText={setInitialBalance}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusToggleContainer}>
              <TouchableOpacity
                style={[styles.statusBtn, status === 'Active' && styles.statusBtnActive]}
                onPress={() => setStatus('Active')}
              >
                <View style={styles.statusBtnContent}>
                  <View style={[styles.toggleDot, { backgroundColor: status === 'Active' ? '#FFFFFF' : '#10B981' }]} />
                  <Text style={[styles.statusBtnText, status === 'Active' && styles.statusBtnTextActive]}>Active</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, status === 'Inactive' && styles.statusBtnInactive]}
                onPress={() => setStatus('Inactive')}
              >
                <View style={styles.statusBtnContent}>
                  <View style={[styles.toggleDot, { backgroundColor: status === 'Inactive' ? '#FFFFFF' : '#EF4444' }]} />
                  <Text style={[styles.statusBtnText, status === 'Inactive' && styles.statusBtnTextActive]}>Inactive</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Shop</Text>
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

export default AddShopScreen;
