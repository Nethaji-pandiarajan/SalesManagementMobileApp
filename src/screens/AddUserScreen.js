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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/config';

const AddUserScreen = ({ navigation, route }) => {
  const { user } = route.params || {};

  const [roles, setRoles] = useState([]);
  const [username, setUsername] = useState(user ? user.username : '');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(user ? user.email : '');
  const [phone, setPhone] = useState(user ? user.phone : '');
  const [roleId, setRoleId] = useState(user ? user.role_id : 2); // 1: Admin, 2: Executive
  const [address, setAddress] = useState(user ? user.address : '');
  const [stateName, setStateName] = useState(user ? user.state : 'Tamil Nadu');
  const [status, setStatus] = useState(user ? (user.status || '').trim().toUpperCase() : 'ACTIVE');

  // Fetch organization roles dynamically
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/roles`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setRoles(data);
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    };
    fetchRoles();
  }, []);

  // Synchronize form values when route parameters or fetched roles update
  useEffect(() => {
    const { user: currentUser } = route.params || {};
    const execRole = roles.find(r => r.role_name.toLowerCase().includes('executive'));
    const defaultRoleId = execRole ? execRole.role_id : 2;

    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setRoleId(currentUser.role_id || defaultRoleId);
      setAddress(currentUser.address || '');
      setStateName(currentUser.state || 'Tamil Nadu');
      setStatus((currentUser.status || '').trim().toUpperCase() || 'ACTIVE');
    } else {
      setUsername('');
      setEmail('');
      setPhone('');
      setRoleId(defaultRoleId);
      setAddress('');
      setStateName('Tamil Nadu');
      setStatus('ACTIVE');
    }
    setPassword('');
  }, [route.params, roles]);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please fill in Username.');
      return;
    }
    if (!user && !password.trim()) {
      Alert.alert('Error', 'Please fill in Password.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        return;
      }

      const bodyData = {
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status: status.toUpperCase(),
        address: address.trim(),
        state: stateName.trim(),
        role_id: roleId,
      };

      if (password.trim()) {
        bodyData.password = password.trim();
      }

      if (user) {
        // PUT request to update
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/${user.user_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });

        const data = await response.json();
        if (response.ok) {
          Alert.alert('Success', 'User updated successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Error', data.error || 'Failed to update user.');
        }
      } else {
        // POST request to create
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });

        const data = await response.json();
        if (response.ok) {
          Alert.alert('Success', 'User added successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Error', data.error || 'Failed to add user.');
        }
      }
    } catch (err) {
      console.error('Save user error:', err);
      Alert.alert('Error', 'Network error. Failed to save user.');
    }
  };

  const adminRole = roles.find(r => r.role_name === 'Admin');
  const execRole = roles.find(r => r.role_name.toLowerCase().includes('executive'));

  const adminRoleId = adminRole ? adminRole.role_id : 1;
  const execRoleId = execRole ? execRole.role_id : 2;

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
            <Text style={styles.label}>{user ? 'New Password (Optional)' : 'Password'}</Text>
            <TextInput
              style={styles.input}
              placeholder={user ? 'Leave blank to keep current' : 'Enter password'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleToggleContainer}>
              <TouchableOpacity
                style={[styles.roleBtn, roleId === execRoleId && styles.roleBtnActive]}
                onPress={() => setRoleId(execRoleId)}
              >
                <Text style={[styles.roleBtnText, roleId === execRoleId && styles.roleBtnTextActive]}>Executive</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, roleId === adminRoleId && styles.roleBtnActive]}
                onPress={() => setRoleId(adminRoleId)}
              >
                <Text style={[styles.roleBtnText, roleId === adminRoleId && styles.roleBtnTextActive]}>Admin</Text>
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
