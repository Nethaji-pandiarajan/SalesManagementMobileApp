import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import CONFIG from '../config/config';
import DatePickerModal from '../components/DatePickerModal';

const { width, height } = Dimensions.get('window');

const INITIAL_PREORDERS = [
  {
    preorder_id: 'pre_1',
    shop_id: 'shop_1',
    shop_name: 'Mahalakshmi Provision Store',
    sales_executive: 'rajan',
    amount: 7000,
    preorder_date: '2026-07-09',
    delivery_date: '2026-07-11',
    status: 'PENDING',
    items: [
      {
        product_name: 'JO GOLD 1 Ltr',
        quantity: 10,
        amount: 3400,
      },
      {
        product_name: 'JO GOLD 500 ml',
        quantity: 20,
        amount: 3600,
      }
    ]
  },
  {
    preorder_id: 'pre_2',
    shop_id: 'shop_2',
    shop_name: 'Pandian Oil Distributor',
    sales_executive: 'rajan',
    amount: 3600,
    preorder_date: '2026-07-08',
    delivery_date: '2026-07-10',
    status: 'COMPLETED',
    items: [
      {
        product_name: 'JO GOLD 500 ml',
        quantity: 20,
        amount: 3600,
      }
    ]
  }
];

const PreorderScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Driver' };
  const { userData } = useAuth();
  
  // Sales executive name is resolved from auth session or route params
  const executiveName = userData?.name || userData?.email?.split('@')[0] || username || 'Sales Executive';
  const isAdmin = userData?.role === 'admin' || userData?.role_id === 1 || userData?.role_id === 3 || userData?.role_name?.toLowerCase() === 'admin';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [preorders, setPreorders] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Selection States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Preorder Form States
  const [editingPreorderId, setEditingPreorderId] = useState(null);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [selectedShopName, setSelectedShopName] = useState('');
  const [preorderItems, setPreorderItems] = useState([]);
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [preorderStatus, setPreorderStatus] = useState('PENDING');
  const [preorderPaidAmount, setPreorderPaidAmount] = useState('0');
  const [preorderPaymentType, setPreorderPaymentType] = useState('CASH');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Category & Product Cascade States
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductName, setSelectedProductName] = useState('');
  const [selectedProductRate, setSelectedProductRate] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    loadPreorders();
    fetchAssignedShops();
    fetchCategories();
  }, []);

  const loadPreorders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/preorders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setPreorders(data);
      } else {
        Alert.alert('Error', data.error || 'Failed to load preorders.');
      }
    } catch (e) {
      console.error('Error loading preorders:', e);
      Alert.alert('Error', 'Network error. Unable to load preorders.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedShops = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/vehicle/assigned-shops`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const flattenedShops = [];
        if (data.shops_by_area) {
          Object.entries(data.shops_by_area).forEach(([area, list]) => {
            list.forEach(shop => {
              flattenedShops.push({ shop_id: shop.shop_id, shop_name: shop.shop_name, area_name: area });
            });
          });
        }
        setShops(flattenedShops);
      }
    } catch (err) {
      console.error('Error fetching assigned shops for preorders:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/categories`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCategories(data.map(c => ({ category_id: String(c.category_id), category_name: c.category_name })));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProductsByCategory = async (categoryId) => {
    setLoadingProducts(true);
    setCategoryProducts([]);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/products?category_id=${categoryId}`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCategoryProducts(data.map(p => ({
          product_id: String(p.product_id),
          product_name: p.product_name,
          rate: Number(p.rate || 0),
          unit: p.unit || '',
        })));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSavePreorder = async () => {
    if (!selectedShopId) {
      Alert.alert('Error', 'Please select a shop.');
      return;
    }
    if (preorderItems.length === 0) {
      Alert.alert('Error', 'Please add at least one product to the preorder list.');
      return;
    }
    if (!deliveryDate.trim()) {
      Alert.alert('Error', 'Please enter a delivery date.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const payload = {
        shop_id: parseInt(selectedShopId, 10),
        delivery_date: deliveryDate.trim(),
        status: preorderStatus,
        paid_amount: preorderStatus === 'COMPLETED' ? parseFloat(preorderPaidAmount || 0) : 0,
        payment_type: preorderStatus === 'COMPLETED' ? preorderPaymentType : 'CREDIT',
        items: preorderItems.map(item => ({
          product_id: parseInt(item.product_id, 10),
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.amount) / parseFloat(item.quantity)
        }))
      };

      let response;
      if (editingPreorderId) {
        response = await fetch(`${CONFIG.API_BASE_URL}/api/preorders/${editingPreorderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${CONFIG.API_BASE_URL}/api/preorders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      if (response.ok) {
        setIsModalOpen(false);
        resetForm();
        loadPreorders();
        Alert.alert('Success', editingPreorderId ? 'Preorder updated successfully!' : 'Preorder added successfully!');
      } else {
        Alert.alert('Error', data.error || 'Failed to save preorder.');
      }
    } catch (e) {
      console.error('Error saving preorder:', e);
      Alert.alert('Error', 'Network error. Failed to save preorder.');
    }
  };

  const startEditPreorder = (item) => {
    setEditingPreorderId(item.preorder_id);
    setSelectedShopId(item.shop_id);
    setSelectedShopName(item.shop_name);
    setPreorderItems(item.items || [
      // Fallback for legacy format
      {
        product_name: item.product_name || 'Legacy Product',
        quantity: item.quantity || 0,
        amount: item.amount || 0,
      }
    ]);
    setDeliveryDate(item.delivery_date);
    setPreorderStatus(item.status);
    setPreorderPaidAmount('0');
    setPreorderPaymentType('CASH');
    setIsModalOpen(true);
  };

  const handleDeletePreorder = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this preorder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) return;

              const response = await fetch(`${CONFIG.API_BASE_URL}/api/preorders/${id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              const data = await response.json();
              if (response.ok) {
                loadPreorders();
                Alert.alert('Success', 'Preorder deleted successfully!');
              } else {
                Alert.alert('Error', data.error || 'Failed to delete preorder.');
              }
            } catch (e) {
              console.error('Error deleting preorder:', e);
              Alert.alert('Error', 'Network error. Failed to delete preorder.');
            }
          }
        }
      ]
    );
  };

  const toggleStatus = async (id) => {
    const preorder = preorders.find(item => item.preorder_id === id);
    if (!preorder) return;

    const nextStatus = preorder.status === 'PENDING' ? 'COMPLETED' : preorder.status === 'COMPLETED' ? 'CANCELLED' : 'PENDING';
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${CONFIG.API_BASE_URL}/api/preorders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();
      if (response.ok) {
        loadPreorders();
      } else {
        Alert.alert('Error', data.error || 'Failed to update status.');
      }
    } catch (e) {
      console.error('Error updating status:', e);
      Alert.alert('Error', 'Network error. Failed to update status.');
    }
  };

  const resetForm = () => {
    setEditingPreorderId(null);
    setSelectedShopId('');
    setSelectedShopName('');
    setPreorderItems([]);
    setSelectedCategoryId('');
    setSelectedCategoryName('');
    setCategoryProducts([]);
    setSelectedProductId('');
    setSelectedProductName('');
    setSelectedProductRate(0);
    setQuantity('');
    setAmount('');
    setDeliveryDate('');
    setPreorderStatus('PENDING');
    setPreorderPaidAmount('0');
    setPreorderPaymentType('CASH');
  };

  const filteredPreorders = preorders.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesShop = item.shop_name?.toLowerCase().includes(query);
    const matchesExecutive = item.sales_executive?.toLowerCase().includes(query);
    const matchesStatus = item.status?.toLowerCase().includes(query);
    const matchesProducts = item.items?.some(p => p.product_name?.toLowerCase().includes(query)) || item.product_name?.toLowerCase().includes(query);
    return matchesShop || matchesExecutive || matchesStatus || matchesProducts;
  });

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
          <Text style={styles.menuIconText}>☵</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>PREORDERS</Text>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Text style={styles.newBtnText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by shop, product, or executive..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#087E66" />
            <Text style={styles.loadingText}>Loading preorders...</Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {filteredPreorders.map((item) => (
              <TouchableOpacity
                key={item.preorder_id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('PreorderDetail', {
                  preorder: item,
                  isAdmin: isAdmin,
                  onStatusChange: async (id, newStatus) => {
                    try {
                      const token = await AsyncStorage.getItem('userToken');
                      if (!token) return;
                      await fetch(`${CONFIG.API_BASE_URL}/api/preorders/${id}/status`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: newStatus })
                      });
                      loadPreorders();
                    } catch (e) {
                      console.error('Error updating status from detail screen:', e);
                    }
                  },
                  onDelete: async (id) => {
                    try {
                      const token = await AsyncStorage.getItem('userToken');
                      if (!token) return;
                      const response = await fetch(`${CONFIG.API_BASE_URL}/api/preorders/${id}`, {
                        method: 'DELETE',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      const data = await response.json();
                      if (response.ok) {
                        loadPreorders();
                      } else {
                        Alert.alert('Error', data.error || 'Failed to delete preorder.');
                      }
                    } catch (e) {
                      console.error('Error deleting preorder from detail screen:', e);
                      Alert.alert('Error', 'Network error. Failed to delete preorder.');
                    }
                  },
                  onEdit: (orderToEdit) => {
                    navigation.goBack();
                    setTimeout(() => {
                      startEditPreorder(orderToEdit);
                    }, 300);
                  },
                })}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.customerBox}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(item.shop_name || 'S').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName} numberOfLines={1}>{item.shop_name}</Text>
                      <Text style={styles.dateSubtext}>Date: {item.preorder_date}</Text>
                    </View>
                  </View>
                  {item.is_deleted ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.statusBadgeText, { color: '#EF4444' }]}>DELETED</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.statusBadge,
                        item.status === 'COMPLETED' ? styles.statusCompleted : item.status === 'CANCELLED' ? styles.statusCancelled : styles.statusPending
                      ]}
                      onPress={() => toggleStatus(item.preorder_id)}
                    >
                      <Text style={[
                        styles.statusBadgeText,
                        item.status === 'COMPLETED' ? styles.statusCompletedText : item.status === 'CANCELLED' ? styles.statusCancelledText : styles.statusPendingText
                      ]}>
                        {item.status}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cardDivider} />

                {/* Compact summary — no inline items */}
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Executive:</Text>
                    <Text style={styles.detailValue}>{item.sales_executive}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Products:</Text>
                    <Text style={[styles.detailValue, { color: '#087E66' }]}>
                      {(item.items || []).length} item{(item.items || []).length !== 1 ? 's' : ''} — Tap to view
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Delivery Date:</Text>
                    <Text style={[styles.detailValue, { color: '#E11D48', fontWeight: '700' }]}>{item.delivery_date}</Text>
                  </View>
                  <View style={[styles.detailRow, { marginTop: 4 }]}>
                    <Text style={[styles.detailLabel, { fontWeight: '700', color: '#1E293B' }]}>Total Amount:</Text>
                    <Text style={[styles.detailValue, { fontWeight: '800', color: '#087E66', fontSize: 14 }]}>₹{item.amount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {!item.is_deleted && (
                  <>
                    <View style={styles.cardDivider} />

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.editBtn]}
                        onPress={() => startEditPreorder(item)}
                      >
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      {(!item.status || item.status !== 'COMPLETED' || isAdmin) && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => handleDeletePreorder(item.preorder_id)}
                        >
                          <Text style={styles.deleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </TouchableOpacity>
            ))}

            {filteredPreorders.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyText}>No preorders found</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Add / Edit Preorder Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {!isShopModalOpen ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingPreorderId ? 'Edit Preorder' : 'Add New Preorder'}
                  </Text>
                  <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Shop Name</Text>
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() => setIsShopModalOpen(true)}
                    >
                      <Text style={selectedShopName ? styles.selectorText : styles.selectorPlaceholder}>
                        {selectedShopName || 'Select a Shop'}
                      </Text>
                      <Text style={styles.selectorArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Sales Executive</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: '#F1F5F9', color: '#64748B' }]}
                      value={executiveName}
                      editable={false}
                    />
                  </View>

                  {/* Current items list */}
                  <View style={styles.modalSectionHeader}>
                    <Text style={styles.modalSectionTitle}>Preorder Items List</Text>
                  </View>

                  {preorderItems.length > 0 ? (
                    <View style={styles.itemsTable}>
                      <View style={styles.tableHeader}>
                        <Text style={[styles.tableCol, styles.colProduct, { fontWeight: '700', color: '#64748B' }]}>Product</Text>
                        <Text style={[styles.tableCol, styles.colQty, { fontWeight: '700', color: '#64748B', textAlign: 'center' }]}>Qty</Text>
                        <Text style={[styles.tableCol, styles.colAmt, { fontWeight: '700', color: '#64748B', textAlign: 'right' }]}>Amount</Text>
                        <Text style={[styles.tableCol, styles.colAction]}></Text>
                      </View>
                      {preorderItems.map((prod, index) => (
                        <View key={index} style={styles.tableRow}>
                          <Text style={[styles.tableCol, styles.colProduct, { color: '#1E293B', fontWeight: '500' }]} numberOfLines={1}>
                            {prod.product_name}
                          </Text>
                          <Text style={[styles.tableCol, styles.colQty, { color: '#1E293B', textAlign: 'center' }]}>
                            {prod.quantity}
                          </Text>
                          <Text style={[styles.tableCol, styles.colAmt, { color: '#1E293B', textAlign: 'right', fontWeight: '600' }]}>
                            ₹{prod.amount.toLocaleString('en-IN')}
                          </Text>
                          <TouchableOpacity 
                            style={styles.removeItemBtn} 
                            onPress={() => setPreorderItems(preorderItems.filter((_, i) => i !== index))}
                          >
                            <Text style={styles.removeItemText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <View style={styles.tableFooter}>
                        <Text style={styles.totalLabel}>Total Items: {preorderItems.length}</Text>
                        <Text style={styles.totalValue}>
                          Total: ₹{preorderItems.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noItemsContainer}>
                      <Text style={styles.noItemsText}>No products added to this preorder yet.</Text>
                    </View>
                  )}

                  {/* Add item sub-form — Category → Product cascade */}
                  <View style={styles.addItemBox}>
                    <Text style={styles.addItemTitle}>Add Product Item</Text>

                    {/* Step 1: Category Selector */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Category</Text>
                      <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setIsCategoryModalOpen(true)}
                      >
                        <Text style={selectedCategoryName ? styles.selectorText : styles.selectorPlaceholder}>
                          {selectedCategoryName || 'Select a Category'}
                        </Text>
                        <Text style={styles.selectorArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Step 2: Product Selector (enabled after category chosen) */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Product</Text>
                      <TouchableOpacity
                        style={[styles.selector, !selectedCategoryId && { opacity: 0.5 }]}
                        disabled={!selectedCategoryId}
                        onPress={() => setIsProductModalOpen(true)}
                      >
                        {loadingProducts ? (
                          <ActivityIndicator size="small" color="#087E66" />
                        ) : (
                          <Text style={selectedProductName ? styles.selectorText : styles.selectorPlaceholder}>
                            {selectedProductName || (selectedCategoryId ? 'Select a Product' : 'Choose category first')}
                          </Text>
                        )}
                        <Text style={styles.selectorArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Qty & Amount row */}
                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Quantity</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 5"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={quantity}
                          onChangeText={setQuantity}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Amount (₹)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 1700"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={amount}
                          onChangeText={setAmount}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.addItemBtn}
                      onPress={() => {
                        if (!selectedProductName) {
                          Alert.alert('Error', 'Please select a category and product');
                          return;
                        }
                        const qtyNum = parseInt(quantity, 10);
                        if (isNaN(qtyNum) || qtyNum <= 0) {
                          Alert.alert('Error', 'Please enter a valid quantity greater than 0');
                          return;
                        }
                        const amtNum = parseFloat(amount);
                        if (isNaN(amtNum) || amtNum < 0) {
                          Alert.alert('Error', 'Please enter a valid amount');
                          return;
                        }
                        setPreorderItems([
                          ...preorderItems,
                          {
                            product_id: selectedProductId,
                            product_name: selectedProductName,
                            category_name: selectedCategoryName,
                            quantity: qtyNum,
                            amount: amtNum,
                          }
                        ]);
                        setSelectedProductId('');
                        setSelectedProductName('');
                        setSelectedProductRate(0);
                        setQuantity('');
                        setAmount('');
                      }}
                    >
                      <Text style={styles.addItemBtnText}>+ Add to Preorder List</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Delivery Date</Text>
                    <TouchableOpacity
                      style={[styles.input, { justifyContent: 'center' }]}
                      activeOpacity={0.7}
                      onPress={() => setIsDatePickerOpen(true)}
                    >
                      <Text style={{ color: deliveryDate ? '#1E293B' : '#94A3B8', fontSize: 14 }}>
                        {deliveryDate || 'Select delivery date (YYYY-MM-DD)'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {editingPreorderId && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Status</Text>
                      <View style={styles.statusSelectContainer}>
                        {['PENDING', 'COMPLETED', 'CANCELLED'].map((status) => (
                          <TouchableOpacity
                            key={status}
                            style={[
                              styles.statusSelectBtn,
                              preorderStatus === status && (
                                status === 'COMPLETED' ? styles.statusSelectCompleted : status === 'CANCELLED' ? styles.statusSelectCancelled : styles.statusSelectPending
                              )
                            ]}
                            onPress={() => setPreorderStatus(status)}
                          >
                            <Text style={[
                              styles.statusSelectBtnText,
                              preorderStatus === status && (
                                status === 'COMPLETED' ? styles.statusSelectCompletedText : status === 'CANCELLED' ? styles.statusSelectCancelledText : styles.statusSelectPendingText
                              )
                            ]}>
                              {status}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {preorderStatus === 'COMPLETED' && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Paid Amount (₹)</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          placeholder="Enter amount paid"
                          placeholderTextColor="#94A3B8"
                          value={preorderPaidAmount}
                          selectTextOnFocus={true}
                          onChangeText={(txt) => {
                            const cleaned = txt.replace(/^0+/, '');
                            setPreorderPaidAmount(cleaned === '' ? '0' : cleaned);
                          }}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Payment Type</Text>
                        <View style={styles.statusSelectContainer}>
                          {['CASH', 'UPI'].map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.statusSelectBtn,
                                preorderPaymentType === type && styles.statusSelectPending
                              ]}
                              onPress={() => setPreorderPaymentType(type)}
                            >
                              <Text style={[
                                styles.statusSelectBtnText,
                                preorderPaymentType === type && styles.statusSelectPendingText
                              ]}>
                                {type}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </>
                  )}

                  <TouchableOpacity style={styles.saveBtn} onPress={handleSavePreorder}>
                    <Text style={styles.saveBtnText}>
                      {editingPreorderId ? 'Update Preorder' : 'Save Preorder'}
                    </Text>
                  </TouchableOpacity>

                  <DatePickerModal
                    isOpen={isDatePickerOpen}
                    onClose={() => setIsDatePickerOpen(false)}
                    selectedDate={deliveryDate}
                    onSelectDate={(date) => setDeliveryDate(date)}
                  />
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select a Shop</Text>
                  <TouchableOpacity onPress={() => setIsShopModalOpen(false)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search shops..."
                    placeholderTextColor="#94A3B8"
                    value={shopSearchQuery}
                    onChangeText={setShopSearchQuery}
                    autoFocus={false}
                  />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {shops
                    .filter(s => s.shop_name?.toLowerCase().includes(shopSearchQuery.toLowerCase()))
                    .map((shop) => (
                      <TouchableOpacity
                        key={shop.shop_id}
                        style={styles.shopSelectItem}
                        onPress={() => {
                          setSelectedShopId(shop.shop_id);
                          setSelectedShopName(shop.shop_name);
                          setIsShopModalOpen(false);
                          setShopSearchQuery('');
                        }}
                      >
                        <Text style={styles.shopSelectText}>{shop.shop_name}</Text>
                        <Text style={styles.shopSelectArea}>{shop.area_name || ''}</Text>
                      </TouchableOpacity>
                    ))}

                  {shops.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyIcon}>🏢</Text>
                      <Text style={styles.emptyText}>No assigned shops found</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={isCategoryModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCategoryModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setIsCategoryModalOpen(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {categories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📁</Text>
                  <Text style={styles.emptyText}>No categories found</Text>
                </View>
              ) : (
                categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.category_id}
                    style={styles.shopSelectItem}
                    onPress={() => {
                      setSelectedCategoryId(cat.category_id);
                      setSelectedCategoryName(cat.category_name);
                      setSelectedProductId('');
                      setSelectedProductName('');
                      setSelectedProductRate(0);
                      setIsCategoryModalOpen(false);
                      fetchProductsByCategory(cat.category_id);
                    }}
                  >
                    <Text style={styles.shopSelectText}>{cat.category_name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Picker Modal */}
      <Modal
        visible={isProductModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsProductModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setIsProductModalOpen(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {loadingProducts ? (
              <View style={[styles.emptyContainer, { marginTop: 40 }]}>
                <ActivityIndicator size="large" color="#087E66" />
                <Text style={styles.emptyText}>Loading products...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {categoryProducts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyText}>No products in this category</Text>
                  </View>
                ) : (
                  categoryProducts.map((prod) => (
                    <TouchableOpacity
                      key={prod.product_id}
                      style={styles.shopSelectItem}
                      onPress={() => {
                        setSelectedProductId(prod.product_id);
                        setSelectedProductName(prod.product_name);
                        setSelectedProductRate(prod.rate);
                        setAmount(String(prod.rate || ''));
                        setIsProductModalOpen(false);
                      }}
                    >
                      <Text style={styles.shopSelectText}>{prod.product_name}</Text>
                      {prod.rate > 0 && (
                        <Text style={styles.shopSelectArea}>₹{prod.rate} / {prod.unit || 'unit'}</Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} currentRoute="Preorders" />
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconText: {
    fontSize: 20,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 1,
  },
  newBtn: {
    backgroundColor: '#087E66',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F2F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#087E66',
  },
  customerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  dateSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPending: {
    backgroundColor: '#FFFBEB',
  },
  statusPendingText: {
    color: '#D97706',
  },
  statusCompleted: {
    backgroundColor: '#ECFDF5',
  },
  statusCompletedText: {
    color: '#059669',
  },
  statusCancelled: {
    backgroundColor: '#FEF2F2',
  },
  statusCancelledText: {
    color: '#DC2626',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  editBtn: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  editBtnText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
    opacity: 0.2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1E293B',
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
  },
  selectorText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  selectorPlaceholder: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#64748B',
  },
  shopSelectItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  shopSelectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  shopSelectArea: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusSelectContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statusSelectBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statusSelectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  statusSelectPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#D97706',
  },
  statusSelectPendingText: {
    color: '#D97706',
  },
  statusSelectCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  statusSelectCompletedText: {
    color: '#059669',
  },
  statusSelectCancelled: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  statusSelectCancelledText: {
    color: '#DC2626',
  },
  saveBtn: {
    backgroundColor: '#087E66',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  itemsSection: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
  },
  itemsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  cardItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  cardItemProduct: {
    flex: 2,
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  cardItemQty: {
    flex: 0.5,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  cardItemAmt: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    textAlign: 'right',
    fontWeight: '600',
  },
  modalSectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 10,
    marginTop: 10,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemsTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCol: {
    fontSize: 12,
  },
  colProduct: {
    flex: 2,
  },
  colQty: {
    flex: 0.5,
  },
  colAmt: {
    flex: 1,
  },
  colAction: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeItemBtn: {
    padding: 4,
    marginLeft: 6,
  },
  removeItemText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#087E66',
  },
  noItemsContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noItemsText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  addItemBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  addItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  addItemBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  addItemBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default PreorderScreen;
