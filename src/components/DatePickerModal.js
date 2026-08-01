import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// Local YYYY-MM-DD formatter without timezone shifts
const getTodayStr = () => {
  const today = new Date();
  const yStr = String(today.getFullYear());
  const mStr = String(today.getMonth() + 1).padStart(2, '0');
  const dStr = String(today.getDate()).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
};

// Timezone-safe date parser for YYYY-MM-DD string
const parseDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    // year, 0-indexed month, day
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
};

const DatePickerModal = ({ isOpen, onClose, selectedDate, onSelectDate, minDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const effectiveMin = minDate === undefined ? getTodayStr() : minDate;

  // Keep internal currentDate in sync with selectedDate, but never allow opening to a past month
  useEffect(() => {
    if (isOpen) {
      const parsed = parseDateString(selectedDate);
      const minParsed = parseDateString(effectiveMin);
      if (parsed && minParsed && parsed < minParsed) {
        setCurrentDate(minParsed);
      } else if (parsed) {
        setCurrentDate(parsed);
      } else {
        setCurrentDate(minParsed || new Date());
      }
    }
  }, [isOpen, selectedDate, effectiveMin]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (y, m) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (y, m) => {
    return new Date(y, m, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Grid days array
  const gridDays = [];

  // 1. Fill previous month's padding days
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    gridDays.push({
      day: daysInPrevMonth - i,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  // 2. Fill current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    gridDays.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // 3. Fill next month's padding days to complete grid rows
  const remaining = 42 - gridDays.length; // 6 weeks * 7 days = 42
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let i = 1; i <= remaining; i++) {
    gridDays.push({
      day: i,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
    });
  }
  const isPastDate = (day, m, y) => {
    const targetStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return targetStr < effectiveMin;
  };

  const canGoPrevMonth = () => {
    if (!effectiveMin) return true;
    const parts = effectiveMin.split('-').map(Number);
    if (parts.length < 2) return true;
    const minY = parts[0];
    const minM = parts[1] - 1; // 0-indexed month
    if (year < minY) return false;
    if (year === minY && month <= minM) return false;
    return true;
  };

  const handlePrevMonth = () => {
    if (!canGoPrevMonth()) return;
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (dayObj) => {
    if (!dayObj.isCurrentMonth || isPastDate(dayObj.day, dayObj.month, dayObj.year)) {
      return;
    }
    const yStr = String(dayObj.year);
    const mStr = String(dayObj.month + 1).padStart(2, '0');
    const dStr = String(dayObj.day).padStart(2, '0');
    const dateStr = `${yStr}-${mStr}-${dStr}`;
    onSelectDate(dateStr);
    onClose();
  };

  const isToday = (day, m, y) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
  };

  const isSelected = (day, m, y) => {
    if (!selectedDate) return false;
    const sel = parseDateString(selectedDate);
    if (!sel) return false;
    return sel.getDate() === day && sel.getMonth() === m && sel.getFullYear() === y;
  };

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn} disabled={!canGoPrevMonth()}>
              <Text style={[styles.navText, !canGoPrevMonth() && styles.disabledNavText]}>❮</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{`${monthNames[month]} ${year}`}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <Text style={styles.navText}>❯</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={styles.weekdays}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, index) => (
              <Text key={index} style={styles.weekdayText}>{d}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {gridDays.map((dObj, idx) => {
              const selected = isSelected(dObj.day, dObj.month, dObj.year);
              const today = isToday(dObj.day, dObj.month, dObj.year);
              const isPast = !dObj.isCurrentMonth || isPastDate(dObj.day, dObj.month, dObj.year);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    selected && styles.selectedDayCell,
                    isPast && styles.disabledDayCell,
                  ]}
                  disabled={isPast}
                  onPress={() => !isPast && handleSelectDay(dObj)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !dObj.isCurrentMonth && styles.paddingDayText,
                      today && styles.todayText,
                      selected && styles.selectedDayText,
                      isPast && styles.pastDayText,
                    ]}
                  >
                    {dObj.day}
                  </Text>
                  {today && !selected && !isPast && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Action */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.88,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  navText: {
    fontSize: 14,
    color: '#087E66',
    fontWeight: 'bold',
  },
  disabledNavText: {
    color: '#CBD5E1',
    opacity: 0.3,
  },
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: (width * 0.88 - 32) / 7,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  dayCell: {
    width: (width * 0.88 - 32) / 7,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 19,
  },
  selectedDayCell: {
    backgroundColor: '#087E66',
  },
  disabledDayCell: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  paddingDayText: {
    color: '#CBD5E1',
  },
  pastDayText: {
    color: '#CBD5E1',
  },
  todayText: {
    fontWeight: '800',
    color: '#087E66',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#087E66',
    marginTop: 2,
    position: 'absolute',
    bottom: 4,
  },
  closeBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default DatePickerModal;
