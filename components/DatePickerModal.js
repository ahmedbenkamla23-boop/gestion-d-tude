/**
 * DatePickerModal
 * A zero-dependency date picker using three scroll columns (day / month / year).
 * Usage:
 *   <DatePickerModal
 *     visible={show}
 *     value="2026-04-30"          // YYYY-MM-DD or null
 *     onConfirm={(str) => ...}    // YYYY-MM-DD
 *     onCancel={() => ...}
 *     colors={C}
 *   />
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList, StyleSheet,
} from 'react-native';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ITEM_H = 44;
const VISIBLE = 5;

const pad = n => String(n).padStart(2, '0');

const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();

const Column = ({ data, selected, onSelect, C }) => {
  const ref = useRef(null);
  const idx = data.indexOf(selected);

  useEffect(() => {
    if (ref.current && idx >= 0) {
      setTimeout(() => ref.current?.scrollToIndex({ index: idx, animated: false }), 50);
    }
  }, []);

  return (
    <View style={{ flex: 1, height: ITEM_H * VISIBLE, overflow: 'hidden' }}>
      {/* highlight band */}
      <View pointerEvents="none" style={[styles.band, { top: ITEM_H * 2, borderColor: C.accent }]} />
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={i => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
        onMomentumScrollEnd={e => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          onSelect(data[Math.max(0, Math.min(i, data.length - 1))]);
        }}
        ListHeaderComponent={<View style={{ height: ITEM_H * 2 }} />}
        ListFooterComponent={<View style={{ height: ITEM_H * 2 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.cell, { height: ITEM_H }]}
            onPress={() => {
              onSelect(item);
              const i = data.indexOf(item);
              ref.current?.scrollToIndex({ index: i, animated: true });
            }}>
            <Text style={[styles.cellText, { color: item === selected ? C.accent : C.textSecond, fontWeight: item === selected ? '700' : '400' }]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default function DatePickerModal({ visible, value, onConfirm, onCancel, colors: C }) {
  const today = new Date();
  const parse = v => {
    if (!v) return { d: today.getDate(), m: today.getMonth(), y: today.getFullYear() };
    const [yr, mo, dy] = v.split('-').map(Number);
    return { d: dy, m: mo - 1, y: yr };
  };

  const [sel, setSel] = useState(parse(value));

  useEffect(() => { if (visible) setSel(parse(value)); }, [visible]);

  const days = Array.from({ length: getDaysInMonth(sel.m, sel.y) }, (_, i) => i + 1);
  const months = MONTHS;
  const years = Array.from({ length: 10 }, (_, i) => today.getFullYear() + i);

  const safeDay = Math.min(sel.d, getDaysInMonth(sel.m, sel.y));

  const confirm = () => {
    onConfirm(`${sel.y}-${pad(sel.m + 1)}-${pad(safeDay)}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: C.card }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: C.textPrimary }]}>Select due date</Text>

          <View style={styles.columns}>
            {/* Day */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.colLabel, { color: C.textHint }]}>Day</Text>
              <Column data={days} selected={safeDay} C={C}
                onSelect={d => setSel(p => ({ ...p, d }))} />
            </View>
            {/* Month */}
            <View style={{ flex: 1.4, alignItems: 'center' }}>
              <Text style={[styles.colLabel, { color: C.textHint }]}>Month</Text>
              <Column data={months} selected={MONTHS[sel.m]} C={C}
                onSelect={m => setSel(p => ({ ...p, m: MONTHS.indexOf(m) }))} />
            </View>
            {/* Year */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.colLabel, { color: C.textHint }]}>Year</Text>
              <Column data={years} selected={sel.y} C={C}
                onSelect={y => setSel(p => ({ ...p, y }))} />
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity onPress={onCancel} style={[styles.btn, { backgroundColor: C.border }]}>
              <Text style={[styles.btnText, { color: C.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirm} style={[styles.btn, { backgroundColor: C.accent }]}>
              <Text style={[styles.btnText, { color: '#fff' }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  columns: { flexDirection: 'row', gap: 4 },
  colLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  band: { position: 'absolute', left: 0, right: 0, height: ITEM_H, borderTopWidth: 1.5, borderBottomWidth: 1.5, zIndex: 1 },
  cell: { alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 15 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '700' },
});
