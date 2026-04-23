import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar,
  TextInput, Modal, Alert, ActivityIndicator, FlatList, StyleSheet,
} from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useTheme } from '../ThemeContext';
import DatePickerModal from '../components/DatePickerModal';

const ICONS = ['📐','🔬','📖','🎨','💻','📊','🗺️','🎵','🧬','⚗️','🏛️','📝','🌍','🧮','🎭'];
const COLORS = ['#4F7D5B','#D79C34','#304A9E','#C0594A','#8F578F'];

const EmptyIllustration = ({ color }) => (
  <Svg width={120} height={120} viewBox="0 0 200 200" fill="none">
    <Rect x={30} y={110} width={140} height={30} rx={4} stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x={40} y={80} width={120} height={30} rx={4} stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x={50} y={50} width={100} height={30} rx={4} stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M70 140v20M130 140v20" stroke={color} strokeWidth={6} strokeLinecap="round" />
    <Line x1={30} y1={125} x2={170} y2={125} stroke={color} strokeWidth={6} strokeLinecap="round" />
    <Line x1={40} y1={95} x2={160} y2={95} stroke={color} strokeWidth={6} strokeLinecap="round" />
    <Line x1={50} y1={65} x2={150} y2={65} stroke={color} strokeWidth={6} strokeLinecap="round" />
  </Svg>
);

export default function SubjectsScreen() {
  const { colors, isDark } = useTheme();
  const user = auth.currentUser;
  const C = colors;

  const [subjects, setSubjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add/edit subject modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [name, setName] = useState('');
  const [selIcon, setSelIcon] = useState(0);
  const [selColor, setSelColor] = useState(0);
  const [dupError, setDupError] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);

  // Detail modal
  const [detailSubject, setDetailSubject] = useState(null);
  const [subjectTasks, setSubjectTasks] = useState([]);

  // Add task from detail
  const [addTaskModal, setAddTaskModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [taskNameFocus, setTaskNameFocus] = useState(false);

  const styles = createStyles(C);

  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(query(collection(db, 'subjects'), where('userId', '==', user.uid)),
      snap => { setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    const u2 = onSnapshot(query(collection(db, 'tasks'), where('userId', '==', user.uid)),
      snap => setAllTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); };
  }, [user]);

  useEffect(() => {
    if (!detailSubject) return;
    const tasks = allTasks
      .filter(t => t.subjectId === detailSubject.id)
      .sort((a, b) => a.done - b.done || new Date(a.date) - new Date(b.date));
    setSubjectTasks(tasks);
  }, [detailSubject, allTasks]);

  // ── Subject CRUD ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingSubject(null); setName(''); setSelIcon(0); setSelColor(0); setDupError(false); setModalVisible(true);
  };

  const openEdit = (s) => {
    setEditingSubject(s);
    setName(s.name);
    setSelIcon(ICONS.indexOf(s.icon) >= 0 ? ICONS.indexOf(s.icon) : 0);
    setSelColor(COLORS.indexOf(s.color) >= 0 ? COLORS.indexOf(s.color) : 0);
    setDupError(false);
    setModalVisible(true);
  };

  const saveSubject = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const isDup = subjects.some(s =>
      s.name.toLowerCase() === trimmed.toLowerCase() && s.id !== editingSubject?.id
    );
    if (isDup) { setDupError(true); return; }
    try {
      if (editingSubject) {
        await updateDoc(doc(db, 'subjects', editingSubject.id), {
          name: trimmed, icon: ICONS[selIcon], color: COLORS[selColor],
        });
        const batch = writeBatch(db);
        allTasks.filter(t => t.subjectId === editingSubject.id).forEach(t => {
          batch.update(doc(db, 'tasks', t.id), { subjectName: trimmed, subjectColor: COLORS[selColor] });
        });
        await batch.commit();
      } else {
        await addDoc(collection(db, 'subjects'), {
          userId: user.uid, name: trimmed, icon: ICONS[selIcon],
          color: COLORS[selColor], createdAt: new Date().toISOString(),
        });
      }
      setModalVisible(false);
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const deleteSubject = (s) => Alert.alert(
    'Delete subject',
    `Delete "${s.name}" and all its tasks? This cannot be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'subjects', s.id));
          allTasks.filter(t => t.subjectId === s.id).forEach(t => batch.delete(doc(db, 'tasks', t.id)));
          await batch.commit();
          if (detailSubject?.id === s.id) setDetailSubject(null);
        } catch (e) { Alert.alert('Error', e.message); }
      }},
    ]
  );

  // ── Add task from subject detail ─────────────────────────────────────────
  const openAddTask = () => {
    setTaskName(''); setTaskDate(''); setTaskNameFocus(false); setAddTaskModal(true);
  };

  const saveDetailTask = async () => {
    if (!taskName.trim()) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        name: taskName.trim(),
        date: taskDate || null,
        subjectId: detailSubject.id,
        subjectName: detailSubject.name,
        subjectColor: detailSubject.color,
        done: false,
        createdAt: new Date().toISOString(),
      });
      setAddTaskModal(false);
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const renderTask = useCallback(({ item: t }) => {
    const diff = t.date ? Math.ceil((new Date(t.date) - new Date()) / 86400000) : null;
    const dl = diff === null ? null : diff < 0 ? 'Overdue' : diff === 0 ? 'Today' : `${diff}d`;
    return (
      <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 }}>
        <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: t.done ? C.accent : C.inputBorder, backgroundColor: t.done ? C.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {t.done && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: t.done ? C.textHint : C.textPrimary, textDecorationLine: t.done ? 'line-through' : 'none' }}>{t.name}</Text>
          {t.date && <Text style={{ fontSize: 10, color: C.textSecond, marginTop: 2, fontWeight: '500' }}>Due {t.date}</Text>}
        </View>
        {t.done
          ? <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: C.accentLight }}><Text style={{ fontSize: 10, fontWeight: '700', color: C.accent }}>Done</Text></View>
          : dl
            ? <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: detailSubject?.color + '18' }}><Text style={{ fontSize: 10, fontWeight: '700', color: detailSubject?.color }}>{dl}</Text></View>
            : null}
      </View>
    );
  }, [C, detailSubject]);

  const getCount = (sid) => allTasks.filter(t => t.subjectId === sid);

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={C.accent} size="large" />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: C.textPrimary }]}>Subjects</Text>
            <Text style={[styles.count, { color: C.textSecond }]}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: C.accent }]}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {subjects.length === 0 ? (
          <View style={styles.empty}>
            <EmptyIllustration color={C.border} />
            <Text style={[styles.emptyText, { color: C.textHint }]}>No subjects yet. Start by adding one!</Text>
          </View>
        ) : subjects.map(s => {
          const ts = getCount(s.id);
          const pending = ts.filter(t => !t.done).length;
          return (
            <TouchableOpacity key={s.id}
              style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}
              onPress={() => setDetailSubject(s)} activeOpacity={0.75}>
              <View style={[styles.cardIcon, { backgroundColor: s.color + '22' }]}>
                <Text style={{ fontSize: 19 }}>{s.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: C.textPrimary }]}>{s.name}</Text>
                <Text style={[styles.cardMeta, { color: C.textSecond }]}>
                  {ts.length === 0 ? 'No tasks yet' : `${pending} pending · ${ts.length} total`}
                </Text>
              </View>
              <View style={[styles.cardBar, { backgroundColor: s.color }]} />
              <TouchableOpacity onPress={() => openEdit(s)} style={[styles.iconBtn, { backgroundColor: C.accentLight }]}>
                <Text style={{ fontSize: 11, color: C.accent, fontWeight: '700' }}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteSubject(s)} style={[styles.iconBtn, { backgroundColor: isDark ? '#2E1E1A' : '#FDF0EE' }]}>
                <Text style={{ fontSize: 11, color: '#C0594A', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Add / Edit Subject Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: C.card }]}>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>{editingSubject ? 'Edit subject' : 'Add new subject'}</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: C.textSecond }]}>Name</Text>
              <TextInput style={[styles.input, { backgroundColor: C.inputBg, borderColor: dupError ? '#C0594A' : nameFocus ? C.accent : C.inputBorder, color: C.textPrimary }]}
                placeholder="e.g. Mathematics" placeholderTextColor={C.textHint}
                value={name} onChangeText={t => { setName(t); setDupError(false); }}
                onFocus={() => setNameFocus(true)} onBlur={() => setNameFocus(false)} />
              {dupError && <Text style={styles.error}>Name already exists.</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: C.textSecond }]}>Icon</Text>
              <View style={styles.iconGrid}>
                {ICONS.map((ic, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelIcon(i)}
                    style={[styles.iconOption, { backgroundColor: i === selIcon ? C.accentLight : C.inputBg, borderColor: i === selIcon ? C.accent : 'transparent' }]}>
                    <Text style={{ fontSize: 17 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: C.textSecond }]}>Color</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {COLORS.map((c, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelColor(i)}
                    style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: c, borderWidth: 2.5, borderColor: i === selColor ? C.textPrimary : 'transparent' }} />
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, { backgroundColor: C.border }]}>
                <Text style={[styles.modalBtnText, { color: C.label }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveSubject} style={[styles.modalBtn, { backgroundColor: C.accent }]}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{editingSubject ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subject Detail Modal */}
      <Modal visible={!!detailSubject} transparent={false} animationType="slide" onRequestClose={() => setDetailSubject(null)}>
        {detailSubject && (
          <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <TouchableOpacity onPress={() => setDetailSubject(null)}
                style={{ width: 32, height: 32, backgroundColor: C.border, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, color: C.label }}>←</Text>
              </TouchableOpacity>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: detailSubject.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18 }}>{detailSubject.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: C.textPrimary }}>{detailSubject.name}</Text>
                <Text style={{ fontSize: 11, color: C.textSecond, fontWeight: '500' }}>
                  {subjectTasks.filter(t => !t.done).length} pending · {subjectTasks.length} total
                </Text>
              </View>
              <TouchableOpacity onPress={openAddTask}
                style={{ width: 32, height: 32, backgroundColor: C.accent, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600', lineHeight: 24 }}>+</Text>
              </TouchableOpacity>
            </View>

            {subjectTasks.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <Text style={{ fontSize: 36 }}>📝</Text>
                <Text style={{ fontSize: 13, color: C.textHint, fontWeight: '500' }}>No tasks yet.</Text>
                <TouchableOpacity onPress={openAddTask}
                  style={{ backgroundColor: C.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Add first task</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList data={subjectTasks} keyExtractor={t => t.id}
                contentContainerStyle={{ padding: 16, gap: 8 }}
                showsVerticalScrollIndicator={false} renderItem={renderTask} />
            )}

            {/* Add task modal inside detail */}
            <Modal visible={addTaskModal} transparent animationType="fade" onRequestClose={() => setAddTaskModal(false)}>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: C.card }]}>
                  <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Add task to {detailSubject.name}</Text>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: C.textSecond }]}>Task name</Text>
                    <TextInput style={[styles.input, { backgroundColor: C.inputBg, borderColor: taskNameFocus ? C.accent : C.inputBorder, color: C.textPrimary }]}
                      placeholder="e.g. Chapter 3 review" placeholderTextColor={C.textHint}
                      value={taskName} onChangeText={setTaskName}
                      onFocus={() => setTaskNameFocus(true)} onBlur={() => setTaskNameFocus(false)} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: C.textSecond }]}>Due date</Text>
                    <TouchableOpacity onPress={() => setDatePickerVisible(true)}
                      style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
                      <Text style={{ fontSize: 14, color: taskDate ? C.textPrimary : C.textHint, fontWeight: '500' }}>{taskDate || 'Pick a date (optional)'}</Text>
                      {taskDate && <TouchableOpacity onPress={() => setTaskDate('')}><Text style={{ color: C.textHint }}>✕</Text></TouchableOpacity>}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setAddTaskModal(false)} style={[styles.modalBtn, { backgroundColor: C.border }]}>
                      <Text style={[styles.modalBtnText, { color: C.label }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={saveDetailTask} style={[styles.modalBtn, { backgroundColor: C.accent }]}>
                      <Text style={[styles.modalBtnText, { color: '#fff' }]}>Add task</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </SafeAreaView>
        )}
      </Modal>

      <DatePickerModal
        visible={datePickerVisible}
        value={taskDate || null}
        colors={C}
        onCancel={() => setDatePickerVisible(false)}
        onConfirm={d => { setTaskDate(d); setDatePickerVisible(false); }}
      />
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 30, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  count: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '600', lineHeight: 28 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  cardMeta: { fontSize: 10, marginTop: 2, fontWeight: '500' },
  cardBar: { width: 4, height: 24, borderRadius: 2 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox: { borderRadius: 18, padding: 20, width: '100%', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  formGroup: { gap: 6 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: '500' },
  error: { fontSize: 10, color: '#C0594A', marginTop: 2, fontWeight: '500' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconOption: { width: '22%', aspectRatio: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center' },
  modalBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
});