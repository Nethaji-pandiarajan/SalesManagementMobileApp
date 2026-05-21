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

const AddCategoryScreen = ({ navigation, route }) => {
  const { category } = route.params || {};
  const [categoryName, setCategoryName] = useState(category ? category.categoryName : '');
  const [description, setDescription] = useState(category ? category.description : '');
  const [status, setStatus] = useState(category ? category.status : 'Active');

  const handleSave = () => {
    if (!categoryName) {
      Alert.alert('Error', 'Please fill in category name.');
      return;
    }

    if (category) {
      console.log('Updating category:', { ...category, categoryName, description, status });
      Alert.alert('Success', 'Category updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      const newCategoryData = {
        categoryId: Math.random().toString(36).substr(2, 9),
        categoryName,
        description,
        status,
        createdOn: new Date().toISOString(),
        updatedOn: new Date().toISOString(),
        createdBy: 'currentUser',
        orgId: 'org123',
      };

      console.log('Saving new category:', newCategoryData);

      Alert.alert('Success', 'Category added successfully!', [
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
          <Text style={styles.headerTitle}>{category ? 'EDIT CATEGORY' : 'ADD NEW CATEGORY'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Beverages"
              value={categoryName}
              onChangeText={setCategoryName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Describe this category..."
              value={description}
              onChangeText={setDescription}
              multiline={true}
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
          <Text style={styles.saveBtnText}>Save Category</Text>
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
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default AddCategoryScreen;
