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
import { globalUsersList } from './UserListScreen';

const AddUserScreen = ({ navigation, route }) => {
  const { user } = route.params || {};

  const [username, setUsername] = useState(user ? user.username : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [phone, setPhone] = useState(user ? user.phone : '');
  const [roleId, setRoleId] = useState(user ? user.role_id : 2); // 1: Admin, 2: Executive
  const [address, setAddress] = useState(user ? user.address : '');
  const [stateName, setStateName] = useState(user ? user.state : 'Tamil Nadu');
  const [status, setStatus] = useState(user ? user.status : 'ACTIVE');

  const handleSave = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please fill in Username.');
      return;
    }

    if (user) {
      // Update existing user in global list
      const updatedUser = {
        ...user,
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role_id: roleId,
        address: address.trim(),
        state: stateName.trim(),
        status: status.toUpperCase(),
        updated_on: new Date().toISOString(),
        updated_by: 1,
      };

      const index = globalUsersList.findIndex(u => u.user_id === user.user_id);
      if (index !== -1) {
        globalUsersList[index] = updatedUser;
      }

      Alert.alert('Success', 'User updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      // Add new user to global list
      const newUser = {
        user_id: Math.max(...globalUsersList.map(u => u.user_id), 0) + 1,
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role_id: roleId,
        address: address.trim(),
        state: stateName.trim(),
        status: status.toUpperCase(),
        org_id: 1,
        created_by: 1,
        updated_by: 1,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
      };

      globalUsersList.push(newUser);

      Alert.alert('Success', 'User added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
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
          <Text style={styles.headerTitle}>{user ? 'EDIT USER' : 'ADD NEW USER'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. netha"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleToggleContainer}>
              <TouchableOpacity
                style={[styles.roleBtn, roleId === 2 && styles.roleBtnActive]}
                onPress={() => setRoleId(2)}
              >
                <Text style={[styles.roleBtnText, roleId === 2 && styles.roleBtnTextActive]}>Executive</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, roleId === 1 && styles.roleBtnActive]}
                onPress={() => setRoleId(1)}
              >
                <Text style={[styles.roleBtnText, roleId === 1 && styles.roleBtnTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. user@jogold.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Enter address details..."
              value={address}
              onChangeText={setAddress}
              multiline={true}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Tamil Nadu"
              value={stateName}
              onChangeText={setStateName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusToggleContainer}>
              <TouchableOpacity
                style={[styles.statusBtn, status.toUpperCase() === 'ACTIVE' && styles.statusBtnActive]}
                onPress={() => setStatus('ACTIVE')}
              >
                <View style={styles.statusBtnContent}>
                  <View style={[styles.toggleDot, { backgroundColor: status.toUpperCase() === 'ACTIVE' ? '#FFFFFF' : '#10B981' }]} />
                  <Text style={[styles.statusBtnText, status.toUpperCase() === 'ACTIVE' && styles.statusBtnTextActive]}>Active</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, status.toUpperCase() === 'INACTIVE' && styles.statusBtnInactive]}
                onPress={() => setStatus('INACTIVE')}
              >
                <View style={styles.statusBtnContent}>
                  <View style={[styles.toggleDot, { backgroundColor: status.toUpperCase() === 'INACTIVE' ? '#FFFFFF' : '#EF4444' }]} />
                  <Text style={[styles.statusBtnText, status.toUpperCase() === 'INACTIVE' && styles.statusBtnTextActive]}>Inactive</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{user ? 'Update User' : 'Save User'}</Text>
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
  content: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
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
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  roleBtnActive: {
    backgroundColor: '#087E66',
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
  },
  statusToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
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
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#087E66',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 40,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default AddUserScreen;
