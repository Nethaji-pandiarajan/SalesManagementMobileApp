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

const AddProductScreen = ({ navigation, route }) => {
  const { categoryId, product } = route.params || {};
  
  const [productName, setProductName] = useState(product ? product.productName : '');
  const [skuCode, setSkuCode] = useState(product ? product.sku_code : '');
  const [description, setDescription] = useState(product ? product.description : '');
  const [unit, setUnit] = useState(product ? product.unit : '');
  const [rate, setRate] = useState(product ? product.rate.toString() : '');
  const [status, setStatus] = useState(product ? product.status : 'Active');

  const handleSave = () => {
    if (!productName || !skuCode || !rate) {
      Alert.alert('Error', 'Please fill in Name, SKU, and Rate.');
      return;
    }

    if (product) {
      console.log('Updating product:', { ...product, productName, sku_code: skuCode, description, unit, rate: parseFloat(rate), status });
      Alert.alert('Success', 'Product updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      const newProductData = {
        productId: Math.random().toString(36).substr(2, 9),
        sku_code: skuCode,
        productName,
        description,
        categoryId,
        unit,
        rate: parseFloat(rate),
        status,
        createdOn: new Date().toISOString(),
        updatedOn: new Date().toISOString(),
        createdBy: 'currentUser',
        updatedBy: 'currentUser',
        orgId: 'org123',
      };

      console.log('Saving new product:', newProductData);

      Alert.alert('Success', 'Product added successfully!', [
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
          <Text style={styles.headerTitle}>{product ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Apple Juice"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKU Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BEV-001"
              value={skuCode}
              onChangeText={setSkuCode}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Liter, Kg, Piece"
              value={unit}
              onChangeText={setUnit}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rate (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={rate}
              onChangeText={setRate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Product details..."
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
          <Text style={styles.saveBtnText}>Save Product</Text>
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

export default AddProductScreen;
