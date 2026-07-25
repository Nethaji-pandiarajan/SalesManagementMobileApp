import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import CONFIG from '../config/config';

const ReconciliationScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const { userData } = useAuth();
  const isAdmin = userData?.role === 'admin' || userData?.role_id === 1 || userData?.role_id === 3 || userData?.role_name?.toLowerCase() === 'admin';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reconciliations, setReconciliations] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setIsLoading(false);
        return;
      }

      if (isAdmin) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/reconciliation`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setReconciliations(data);
        } else {
          setError(data.error || 'Failed to load EOD sheets.');
        }
      } else {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/reconciliation/active`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setActiveTrip(data);
        } else if (response.status === 404) {
          setActiveTrip(null);
        } else {
          setError(data.error || 'Failed to load active trip.');
        }
      }
    } catch (err) {
      console.error('Fetch reconciliation error:', err);
      setError('Network error. Unable to load reconciliation data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Helper to handle driver input for stock
  const handleDriverStockChange = (productId, val) => {
    if (!activeTrip) return;
    setActiveTrip(prev => ({
      ...prev,
      inventory: prev.inventory.map(item =>
        item.id === productId ? { ...item, actual: val } : item
      )
    }));
  };

  // Helper to handle driver input for cash
  const handleDriverCashChange = (val) => {
    if (!activeTrip) return;
    const num = parseInt(val, 10) || 0;
    setActiveTrip(prev => ({
      ...prev,
      financials: { ...prev.financials, actualCash: num }
    }));
  };

  // Helper to handle driver input for UPI
  const handleDriverUpiChange = (val) => {
    if (!activeTrip) return;
    const num = parseInt(val, 10) || 0;
    setActiveTrip(prev => ({
      ...prev,
      financials: { ...prev.financials, actualUpi: num }
    }));
  };

  // Driver submits for approval
  const handleDriverSubmit = async () => {
    if (!activeTrip) return;
    const allFilled = activeTrip.inventory.every(item => item.actual !== '');
    if (!allFilled) {
      Alert.alert('Incomplete Sheet', 'Please enter physical counts for all items.');
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
          actual_cash: activeTrip.financials.actualCash,
          actual_upi: activeTrip.financials.actualUpi,
          inventory: activeTrip.inventory.map(item => ({
            id: item.id,
            actual: item.actual
          }))
        })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'EOD Sheet submitted successfully. Pending Admin review.');
        fetchData();
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

  // Admin flags stock discrepancy
  const handleFlagStockDiscrepancy = (driverName, item, diff) => {
    const desc = `${item.name}: Shortage of ${Math.abs(diff)}L`;
    setReconciliations(prev => prev.map(req => {
      if (req.driverName === driverName) {
        if (req.flaggedDiscrepancies.includes(desc)) {
          return {
            ...req,
            flaggedDiscrepancies: req.flaggedDiscrepancies.filter(d => d !== desc)
          };
        }
        return {
          ...req,
          flaggedDiscrepancies: [...req.flaggedDiscrepancies, desc]
        };
      }
      return req;
    }));
  };

  // Admin flags cash discrepancy
  const handleFlagCashDiscrepancy = (driverName, diff) => {
    const desc = `Cash Handover: Shortage of ₹${Math.abs(diff)}`;
    setReconciliations(prev => prev.map(req => {
      if (req.driverName === driverName) {
        if (req.flaggedDiscrepancies.includes(desc)) {
          return {
            ...req,
            flaggedDiscrepancies: req.flaggedDiscrepancies.filter(d => d !== desc)
          };
        }
        return {
          ...req,
          flaggedDiscrepancies: [...req.flaggedDiscrepancies, desc]
        };
      }
      return req;
    }));
  };

  // Admin flags UPI discrepancy
  const handleFlagUpiDiscrepancy = (driverName, diff) => {
    const desc = `UPI Handover: Shortage of ₹${Math.abs(diff)}`;
    setReconciliations(prev => prev.map(req => {
      if (req.driverName === driverName) {
        if (req.flaggedDiscrepancies.includes(desc)) {
          return {
            ...req,
            flaggedDiscrepancies: req.flaggedDiscrepancies.filter(d => d !== desc)
          };
        }
        return {
          ...req,
          flaggedDiscrepancies: [...req.flaggedDiscrepancies, desc]
        };
      }
      return req;
    }));
  };

  // Admin approves reconciliation and closes the day
  const handleApproveReconciliation = async (driverName) => {
    const req = reconciliations.find(r => r.driverName === driverName);
    if (!req) return;

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/reconciliation/${req.supply_id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flagged_discrepancies: req.flaggedDiscrepancies
        })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          'Day Closed',
          `Reconciliation for ${driverName} approved. The trip is now locked and completed.`,
          [{ text: 'OK', onPress: () => {
            setSelectedDriver(null);
            fetchData();
          }}]
        );
      } else {
        Alert.alert('Approval Failed', data.error || 'Could not approve reconciliation.');
      }
    } catch (err) {
      console.error('Approve reconciliation error:', err);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Admin rejects reconciliation and sends it back to driver
  const handleRejectReconciliation = async (driverName) => {
    const req = reconciliations.find(r => r.driverName === driverName);
    if (!req) return;

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/reconciliation/${req.supply_id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          'Reconciliation Rejected',
          `Sent EOD sheet back to ${driverName} for correction.`,
          [{ text: 'OK', onPress: () => {
            setSelectedDriver(null);
            fetchData();
          }}]
        );
      } else {
        Alert.alert('Rejection Failed', data.error || 'Could not reject reconciliation.');
      }
    } catch (err) {
      console.error('Reject reconciliation error:', err);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        {selectedDriver ? (
          <TouchableOpacity style={styles.menuBtn} onPress={() => setSelectedDriver(null)}>
            <Text style={styles.menuIconText}>◀</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.menuBtn} onPress={() => setIsSidebarOpen(true)}>
            <Text style={styles.menuIconText}>☰</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {selectedDriver ? `RECONCILE: ${selectedDriver.toUpperCase()}` : 'EOD RECONCILIATION'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#087E66" />
          <Text style={styles.loadingText}>Loading reconciliation data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryBtnText}>Retry / Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Admin View - List of Drivers */}
          {isAdmin && !selectedDriver && (
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.sectionHeading}>Active Driver Sheets</Text>
              <Text style={styles.sectionSubtitle}>Select a driver to audit system data against physical collections.</Text>
              
              <View style={styles.driverList}>
                {reconciliations.map((req) => {
                  let statusColor = '#64748B';
                  let statusBg = '#F1F5F9';
                  let statusText = 'In Progress';
                  
                  if (req.status === 'pending_approval') {
                    statusColor = '#D97706';
                    statusBg = '#FEF3C7';
                    statusText = 'Pending Approval';
                  } else if (req.status === 'reconciled') {
                    statusColor = '#059669';
                    statusBg = '#D1FAE5';
                    statusText = 'Reconciled & Closed';
                  }

                  const totalLoaded = req.inventory.reduce((acc, item) => acc + item.loaded, 0);
                  const totalSold = req.inventory.reduce((acc, item) => acc + item.sold, 0);

                  return (
                    <TouchableOpacity
                      key={req.supply_id}
                      style={styles.driverCard}
                      onPress={() => setSelectedDriver(req.driverName)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.driverCardHeader}>
                        <View>
                          <Text style={styles.driverNameText}>{req.driverName}</Text>
                          <Text style={styles.driverVehicleText}>Vehicle: {req.vehicleNo}</Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusText}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.driverCardMetrics}>
                        <View style={styles.driverMetricCol}>
                          <Text style={styles.driverMetricLabel}>LOADED</Text>
                          <Text style={styles.driverMetricVal}>{totalLoaded} L</Text>
                        </View>
                        <View style={styles.driverMetricCol}>
                          <Text style={styles.driverMetricLabel}>SOLD</Text>
                          <Text style={styles.driverMetricVal}>{totalSold} L</Text>
                        </View>
                        <View style={styles.driverMetricCol}>
                          <Text style={styles.driverMetricLabel}>EXPECTED CASH</Text>
                          <Text style={[styles.driverMetricVal, styles.tealText]}>₹{req.financials.expectedCash.toLocaleString()}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Admin View - Detail view for a selected driver */}
          {isAdmin && selectedDriver && (() => {
            const req = reconciliations.find(r => r.driverName === selectedDriver);
            if (!req) return null;

            const totalExpectedCash = req.financials.expectedCash;
            const totalActualCash = req.financials.actualCash;
            const cashDiff = totalActualCash - totalExpectedCash;
            const isReconciled = req.status === 'reconciled';

            return (
              <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Driver Summary Banner */}
                <View style={styles.driverSummaryBanner}>
                  <Text style={styles.bannerTitle}>{req.driverName}</Text>
                  <Text style={styles.bannerSubtitle}>Vehicle: {req.vehicleNo} | Date: {req.date}</Text>
                </View>

                {/* Stock Comparison */}
                <Text style={styles.sectionHeading}>Expected vs Driver Entered Stock</Text>
                <View style={styles.comparisonCard}>
                  {req.inventory.map((item) => {
                    const expRemaining = item.expected;
                    const actualRemaining = item.actual !== '' ? parseInt(item.actual, 10) : 0;
                    const diff = actualRemaining - expRemaining;
                    const isShort = diff < 0;
                    const isFlagged = req.flaggedDiscrepancies.some(d => d.includes(item.name));

                    return (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemMath}>Loaded: {item.loaded} | Sold: {item.sold}</Text>
                        </View>
                        
                        <View style={styles.itemComparisonCol}>
                          <View style={styles.valuesRow}>
                            <View style={styles.valueBox}>
                              <Text style={styles.valueBoxLabel}>Expected</Text>
                              <Text style={styles.valueBoxVal}>{expRemaining}</Text>
                            </View>
                            <View style={styles.valueBox}>
                              <Text style={styles.valueBoxLabel}>Actual</Text>
                              <Text style={[styles.valueBoxVal, isShort ? styles.redText : styles.tealText]}>
                                {item.actual === '' ? '—' : actualRemaining}
                              </Text>
                            </View>
                          </View>

                          {item.actual !== '' && diff !== 0 && (
                            <View style={styles.diffRow}>
                              <Text style={[styles.diffText, isShort ? styles.redText : styles.tealText]}>
                                {isShort ? `⚠️ ${Math.abs(diff)}L missing` : `✓ +${diff}L extra`}
                              </Text>
                              
                              {!isReconciled && isShort && (
                                <TouchableOpacity
                                  style={[styles.flagBtn, isFlagged && styles.flagBtnActive]}
                                  onPress={() => handleFlagStockDiscrepancy(req.driverName, item, diff)}
                                >
                                  <Text style={[styles.flagBtnText, isFlagged && styles.flagBtnActiveText]}>
                                    {isFlagged ? 'Flagged' : 'Flag Discrepancy'}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Cash Comparison */}
                <Text style={styles.sectionHeading}>Expected vs Handed Over Cash</Text>
                <View style={styles.comparisonCard}>
                  <View style={styles.cashRow}>
                    <View style={styles.cashCol}>
                      <Text style={styles.cashLabel}>SYSTEM EXPECTED CASH</Text>
                      <Text style={styles.cashValue}>₹{totalExpectedCash.toLocaleString()}</Text>
                    </View>
                    <View style={styles.cashCol}>
                      <Text style={styles.cashLabel}>DRIVER HANDED OVER</Text>
                      <Text style={[styles.cashValue, cashDiff < 0 ? styles.redText : styles.tealText]}>
                        ₹{totalActualCash.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {cashDiff !== 0 && (
                    <View style={styles.cashDiffRow}>
                      <Text style={[styles.cashDiffText, cashDiff < 0 ? styles.redText : styles.tealText]}>
                        {cashDiff < 0 
                          ? `⚠️ Shortage of ₹${Math.abs(cashDiff).toLocaleString()}` 
                          : `✓ Excess of ₹${cashDiff.toLocaleString()}`
                        }
                      </Text>

                      {!isReconciled && cashDiff < 0 && (() => {
                        const isFlagged = req.flaggedDiscrepancies.some(d => d.includes('Cash Handover'));
                        return (
                          <TouchableOpacity
                            style={[styles.flagBtn, isFlagged && styles.flagBtnActive]}
                            onPress={() => handleFlagCashDiscrepancy(req.driverName, cashDiff)}
                          >
                            <Text style={[styles.flagBtnText, isFlagged && styles.flagBtnActiveText]}>
                              {isFlagged ? 'Flagged' : 'Flag Discrepancy'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })()}
                    </View>
                  )}
                </View>

                {/* UPI Comparison */}
                <Text style={styles.sectionHeading}>Expected vs Reported UPI Payments</Text>
                <View style={styles.comparisonCard}>
                  <View style={styles.cashRow}>
                    <View style={styles.cashCol}>
                      <Text style={styles.cashLabel}>SYSTEM EXPECTED UPI</Text>
                      <Text style={styles.cashValue}>₹{req.financials.expectedUpi.toLocaleString()}</Text>
                    </View>
                    <View style={styles.cashCol}>
                      <Text style={styles.cashLabel}>DRIVER REPORTED UPI</Text>
                      <Text style={[styles.cashValue, (req.financials.actualUpi - req.financials.expectedUpi) < 0 ? styles.redText : styles.tealText]}>
                        ₹{req.financials.actualUpi.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {(req.financials.actualUpi - req.financials.expectedUpi) !== 0 && (() => {
                    const upiDiff = req.financials.actualUpi - req.financials.expectedUpi;
                    const isUpiShort = upiDiff < 0;
                    const isFlagged = req.flaggedDiscrepancies.some(d => d.includes('UPI Handover'));
                    return (
                      <View style={styles.cashDiffRow}>
                        <Text style={[styles.cashDiffText, isUpiShort ? styles.redText : styles.tealText]}>
                          {isUpiShort 
                            ? `⚠️ Shortage of ₹${Math.abs(upiDiff).toLocaleString()}` 
                            : `✓ Excess of ₹${upiDiff.toLocaleString()}`
                          }
                        </Text>

                        {!isReconciled && isUpiShort && (
                          <TouchableOpacity
                            style={[styles.flagBtn, isFlagged && styles.flagBtnActive]}
                            onPress={() => handleFlagUpiDiscrepancy(req.driverName, upiDiff)}
                          >
                            <Text style={[styles.flagBtnText, isFlagged && styles.flagBtnActiveText]}>
                              {isFlagged ? 'Flagged' : 'Flag Discrepancy'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })()}
                </View>

                {/* Shortage Logger Summary Box */}
                <Text style={styles.sectionHeading}>Shortage Logger & Discrepancy Record</Text>
                <View style={[styles.discrepancyBox, req.flaggedDiscrepancies.length > 0 && styles.discrepancyBoxWarning]}>
                  {req.flaggedDiscrepancies.length === 0 ? (
                    <Text style={styles.noDiscrepancyText}>✓ No shortages logged against this driver's trip.</Text>
                  ) : (
                    <View>
                      <Text style={styles.loggedShortageHeading}>LOGGED SHORTAGES AGAINST {req.driverName.toUpperCase()}:</Text>
                      {req.flaggedDiscrepancies.map((desc, dIdx) => (
                        <View key={`${dIdx}-${desc}`} style={styles.shortageItemRow}>
                          <Text style={styles.shortageIcon}>⚠️</Text>
                          <Text style={styles.shortageDescText}>{desc}</Text>
                        </View>
                      ))}
                      <Text style={styles.shortageNote}>These discrepancies will be saved as losses on the driver's profile.</Text>
                    </View>
                  )}
                </View>

                {/* Admin Actions */}
                {!isReconciled ? (
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleRejectReconciliation(req.driverName)}
                    >
                      <Text style={styles.rejectBtnText}>Reject & Send Back</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApproveReconciliation(req.driverName)}
                    >
                      <Text style={styles.approveBtnText}>Approve & Close Day</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.reconciledStatusBanner}>
                    <Text style={styles.reconciledStatusText}>✓ Trip Reconciled & Day Closed</Text>
                    <Text style={styles.reconciledStatusSub}>All records are locked and saved.</Text>
                  </View>
                )}
              </ScrollView>
            );
          })()}

          {/* Driver (Executive) View */}
          {!isAdmin && (() => {
            if (!activeTrip) {
              return (
                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                  <View style={styles.pendingStateContainer}>
                    <View style={[styles.pendingIconCircle, styles.grayBg]}>
                      <Text style={styles.pendingIconText}>🚚</Text>
                    </View>
                    <Text style={[styles.pendingTitle, styles.grayText]}>No Active Trip</Text>
                    <Text style={styles.pendingSubtitle}>
                      You do not have an active vehicle or trip assigned for today.
                    </Text>
                    <Text style={styles.pendingNote}>
                      Please contact the administrator to log a load manifest and assign your daily area.
                    </Text>
                  </View>
                </ScrollView>
              );
            }

            const isReconciled = activeTrip.status === 'reconciled';
            const isPending = activeTrip.status === 'pending_approval';

            if (isReconciled) {
              return (
                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                  <View style={styles.successStateContainer}>
                    <View style={styles.successIconCircle}>
                      <Text style={styles.successIconText}>✓</Text>
                    </View>
                    <Text style={styles.successTitle}>Day Closed Successfully</Text>
                    <Text style={styles.successSubtitle}>
                      Your EOD Reconciliation has been approved by the Admin and today's trip is locked.
                    </Text>
                    <Text style={styles.successNote}>
                      Thank you for verifying! You are good to go.
                    </Text>
                    <TouchableOpacity 
                      style={styles.backToDashboardBtn} 
                      onPress={() => navigation.navigate('Dashboard')}
                    >
                      <Text style={styles.backToDashboardBtnText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              );
            }

            if (isPending) {
              return (
                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                  <View style={styles.pendingStateContainer}>
                    <View style={styles.pendingIconCircle}>
                      <Text style={styles.pendingIconText}>⏳</Text>
                    </View>
                    <Text style={styles.pendingTitle}>Submitted for Approval</Text>
                    <Text style={styles.pendingSubtitle}>
                      Your EOD Reconciliation sheet is now with the Admin.
                    </Text>
                    <Text style={styles.pendingNote}>
                      Please hand over your physical cash collection of ₹{(activeTrip.financials.actualCash + activeTrip.financials.actualUpi).toLocaleString()} and wait for the Admin to reconcile your remaining stock.
                    </Text>
                    <TouchableOpacity 
                      style={styles.backToDashboardBtn} 
                      onPress={() => navigation.navigate('Dashboard')}
                    >
                      <Text style={styles.backToDashboardBtnText}>Go to Dashboard</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              );
            }

            return (
              <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Instructions */}
                <View style={styles.instructionsBanner}>
                  <Text style={styles.instructionsHeading}>End-Of-Day Reconciliation</Text>
                  <Text style={styles.instructionsBody}>
                    Count your remaining physical stock in the vehicle and count your cash collections. Submit them to the Admin to close your day.
                  </Text>
                </View>

                {/* Stock Entry */}
                <Text style={styles.sectionHeading}>Physical Stock Remaining</Text>
                <View style={styles.inputCard}>
                  {activeTrip.inventory.map((item) => (
                    <View key={item.id} style={styles.inputRow}>
                      <View style={styles.inputLabelCol}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemMath}>Loaded: {item.loaded} | Sold: {item.sold} | Expected: {item.expected}</Text>
                      </View>
                      <View style={styles.inputBoxCol}>
                        <TextInput
                          style={styles.numberInput}
                          keyboardType="numeric"
                          placeholder="Actual"
                          placeholderTextColor="#94A3B8"
                          value={item.actual}
                          onChangeText={(val) => handleDriverStockChange(item.id, val)}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                {/* Financial Entry */}
                <Text style={styles.sectionHeading}>Physical Cash & Collections Handover</Text>
                <View style={styles.inputCard}>
                  <View style={styles.expectedCashSummaryBanner}>
                    <Text style={styles.expectedCashSummaryLabel}>Expected Cash Total (From Invoices):</Text>
                    <Text style={styles.expectedCashSummaryVal}>₹{activeTrip.financials.expectedCash.toLocaleString()}</Text>
                  </View>
                  
                  <View style={[styles.inputRow, styles.marginTop10]}>
                    <View style={styles.inputLabelCol}>
                      <Text style={styles.itemName}>Physical Cash Handover</Text>
                      <Text style={styles.itemMath}>Count and enter physical cash bills</Text>
                    </View>
                    <View style={styles.inputBoxCol}>
                      <TextInput
                        style={styles.numberInput}
                        keyboardType="numeric"
                        placeholder="₹ Cash"
                        placeholderTextColor="#94A3B8"
                        value={activeTrip.financials.actualCash === 0 ? '' : String(activeTrip.financials.actualCash)}
                        onChangeText={handleDriverCashChange}
                      />
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputLabelCol}>
                      <Text style={styles.itemName}>UPI / Online Received</Text>
                      <Text style={styles.itemMath}>Total payments received on QR code</Text>
                    </View>
                    <View style={styles.inputBoxCol}>
                      <TextInput
                        style={styles.numberInput}
                        keyboardType="numeric"
                        placeholder="₹ UPI"
                        placeholderTextColor="#94A3B8"
                        value={activeTrip.financials.actualUpi === 0 ? '' : String(activeTrip.financials.actualUpi)}
                        onChangeText={handleDriverUpiChange}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.submitEodBtn} onPress={handleDriverSubmit}>
                  <Text style={styles.submitEodBtnText}>Submit EOD Reconciliation</Text>
                  <Text style={styles.submitEodBtnSub}>Sends sheet to Admin for review</Text>
                </TouchableOpacity>
              </ScrollView>
            );
          })()}
        </>
      )}
      <BottomNav navigation={navigation} currentRoute="Reconciliation" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 25,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    fontWeight: '500',
  },
  driverList: {
    gap: 12,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  driverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  driverNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  driverVehicleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  driverCardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  driverMetricCol: {
    flex: 1,
  },
  driverMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
  },
  driverMetricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  driverSummaryBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  itemDetails: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  itemMath: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  itemComparisonCol: {
    alignItems: 'flex-end',
  },
  valuesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  valueBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 55,
  },
  valueBoxLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
  },
  valueBoxVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E293B',
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
  },
  flagBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  flagBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  flagBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  flagBtnActiveText: {
    color: '#FFFFFF',
  },
  cashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cashCol: {
    flex: 1,
  },
  cashLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
  },
  cashValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  cashDiffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 4,
  },
  cashDiffText: {
    fontSize: 12,
    fontWeight: '800',
  },
  discrepancyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 24,
  },
  discrepancyBoxWarning: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FCA5A5',
  },
  noDiscrepancyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#087E66',
    textAlign: 'center',
  },
  loggedShortageHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  shortageItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  shortageIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  shortageDescText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3F3F46',
  },
  shortageNote: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 10,
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  approveBtn: {
    flex: 2,
    backgroundColor: '#087E66',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reconciledStatusBanner: {
    backgroundColor: '#E6F2F0',
    borderWidth: 1,
    borderColor: '#087E66',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  reconciledStatusText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#087E66',
  },
  reconciledStatusSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#087E66',
    marginTop: 2,
  },
  successStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F2F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 32,
    color: '#087E66',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  successNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  backToDashboardBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backToDashboardBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pendingStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  pendingIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pendingIconText: {
    fontSize: 32,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#D97706',
    textAlign: 'center',
    marginBottom: 10,
  },
  pendingSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  pendingNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 24,
  },
  instructionsBanner: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  instructionsHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  instructionsBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  inputLabelCol: {
    flex: 1,
    marginRight: 10,
  },
  inputBoxCol: {
    width: 90,
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
  expectedCashSummaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F2F0',
    borderRadius: 10,
    padding: 10,
  },
  expectedCashSummaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#087E66',
  },
  expectedCashSummaryVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#087E66',
  },
  submitEodBtn: {
    backgroundColor: '#087E66',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitEodBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  submitEodBtnSub: {
    fontSize: 11,
    color: '#E6F2F0',
    marginTop: 2,
    fontWeight: '500',
  },
  tealText: {
    color: '#087E66',
  },
  redText: {
    color: '#EF4444',
  },
  grayBg: {
    backgroundColor: '#E2E8F0',
  },
  grayText: {
    color: '#475569',
  },
  marginTop10: {
    marginTop: 10,
  },
});

export default ReconciliationScreen;
