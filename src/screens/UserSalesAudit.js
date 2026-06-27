import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import CONFIG from '../config/config';

const UserSalesAudit = ({ navigation, route }) => {
  const { userData } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form states
  const [actualCashInput, setActualCashInput] = useState('');
  const [actualUpiInput, setActualUpiInput] = useState('');
  const [actualStockInput, setActualStockInput] = useState({});

  const fetchAuditData = async () => {
    setErrorMsg(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setErrorMsg('Authentication token not found. Please log in again.');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      // 1. Get driver's active trip from reconciliation endpoint (supports all states)
      const activeTripResponse = await fetch(`${CONFIG.API_BASE_URL}/api/reconciliation/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const activeTripData = await activeTripResponse.json();
      if (!activeTripResponse.ok) {
        if (activeTripResponse.status === 404) {
          setErrorMsg('No active supply trip assignment found.');
        } else {
          setErrorMsg(activeTripData.error || 'Failed to fetch active trip details.');
        }
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      setActiveTrip(activeTripData);

      // Initialize inputs from activeTripData
      setActualCashInput(activeTripData.financials.actualCash === 0 ? '' : String(activeTripData.financials.actualCash));
      setActualUpiInput(activeTripData.financials.actualUpi === 0 ? '' : String(activeTripData.financials.actualUpi));
      
      const stockMap = {};
      activeTripData.inventory.forEach(item => {
        stockMap[item.id] = item.actual || '';
      });
      setActualStockInput(stockMap);

      // 2. Fetch the detailed sales report for this supply_id
      const supplyId = activeTripData.supply_id;
      const reportResponse = await fetch(`${CONFIG.API_BASE_URL}/api/sales/report/${supplyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const reportData = await reportResponse.json();
      if (reportResponse.ok) {
        setAuditData(reportData);
      } else {
        setErrorMsg(reportData.error || 'Failed to load trip sales audit data.');
      }
    } catch (err) {
      console.error('Fetch sales audit error:', err);
      setErrorMsg('Network error. Unable to load sales audit data.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAuditData();
  };

  const handleCashChange = (val) => {
    setActualCashInput(val);
  };

  const handleUpiChange = (val) => {
    setActualUpiInput(val);
  };

  const handleStockChange = (prodId, val) => {
    setActualStockInput(prev => ({
      ...prev,
      [prodId]: val
    }));
  };

  const handleDriverSubmit = async () => {
    if (!activeTrip) return;

    // Check that physical stock is entered for all items
    const missingStock = activeTrip.inventory.some(item => {
      const val = actualStockInput[item.id];
      return val === undefined || val === '';
    });

    if (missingStock) {
      Alert.alert('Incomplete Sheet', 'Please enter physical counts for all products.');
      return;
    }

    if (actualCashInput === '') {
      Alert.alert('Incomplete Sheet', 'Please enter physical cash handover amount.');
      return;
    }

    if (actualUpiInput === '') {
      Alert.alert('Incomplete Sheet', 'Please enter UPI/Online payments received.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/reconciliation/${activeTrip.supply_id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actual_cash: parseFloat(actualCashInput || 0),
          actual_upi: parseFloat(actualUpiInput || 0),
          inventory: Object.keys(actualStockInput).map(prodId => ({
            id: prodId,
            actual: actualStockInput[prodId]
          }))
        })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'EOD Sheet submitted successfully. Pending Admin review.');
        fetchAuditData();
      } else {
        Alert.alert('Submission Failed', data.error || 'Could not submit reconciliation.');
      }
    } catch (err) {
      console.error('Submit reconciliation error:', err);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Today';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isEditable = activeTrip?.status === 'in_progress';
  const isPending = activeTrip?.status === 'pending_approval';
  const isReconciled = activeTrip?.status === 'reconciled';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigation={navigation}
        username={userData?.username || 'Driver'}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setIsSidebarOpen(true)}>
          <Text style={styles.menuIconText}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>SALES AUDIT & EOD</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#087E66" />
          <Text style={styles.loadingText}>Loading trip audit details...</Text>
        </View>
      ) : errorMsg ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#087E66']} />}
        >
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Audit Data Unavailable</Text>
            <Text style={styles.errorSub}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setIsLoading(true); fetchAuditData(); }}>
              <Text style={styles.retryBtnText}>Retry Check</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : auditData ? (
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#087E66']} />}
        >
          {/* Trip Info Header Card */}
          <View style={styles.tripCard}>
            <View style={styles.tripHeaderRow}>
              <View style={styles.statusPillContainer}>
                {isEditable && (
                  <View style={[styles.statusPill, styles.statusOpen]}>
                    <Text style={styles.statusOpenText}>IN PROGRESS</Text>
                  </View>
                )}
                {isPending && (
                  <View style={[styles.statusPill, styles.statusPending]}>
                    <Text style={styles.statusPendingText}>PENDING APPROVAL</Text>
                  </View>
                )}
                {isReconciled && (
                  <View style={[styles.statusPill, styles.statusClosed]}>
                    <Text style={styles.statusClosedText}>RECONCILED & CLOSED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.tripDate}>{formatDate(auditData.date)}</Text>
            </View>
            <View style={styles.tripDetailsRow}>
              <View style={styles.tripInfoItem}>
                <Text style={styles.infoLabel}>VEHICLE</Text>
                <Text style={styles.infoValue}>{auditData.vehicle_no || 'N/A'}</Text>
                <Text style={styles.infoSub}>{auditData.vehicle_name || 'Assigned Van'}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.tripInfoItem}>
                <Text style={styles.infoLabel}>DRIVER</Text>
                <Text style={styles.infoValue}>{auditData.driver_name || userData?.username || 'Driver'}</Text>
                <Text style={styles.infoSub}>Trip ID: #{auditData.supply_id}</Text>
              </View>
            </View>
          </View>

          {/* Financial Summary Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expected Financials (System)</Text>
            <Text style={styles.sectionSubtitle}>Trip payment & pending collections summary from invoices</Text>
          </View>

          {/* Financial Grid */}
          <View style={styles.financialGrid}>
            <View style={[styles.financeCard, styles.borderGreen]}>
              <Text style={styles.financeLabel}>Total Sales</Text>
              <Text style={[styles.financeValue, styles.textGreen]}>
                ₹{(auditData.summary?.total_sales_amount || 0).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.financeSub}>{auditData.summary?.shops_visited || 0} Invoices</Text>
            </View>

            <View style={[styles.financeCard, styles.borderEmerald]}>
              <Text style={styles.financeLabel}>Total Collected</Text>
              <Text style={[styles.financeValue, styles.textEmerald]}>
                ₹{(auditData.summary?.total_amount_collected || 0).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.financeSub}>All payment types</Text>
            </View>

            <View style={[styles.financeCard, styles.borderTeal]}>
              <Text style={styles.financeLabel}>Expected Cash</Text>
              <Text style={[styles.financeValue, styles.textTeal]}>
                ₹{(auditData.summary?.cash_in_hand || 0).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.financeSub}>System cash total</Text>
            </View>

            <View style={[styles.financeCard, styles.borderTeal]}>
              <Text style={styles.financeLabel}>Expected UPI</Text>
              <Text style={[styles.financeValue, styles.textTeal]}>
                ₹{(auditData.summary?.upi_in_hand || 0).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.financeSub}>System UPI total</Text>
            </View>

            <View style={[styles.financeCard, styles.borderRed]}>
              <Text style={styles.financeLabel}>Pending Balance</Text>
              <Text style={[styles.financeValue, styles.textRed]}>
                ₹{(auditData.summary?.total_pending_amount || 0).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.financeSub}>Credit sales amount</Text>
            </View>
          </View>

          {/* EOD Physical Collections Submission Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Physical Handover & Verification</Text>
            <Text style={styles.sectionSubtitle}>Enter actual funds handed over to close the day</Text>
          </View>

          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <View style={styles.inputLabelCol}>
                <Text style={styles.inputTitleText}>Physical Cash Handed Over</Text>
                <Text style={styles.inputSubText}>Actual cash handed over (Expected: ₹{(auditData.summary?.cash_in_hand || 0).toLocaleString('en-IN')})</Text>
              </View>
              <View style={styles.inputBoxCol}>
                {isEditable ? (
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="numeric"
                    placeholder="₹ Cash"
                    placeholderTextColor="#94A3B8"
                    value={actualCashInput}
                    onChangeText={handleCashChange}
                  />
                ) : (
                  <Text style={styles.readOnlyHandoverText}>
                    ₹{(auditData.actual_cash || 0).toLocaleString('en-IN')}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.inputRow, styles.noBorder]}>
              <View style={styles.inputLabelCol}>
                <Text style={styles.inputTitleText}>UPI Payments Received</Text>
                <Text style={styles.inputSubText}>Total QR payments (Expected: ₹{(auditData.summary?.upi_in_hand || 0).toLocaleString('en-IN')})</Text>
              </View>
              <View style={styles.inputBoxCol}>
                {isEditable ? (
                  <TextInput
                    style={styles.numberInput}
                    keyboardType="numeric"
                    placeholder="₹ UPI"
                    placeholderTextColor="#94A3B8"
                    value={actualUpiInput}
                    onChangeText={handleUpiChange}
                  />
                ) : (
                  <Text style={styles.readOnlyHandoverText}>
                    ₹{(auditData.actual_upi || 0).toLocaleString('en-IN')}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Stock Summary Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory Audit & Return Stock</Text>
            <Text style={styles.sectionSubtitle}>Loaded, sold, and actual physical stock returning in van</Text>
          </View>

          {/* Stock Table Card */}
          <View style={styles.stockCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.flex1_8]}>Product</Text>
              <Text style={[styles.tableHeaderCell, styles.textCenter, styles.flex0_7]}>Loaded</Text>
              <Text style={[styles.tableHeaderCell, styles.textCenter, styles.flex0_7]}>Sold</Text>
              <Text style={[styles.tableHeaderCell, styles.textCenter, styles.flex0_7]}>Expect</Text>
              <Text style={[styles.tableHeaderCell, styles.textRight, styles.flex0_9]}>Physical</Text>
            </View>

            {(auditData.products_breakdown || []).length === 0 ? (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyTableText}>No inventory assigned to this trip.</Text>
              </View>
            ) : (
              (auditData.products_breakdown || []).map((prod, index) => {
                const isOdd = index % 2 !== 0;
                const prodId = prod.product_id.toString();
                const actualVal = isEditable 
                  ? (actualStockInput[prodId] || '') 
                  : (activeTrip?.inventory?.find(item => item.id === prodId)?.actual || '—');

                return (
                  <View
                    key={prod.product_id || index}
                    style={[styles.tableRow, isOdd && styles.tableRowOdd]}
                  >
                    <View style={styles.flex1_8}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {prod.product_name}
                      </Text>
                      <Text style={styles.productSKU}>{prod.sku_code || 'N/A'}</Text>
                    </View>
                    <Text style={[styles.tableCell, styles.textCenter, styles.flex0_7]}>
                      {prod.quantity_loaded}
                    </Text>
                    <Text style={[styles.tableCell, styles.textCenter, styles.flex0_7_bold_green]}>
                      {prod.quantity_sold}
                    </Text>
                    <Text style={[styles.tableCell, styles.textCenter, styles.flex0_7_bold]}>
                      {prod.quantity_remaining}
                    </Text>
                    <View style={styles.flex0_9_end}>
                      {isEditable ? (
                        <TextInput
                          style={styles.tableInput}
                          keyboardType="numeric"
                          placeholder="Qty"
                          placeholderTextColor="#94A3B8"
                          value={actualVal}
                          onChangeText={(val) => handleStockChange(prodId, val)}
                        />
                      ) : (
                        <Text style={[styles.tableCell, styles.textRight, styles.physicalTextClosed]}>
                          {actualVal} {prod.unit || 'L'}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Logged Discrepancies if Closed */}
          {isReconciled && auditData.flagged_discrepancies && auditData.flagged_discrepancies.length > 0 && (
            <View style={styles.discrepancyCard}>
              <Text style={styles.discrepancyTitle}>⚠️ Shortages Logged By Admin</Text>
              {auditData.flagged_discrepancies.map((desc, dIdx) => (
                <View key={dIdx} style={styles.discrepancyRow}>
                  <Text style={styles.discrepancyText}>• {desc}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Submission and Status Actions */}
          {isEditable && (
            <TouchableOpacity style={styles.submitBtn} onPress={handleDriverSubmit}>
              <Text style={styles.submitBtnText}>Submit EOD for Verification</Text>
              <Text style={styles.submitBtnSub}>Locks stock details & alerts administrator</Text>
            </TouchableOpacity>
          )}

          {isPending && (
            <View style={styles.statusBannerPending}>
              <Text style={styles.statusBannerPendingText}>⏳ EOD Sheet Pending Admin Verification</Text>
              <Text style={styles.statusBannerPendingSub}>
                Reconciliation values are locked. Hand over your cash of ₹{((parseFloat(auditData.actual_cash || 0) + parseFloat(auditData.actual_upi || 0))).toLocaleString('en-IN')} and remaining stock to the admin for review.
              </Text>
            </View>
          )}

          {isReconciled && (
            <View style={styles.statusBannerClosed}>
              <Text style={styles.statusBannerClosedText}>✓ Trip Reconciled & Closed</Text>
              <Text style={styles.statusBannerClosedSub}>
                Admin has reviewed and closed today's sheets. Records are permanently locked.
              </Text>
            </View>
          )}

          {/* Audit Verification Note */}
          {isEditable && (
            <View style={styles.verificationCard}>
              <Text style={styles.verificationCardTitle}>💡 Driver Self-Audit Check</Text>
              <Text style={styles.verificationCardText}>
                Ensure physical cash matches "Expected Cash" (₹{(auditData.summary?.cash_in_hand || 0).toLocaleString('en-IN')}) and physical stock matches expected remaining inventory before submitting EOD.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.errorSub}>Unable to parse sales audit details.</Text>
        </View>
      )}

      {/* Bottom Nav Bar */}
      <BottomNav navigation={navigation} currentRoute="UserSalesAudit" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuBtn: {
    padding: 8,
  },
  menuIconText: {
    fontSize: 24,
    color: '#1E293B',
    fontWeight: '300',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1.2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  refreshBtn: {
    padding: 8,
  },
  refreshIcon: {
    fontSize: 22,
    color: '#087E66',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  statusPillContainer: {
    flexDirection: 'row',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusOpen: {
    backgroundColor: '#E6F2F0',
  },
  statusOpenText: {
    color: '#087E66',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusClosed: {
    backgroundColor: '#F1F5F9',
  },
  statusClosedText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tripDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tripDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tripInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '850',
    color: '#1E293B',
  },
  infoSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  financeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    padding: 12,
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  borderGreen: {
    borderLeftColor: '#087E66',
  },
  textGreen: {
    color: '#087E66',
  },
  borderEmerald: {
    borderLeftColor: '#10B981',
  },
  textEmerald: {
    color: '#10B981',
  },
  borderTeal: {
    borderLeftColor: '#0F766E',
  },
  textTeal: {
    color: '#0F766E',
  },
  borderRed: {
    borderLeftColor: '#EF4444',
  },
  textRed: {
    color: '#EF4444',
  },
  financeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  financeValue: {
    fontSize: 18,
    fontWeight: '900',
    marginVertical: 4,
  },
  financeSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    gap: 14,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  noBorder: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  inputLabelCol: {
    flex: 1,
    marginRight: 10,
  },
  inputTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  inputSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  inputBoxCol: {
    width: 100,
  },
  numberInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'right',
  },
  readOnlyHandoverText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F766E',
    textAlign: 'right',
  },
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowOdd: {
    backgroundColor: '#F8FAFC',
  },
  productName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  productSKU: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tableCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  tableInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    width: 60,
    height: 32,
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    padding: 0,
  },
  emptyTable: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTableText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  discrepancyCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  discrepancyTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#EF4444',
    marginBottom: 8,
  },
  discrepancyRow: {
    marginBottom: 4,
  },
  discrepancyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F3F46',
  },
  submitBtn: {
    backgroundColor: '#087E66',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  submitBtnSub: {
    fontSize: 10,
    color: '#E6F2F0',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBannerPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statusBannerPendingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 4,
  },
  statusBannerPendingSub: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 18,
    fontWeight: '500',
  },
  statusBannerClosed: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statusBannerClosedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
  },
  statusBannerClosedSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  verificationCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  verificationCardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#475569',
    marginBottom: 6,
  },
  verificationCardText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    width: '100%',
    elevation: 1,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#087E66',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  flex1_8: {
    flex: 1.8,
  },
  flex0_7: {
    flex: 0.7,
  },
  flex0_9: {
    flex: 0.9,
  },
  flex0_9_end: {
    flex: 0.9,
    alignItems: 'flex-end',
  },
  flex0_7_bold_green: {
    flex: 0.7,
    color: '#087E66',
    fontWeight: '700',
  },
  flex0_7_bold: {
    flex: 0.7,
    fontWeight: '700',
  },
  physicalTextClosed: {
    fontWeight: '700',
    color: '#0F766E',
  },
});

export default UserSalesAudit;
