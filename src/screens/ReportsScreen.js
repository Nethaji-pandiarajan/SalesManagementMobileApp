import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

const ReportsScreen = ({ navigation, route }) => {
  const { username } = route.params || { username: 'Admin' };
  const { userData } = useAuth();
  const isAdmin = userData?.role === 'admin';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('today'); // 'today', 'yesterday', 'week', 'custom'
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('');
  const [startDate, setStartDate] = useState('2026-05-10');
  const [endDate, setEndDate] = useState('2026-05-15');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('start'); // 'start' or 'end'
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4); // 0-indexed, so 4 is May

  // Dynamic Sales Report Mock Data
  const reportData = {
    today: {
      dateLabel: 'Today, 21 May 2026',
      totalSales: 45200,
      collections: 38500,
      dueAmount: 6700,
      cashInHand: 25000,
      stockLoaded: 1280,
      stockSold: 840,
      stockRemaining: 440,
      productSales: [
        { name: 'Jo Gold Chekku Gingelly Oil', qty: '120 L', value: 21600, rate: 180 },
        { name: 'Sri Lakshmi Chekku Gingelly Oil', qty: '90 L', value: 15300, rate: 170 },
        { name: 'Jo Gold Chekku Groundnut Oil', qty: '30 L', value: 4800, rate: 160 },
        { name: 'Maha Gold Deepam Oil', qty: '30 L', value: 3600, rate: 120 },
      ],
      shopsVisitedCount: 4,
    },
    yesterday: {
      dateLabel: 'Yesterday, 20 May 2026',
      totalSales: 62800,
      collections: 55000,
      dueAmount: 7800,
      cashInHand: 35000,
      stockLoaded: 1500,
      stockSold: 1100,
      stockRemaining: 400,
      productSales: [
        { name: 'Jo Gold Chekku Gingelly Oil', qty: '180 L', value: 32400, rate: 180 },
        { name: 'Sri Lakshmi Chekku Gingelly Oil', qty: '120 L', value: 20400, rate: 170 },
        { name: 'Jo Gold Chekku Groundnut Oil', qty: '40 L', value: 6400, rate: 160 },
        { name: 'Maha Gold Deepam Oil', qty: '30 L', value: 3600, rate: 120 },
      ],
      shopsVisitedCount: 6,
    },
    week: {
      dateLabel: 'This Week (15 May - 21 May)',
      totalSales: 310500,
      collections: 285000,
      dueAmount: 25500,
      cashInHand: 195000,
      stockLoaded: 8400,
      stockSold: 6200,
      stockRemaining: 2200,
      productSales: [
        { name: 'Jo Gold Chekku Gingelly Oil', qty: '820 L', value: 147600, rate: 180 },
        { name: 'Sri Lakshmi Chekku Gingelly Oil', qty: '640 L', value: 108800, rate: 170 },
        { name: 'Jo Gold Chekku Groundnut Oil', qty: '210 L', value: 33600, rate: 160 },
        { name: 'Maha Gold Deepam Oil', qty: '170 L', value: 20500, rate: 120 },
      ],
      shopsVisitedCount: 28,
    },
    custom: {
      dateLabel: `${startDate} to ${endDate}`,
      totalSales: 185000,
      collections: 160000,
      dueAmount: 25000,
      cashInHand: 110000,
      stockLoaded: 4800,
      stockSold: 3500,
      stockRemaining: 1300,
      productSales: [
        { name: 'Jo Gold Chekku Gingelly Oil', qty: '480 L', value: 86400, rate: 180 },
        { name: 'Sri Lakshmi Chekku Gingelly Oil', qty: '320 L', value: 54400, rate: 170 },
        { name: 'Jo Gold Chekku Groundnut Oil', qty: '120 L', value: 19200, rate: 160 },
        { name: 'Maha Gold Deepam Oil', qty: '100 L', value: 12000, rate: 120 },
      ],
      shopsVisitedCount: 15,
    },
  };

  const currentData = reportData[isAdmin ? selectedRange : 'today'];

  const handleExport = (type) => {
    setExportType(type);
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        'Report Exported',
        `The Sales Report for ${currentData.dateLabel} has been successfully compiled and saved as ${type}.`,
        [{ text: 'Share/Open File' }, { text: 'Dismiss', style: 'cancel' }]
      );
    }, 2200);
  };

  const openDatePicker = (target) => {
    setDatePickerTarget(target);
    const dateStr = target === 'start' ? startDate : endDate;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        setCurrentYear(y);
        setCurrentMonth(m);
      }
    }
    setIsDatePickerOpen(true);
  };

  const handleSelectDay = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;
    if (datePickerTarget === 'start') {
      setStartDate(dateString);
    } else {
      setEndDate(dateString);
    }
    setIsDatePickerOpen(false);
  };

  // Calendar calculation
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const cells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ id: `pad-${i}`, val: '', empty: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ id: `day-${d}`, val: d, empty: false });
  }

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleApplyCustomRange = () => {
    Alert.alert(
      'Custom Range Applied',
      `Displaying sales report from ${startDate} to ${endDate}.`
    );
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
        <TouchableOpacity style={styles.menuBtn} onPress={() => setIsSidebarOpen(true)}>
          <Text style={styles.menuIconText}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>SALES REPORTS</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {isAdmin && (
          /* Modern Date Range Pills */
          <View style={styles.rangeSelector}>
            <TouchableOpacity
              style={[styles.rangePill, selectedRange === 'today' && styles.activeRangePill]}
              onPress={() => setSelectedRange('today')}
            >
              <Text style={[styles.rangePillText, selectedRange === 'today' && styles.activeRangePillText]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rangePill, selectedRange === 'week' && styles.activeRangePill]}
              onPress={() => setSelectedRange('week')}
            >
              <Text style={[styles.rangePillText, selectedRange === 'week' && styles.activeRangePillText]}>
                This Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rangePill, selectedRange === 'custom' && styles.activeRangePill]}
              onPress={() => setSelectedRange('custom')}
            >
              <Text style={[styles.rangePillText, selectedRange === 'custom' && styles.activeRangePillText]}>
                Custom Range
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isAdmin && selectedRange === 'custom' && (
          /* Custom Date Range Picker Container */
          <View style={styles.customRangeContainer}>
            <Text style={styles.customRangeHeading}>Select Custom Range</Text>
            <View style={styles.dateInputsRow}>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateInputLabel}>From Date</Text>
                <TouchableOpacity
                  style={styles.dateInputField}
                  onPress={() => openDatePicker('start')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dateInputText}>{startDate}</Text>
                  <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateInputLabel}>To Date</Text>
                <TouchableOpacity
                  style={styles.dateInputField}
                  onPress={() => openDatePicker('end')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dateInputText}>{endDate}</Text>
                  <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCustomRange}>
              <Text style={styles.applyBtnText}>Apply Custom Range</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Date Display */}
        <View style={styles.dateBanner}>
          <Text style={styles.dateText}>📅 {currentData.dateLabel}</Text>
        </View>

        {/* Performance Cards Grid */}
        <View style={styles.gridRow}>
          <View style={[styles.gridCard, styles.tealLeftBorder]}>
            <Text style={styles.gridCardLabel}>TOTAL SALES</Text>
            <Text style={styles.gridCardValue}>₹{currentData.totalSales.toLocaleString()}</Text>
            <Text style={styles.gridCardSub}>Order Value</Text>
          </View>
          <View style={[styles.gridCard, styles.darkLeftBorder]}>
            <Text style={styles.gridCardLabel}>COLLECTIONS</Text>
            <Text style={[styles.gridCardValue, styles.tealText]}>₹{currentData.collections.toLocaleString()}</Text>
            <Text style={styles.gridCardSub}>Received Cash/Online</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.gridCard, styles.redLeftBorder]}>
            <Text style={styles.gridCardLabel}>DUE AMOUNT</Text>
            <Text style={[styles.gridCardValue, styles.redText]}>₹{currentData.dueAmount.toLocaleString()}</Text>
            <Text style={styles.gridCardSub}>Pending Balance</Text>
          </View>
          <View style={[styles.gridCard, styles.blueLeftBorder]}>
            <Text style={styles.gridCardLabel}>SHOPS VISITED</Text>
            <Text style={styles.gridCardValue}>{currentData.shopsVisitedCount}</Text>
            <Text style={styles.gridCardSub}>Active Customers</Text>
          </View>
        </View>

        {/* Cash Status */}
        <View style={styles.cashStatusCard}>
          <View style={styles.cashIconWrapper}>
            <Text style={styles.cashIconText}>💵</Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.cashStatusLabel}>Total Cash In Hand</Text>
            <Text style={styles.cashStatusValue}>₹{currentData.cashInHand.toLocaleString()}</Text>
          </View>
        </View>

        {/* Stock Metrics summary */}
        <Text style={styles.sectionHeading}>Trip Stock Summary</Text>
        <View style={styles.stockCard}>
          <View style={styles.stockColumn}>
            <Text style={styles.stockLabel}>LOADED</Text>
            <Text style={styles.stockValue}>{currentData.stockLoaded} L</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.stockColumn}>
            <Text style={styles.stockLabel}>SOLD</Text>
            <Text style={[styles.stockValue, styles.tealText]}>{currentData.stockSold} L</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.stockColumn}>
            <Text style={styles.stockLabel}>REMAINING</Text>
            <Text style={[styles.stockValue, styles.orangeText]}>{currentData.stockRemaining} L</Text>
          </View>
        </View>

        {/* Product Sales Breakdown */}
        <Text style={styles.sectionHeading}>Product Sales Breakdown</Text>
        <View style={styles.breakdownCard}>
          {currentData.productSales.map((item, idx) => (
            <View key={idx} style={[styles.productRow, idx === currentData.productSales.length - 1 && styles.lastProductRow]}>
              <View style={styles.flex1}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSub}>Rate: ₹{item.rate}/L</Text>
              </View>
              <View style={styles.alignEnd}>
                <Text style={styles.productQty}>{item.qty}</Text>
                <Text style={styles.productVal}>₹{item.value.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        {isAdmin && (
          /* Export Options Section */
          <View style={styles.exportSection}>
            <Text style={styles.sectionHeading}>Export Sales Report</Text>
            <View style={styles.exportBtnsRow}>
              <TouchableOpacity style={[styles.exportBtn, styles.exportPdfBtn]} onPress={() => handleExport('PDF')}>
                <View style={styles.exportIconWrapper}>
                  <Text style={styles.exportBtnIcon}>📄</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.exportBtnText}>Export as PDF Document</Text>
                  <Text style={styles.exportBtnSub}>Download styled print-ready PDF layout</Text>
                </View>
                <Text style={styles.exportChevron}>➔</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.exportBtn, styles.exportExcelBtn]} onPress={() => handleExport('Excel')}>
                <View style={styles.exportIconWrapper}>
                  <Text style={styles.exportBtnIcon}>📊</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.exportBtnText}>Export as Excel Sheet (XLSX)</Text>
                  <Text style={styles.exportBtnSub}>Complete data grid formatted for Excel</Text>
                </View>
                <Text style={styles.exportChevron}>➔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.exportBtn, styles.exportCsvBtn]} onPress={() => handleExport('CSV')}>
                <View style={styles.exportIconWrapper}>
                  <Text style={styles.exportBtnIcon}>📁</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.exportBtnText}>Export as Raw CSV File</Text>
                  <Text style={styles.exportBtnSub}>Simple comma-separated values format</Text>
                </View>
                <Text style={styles.exportChevron}>➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Export Loader Modal */}
      <Modal visible={isExporting} transparent={true} animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#087E66" />
            <Text style={styles.loaderText}>Generating {exportType} Report...</Text>
            <Text style={styles.loaderSub}>Calculating values & building layout...</Text>
          </View>
        </View>
      </Modal>

      {/* Custom Calendar Date Picker Modal */}
      <Modal visible={isDatePickerOpen} transparent={true} animationType="fade">
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalCard}>
            {/* Calendar Header */}
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                <Text style={styles.monthNavText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                <Text style={styles.monthNavText}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.weekdaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <View key={day} style={styles.weekdayCol}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {cells.map((cell) => {
                const targetDayStr = cell.empty
                  ? ''
                  : `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(cell.val).padStart(2, '0')}`;
                const isSelected = targetDayStr && targetDayStr === (datePickerTarget === 'start' ? startDate : endDate);
                return (
                  <TouchableOpacity
                    key={cell.id}
                    disabled={cell.empty}
                    onPress={() => handleSelectDay(cell.val)}
                    style={[
                      styles.dayCell,
                      cell.empty && styles.emptyDayCell,
                      isSelected && styles.selectedDayCell,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        cell.empty && styles.emptyDayText,
                        isSelected && styles.selectedDayText,
                      ]}
                    >
                      {cell.val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeCalendarBtn}
              onPress={() => setIsDatePickerOpen(false)}
            >
              <Text style={styles.closeCalendarBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} currentRoute="Reports" />
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
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeRangePill: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rangePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  activeRangePillText: {
    color: '#087E66',
  },
  dateBanner: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exportSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  exportBtnsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  exportPdfBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  exportExcelBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  exportCsvBtn: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  exportIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exportBtnIcon: {
    fontSize: 16,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  exportBtnSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  exportChevron: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
  },
  customRangeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  customRangeHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  dateInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  dateInputText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    padding: 0,
    flex: 1,
  },
  calendarIcon: {
    fontSize: 14,
  },
  applyBtn: {
    backgroundColor: '#087E66',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  gridCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  gridCardValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 2,
  },
  gridCardSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  cashStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cashIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cashIconText: {
    fontSize: 20,
  },
  cashStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  cashStatusValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10B981',
  },
  stockCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    alignItems: 'center',
  },
  stockColumn: {
    flex: 1,
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastProductRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  productName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  productSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  productQty: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  productVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#087E66',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  flex1: {
    flex: 1,
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  loaderText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 4,
  },
  loaderSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  tealLeftBorder: {
    borderLeftColor: '#087E66',
    borderLeftWidth: 4,
  },
  darkLeftBorder: {
    borderLeftColor: '#1E293B',
    borderLeftWidth: 4,
  },
  redLeftBorder: {
    borderLeftColor: '#EF4444',
    borderLeftWidth: 4,
  },
  blueLeftBorder: {
    borderLeftColor: '#0ea5e9',
    borderLeftWidth: 4,
  },
  tealText: {
    color: '#087E66',
  },
  redText: {
    color: '#EF4444',
  },
  orangeText: {
    color: '#F59E0B',
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '90%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  monthNavText: {
    fontSize: 14,
    color: '#475569',
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  emptyDayCell: {
    backgroundColor: 'transparent',
  },
  selectedDayCell: {
    backgroundColor: '#087E66',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  emptyDayText: {
    color: 'transparent',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  closeCalendarBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCalendarBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
});

export default ReportsScreen;
