import React, { useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  Platform,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const DatePickerModal = ({ visible, value, colors, isDark, onCancel, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value + 'T00:00:00') : new Date()
  );

  // Reset internal state when value prop changes (e.g., after clearing)
  React.useEffect(() => {
    setSelectedDate(value ? new Date(value + 'T00:00:00') : new Date());
  }, [value]);

  const handleChange = (event, date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        onCancel();
      } else if (date) {
        setSelectedDate(date);
        // Android picks immediately – confirm
        onConfirm(date.toISOString().split('T')[0]);
      }
    } else {
      // iOS – update the local state only
      if (date) setSelectedDate(date);
    }
  };

  // Android: just render the picker as a dialog (no extra wrapping)
  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display="default"
        onChange={handleChange}
      />
    );
  }

  // iOS: wrap in a bottom‑sheet modal with Cancel/Done
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={[styles.cancelText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                onConfirm(selectedDate.toISOString().split('T')[0])
              }
            >
              <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="inline"
            onChange={handleChange}
            themeVariant={isDark ? 'dark' : 'light'}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  cancelText: { fontSize: 16 },
  doneText: { fontSize: 16, fontWeight: '700' },
});

export default DatePickerModal;