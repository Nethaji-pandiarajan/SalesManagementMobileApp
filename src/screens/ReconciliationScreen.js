import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

const ReconciliationScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mock Inventory Data
  const [inventory, setInventory] = useState([
    { id: 'P001', name: 'JO GOLD 1L', loaded: 450, sold: 120, expected: 330, actual: '330' },
    { id: 'P002', name: 'JO GOLD 500ml', loaded: 320, sold: 100, expected: 220, actual: '215' },
    { id: 'P003', name: 'JO GOLD 2L', loaded: 280, sold: 80, expected: 200, actual: '' },
  ]);

  // Mock Financial Data
  const financials = {
    totalCollected: 28500, // Cash + UPI
    cashCollected: 15000,
    upiCollected: 13500,
    creditIssued: 12000,
  };
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  const handleActualChange = (id, val) => {
    setInventory(inv => inv.map(item =>
      item.id === id ? { ...item, actual: val } : item
    ));
  };

  const handleVerifyData = () => {
    const allFilled = inventory.every(item => item.actual !== '');
    if (!allFilled) {
      Alert.alert('Incomplete Verification', 'Please enter the actual physical count for all products.');
      return;
    }
    Alert.alert(
      'Admin Verification',
      'Has the Super Admin verified the stock and cash handover?',
      [
        { text: 'Not Yet', style: 'cancel' },
        { text: 'Yes, Verified', onPress: () => setIsAdminVerified(true) }
      ]
    );
  };

  const handleCloseTrip = () => {
    if (!isAdminVerified) return;

    Alert.alert(
      'Confirm Trip Closure',
      'Are you sure you want to complete this trip? This will lock today\'s data and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Lock',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Trip has been completed and data is locked.', [
              { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
            ]);
          }
        }
      ]
    );
  };

  const allFilled = inventory.every(item => item.actual !== '');

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
        <TouchableOpacity style={styles.menuBtn} onPress={() => setIsSidebarOpen(true)}>
          <Text style={styles.menuIconText}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>SALES AUDIT</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Section 1: Physical Stock Verification */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconBox}><Text style={styles.sectionIcon}>📦</Text></View>
          <View>
            <Text style={styles.sectionTitle}>Physical Stock Verification</Text>
            <Text style={styles.sectionSubtitle}>Compare Expected vs Actual remaining stock.</Text>
          </View>
        </View>

        <View style={styles.stockList}>
          {inventory.map(item => {
            const calculatedExpected = item.loaded - item.sold;
            const actualNum = parseInt(item.actual);
            const isFilled = !isNaN(actualNum);
            const diff = isFilled ? actualNum - calculatedExpected : 0;
            const isLeakage = diff < 0;
            const isVerified = diff === 0;

            return (
              <View key={item.id} style={styles.stockCard}>
                <View style={styles.stockCompactRow}>
                  <View style={styles.stockDetails}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.mathText}>
                      Exp: {calculatedExpected} (L:{item.loaded} - S:{item.sold})
                    </Text>
                  </View>
                  <View style={styles.actualWrapper}>
                    <TextInput
                      style={styles.compactInput}
                      keyboardType="numeric"
                      placeholder="Actual"
                      placeholderTextColor="#CBD5E1"
                      value={item.actual}
                      onChangeText={(val) => handleActualChange(item.id, val)}
                    />
                  </View>
                </View>

                {isFilled && (
                  <View style={[
                    styles.compactBanner,
                    isVerified ? styles.statusVerifiedBg : styles.statusLeakageBg
                  ]}>
                    <Text style={[
                      styles.compactBannerText,
                      isVerified ? styles.statusVerifiedText : styles.statusLeakageText
                    ]}>
                      {isVerified ? '✓ Verified' : `⚠️ ${Math.abs(diff)} short`}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Section 2: Financial Reconciliation */}
        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <View style={styles.sectionIconBox}><Text style={styles.sectionIcon}>🏦</Text></View>
          <View>
            <Text style={styles.sectionTitle}>Financial Reconciliation</Text>
            <Text style={styles.sectionSubtitle}>The Cash Handover Summary.</Text>
          </View>
        </View>

        <View style={styles.financialCard}>
          <TouchableOpacity
            style={styles.financialRow}
            onPress={() => setIsFinancialExpanded(!isFinancialExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.finLabel}>Total Collected</Text>
              <Text style={styles.finSublabel}>(Cash + UPI) {isFinancialExpanded ? '▲' : '▼'}</Text>
            </View>
            <Text style={styles.finCollectedValue}>₹{financials.totalCollected.toLocaleString()}</Text>
          </TouchableOpacity>

          {isFinancialExpanded && (
            <View style={styles.accordionContent}>
              <View style={styles.subRow}>
                <Text style={styles.subLabel}>• Cash</Text>
                <Text style={styles.subValue}>₹{financials.cashCollected.toLocaleString()}</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subLabel}>• UPI</Text>
                <Text style={styles.subValue}>₹{financials.upiCollected.toLocaleString()}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />
          <View style={styles.financialRow}>
            <View>
              <Text style={styles.finLabel}>Credit Issued</Text>
              <Text style={styles.finSublabel}>(Pending Amount)</Text>
            </View>
            <Text style={styles.finCreditValue}>₹{financials.creditIssued.toLocaleString()}</Text>
          </View>

          <View style={styles.instructionBanner}>
            <Text style={styles.instructionIcon}>ℹ️</Text>
            <Text style={styles.instructionText}>
              Please hand over exactly <Text style={styles.instructionHighlight}>₹{financials.totalCollected.toLocaleString()}</Text> to the Super Admin.
            </Text>
          </View>
        </View>

        {/* Section 3: Trip Closure */}
        <View style={styles.closureContainer}>
          {!isAdminVerified ? (
            <TouchableOpacity
              style={[styles.verifyBtn, !allFilled && styles.verifyBtnDisabled]}
              onPress={handleVerifyData}
              disabled={!allFilled}
            >
              <Text style={styles.verifyBtnText}>Submit for Verification</Text>
              <Text style={styles.verifyBtnSubtext}>
                {allFilled ? 'Requires Admin Approval' : 'Fill all actual counts first'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.verifiedBanner}>
              <Text style={styles.verifiedBannerText}>✓ Data Verified by Admin</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.closureBtn, !isAdminVerified && styles.closureBtnDisabled]}
            onPress={handleCloseTrip}
            disabled={!isAdminVerified}
          >
            <Text style={styles.closureBtnText}>Close Trip & Lock Data</Text>
            <Text style={styles.closureBtnSubtext}>Mark supply as COMPLETED</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <BottomNav navigation={navigation} currentRoute="Reconciliation" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 15, paddingTop: StatusBar.currentHeight + 10 || 50, paddingBottom: 10,
    backgroundColor: '#FFFFFF', elevation: 3, zIndex: 10,
  },
  menuBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  menuIconText: { fontSize: 20, color: '#1E293B' },
  headerTitleContainer: { flex: 1, alignItems: 'flex-start', marginLeft: 15 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: 1 },
  headerRight: { width: 40 },
  content: { padding: 12, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 4 },
  sectionIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  sectionSubtitle: { fontSize: 13, color: '#64748B' },
  stockList: { marginBottom: 12, gap: 8 },
  stockCard: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  stockCompactRow: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 10, justifyContent: 'space-between' },
  stockDetails: { flex: 1, marginRight: 10 },
  productName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  mathText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  actualWrapper: { width: 80 },
  compactInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 8, fontSize: 14, fontWeight: '700', color: '#087E66', textAlign: 'center' },
  compactBanner: { paddingVertical: 4, alignItems: 'center' },
  compactBannerText: { fontSize: 11, fontWeight: '800' },
  statusVerifiedBg: { backgroundColor: '#E6F2F0' },
  statusLeakageBg: { backgroundColor: '#FEE2E2' },
  statusVerifiedText: { color: '#087E66' },
  statusLeakageText: { color: '#EF4444' },
  financialCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 1, marginBottom: 15 },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flex: 1 },
  finLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  finSublabel: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  finCollectedValue: { fontSize: 16, fontWeight: '700', color: '#087E66' },
  finCreditValue: { fontSize: 16, fontWeight: '700', color: '#EAB308' },
  accordionContent: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginTop: 10 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subLabel: { fontSize: 14, color: '#64748B' },
  subValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  instructionBanner: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  instructionIcon: { fontSize: 15, marginRight: 8 },
  instructionText: { flex: 1, fontSize: 13, color: '#475569' },
  instructionHighlight: { fontWeight: '700', color: '#1E293B' },
  closureContainer: { marginTop: 10 },
  verifyBtn: { backgroundColor: '#1E293B', borderRadius: 12, paddingVertical: 12, alignItems: 'center', elevation: 2, marginBottom: 12 },
  verifyBtnDisabled: { backgroundColor: '#94A3B8', elevation: 0 },
  verifyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  verifyBtnSubtext: { fontSize: 13, color: '#E2E8F0', marginTop: 2 },
  verifiedBanner: { backgroundColor: '#E6F2F0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#087E66' },
  verifiedBannerText: { fontSize: 15, fontWeight: '700', color: '#087E66' },
  closureBtn: { backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 12, alignItems: 'center', elevation: 3 },
  closureBtnDisabled: { backgroundColor: '#FCA5A5', elevation: 0 },
  closureBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  closureBtnSubtext: { fontSize: 13, color: '#FEE2E2', marginTop: 2 },
});

export default ReconciliationScreen;
