import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar,
  TextInput, Modal, Alert, ActivityIndicator, FlatList, ScrollView, StyleSheet,
} from 'react-native';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useTheme } from '../ThemeContext';
import { recordTaskCompletion } from '../utils/streak';
import DatePickerModal from '../components/DatePickerModal';
import Svg, { Path } from 'react-native-svg';

const FILTERS = ['All', 'Pending', 'Done'];

const daysLeft = dateStr => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff < 0 ? 'Overdue' : diff === 0 ? 'Today' : diff + 'd';
};

const badgeColor = (d, C) => {
  if (!d || d === 'Done') return { bg: C.sageLight, txt: C.sage };
  if (d === 'Overdue') return { bg: '#FDF0EE', txt: '#C0594A' };
  if (d === 'Today') return { bg: C.amberLight, txt: C.amber };
  return { bg: C.accentLight, txt: C.accent };
};

const SearchIcon = ({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const EMPTY_FORM = { name: '', date: '', subjectId: null };

export default function TasksScreen() {
  const { colors, isDark } = useTheme();
  const user = auth.currentUser;
  const C = colors;

  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selSubject, setSelSubject] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);

  const styles = createStyles(C);

  useEffect(() => {
    if (!user) return;

    const qTasks = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubTasks = onSnapshot(
      qTasks,
      snap => {
        const t = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        t.sort((a, b) => a.done - b.done || new Date(a.date) - new Date(b.date));
        setTasks(t);
        setLoading(false);
        setFirestoreError(null);
      },
      err => {
        console.log('Tasks listener error:', err);
        setFirestoreError(err.message);
        setLoading(false);
      }
    );

    const qSub = query(collection(db, 'subjects'), where('userId', '==', user.uid));
    const unsubSubjects = onSnapshot(
      qSub,
      snap => setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.log('Subjects listener error:', err)
    );

    return () => {
      unsubTasks();
      unsubSubjects();
    };
  }, [user]);

  const openAdd = () => {
    setEditingTask(null);
    setForm(EMPTY_FORM);
    setSelSubject(null);
    setModalVisible(true);
  };

  const openEdit = task => {
    setEditingTask(task);
    setForm({ name: task.name, date: task.date || '', subjectId: task.subjectId });
    setSelSubject(subjects.find(s => s.id === task.subjectId) || null);
    setModalVisible(true);
  };

  const saveTask = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      date: form.date || null,
      subjectId: selSubject?.id || null,
      subjectName: selSubject?.name || null,
      subjectColor: selSubject?.color || null,
    };
    try {
      if (editingTask) {
        await updateDoc(doc(db, 'tasks', editingTask.id), payload);
      } else {
        await addDoc(collection(db, 'tasks'), {
          userId: user.uid, ...payload, done: false, createdAt: new Date().toISOString(),
        });
      }
      setModalVisible(false);   // success – close
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save task. Check your connection.');
      setModalVisible(false);   // close anyway so you aren’t stuck
    }
  };

  const toggleDone = async t => {
    try {
      const nowDone = !t.done;
      await updateDoc(doc(db, 'tasks', t.id), { done: nowDone });
      if (nowDone) {
        await recordTaskCompletion(user.uid);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update task.');
    }
  };

  const deleteTask = id => Alert.alert('Delete task', 'Delete this task?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (e) {
        Alert.alert('Error', 'Could not delete task.');
      }
    }},
  ]);

  const filtered = tasks.filter(t => {
    if (filter === 'Pending' && t.done) return false;
    if (filter === 'Done' && !t.done) return false;
    if (subjectFilter && t.subjectId !== subjectFilter) return false;
    if (search.trim() && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const pending = tasks.filter(t => !t.done).length;

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={C.accent} size="large" />
    </SafeAreaView>
  );

  if (firestoreError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 16, color: C.textPrimary, marginBottom: 12 }}>Could not load data</Text>
        <Text style={{ fontSize: 13, color: C.textSecond, textAlign: 'center', marginBottom: 20 }}>{firestoreError}</Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            setFirestoreError(null);
          }}
          style={{ backgroundColor: C.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: C.textPrimary }]}>Tasks</Text>
            <Text style={[styles.count, { color: C.textSecond }]}>{pending} pending · {tasks.length} total</Text>
          </View>
          <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: C.accent }]}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
          <SearchIcon color={C.textHint} />
          <TextInput
            style={[styles.searchInput, { color: C.textPrimary }]}
            placeholder="Search tasks…" placeholderTextColor={C.textHint}
            value={search} onChangeText={setSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: C.textHint, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)}
                style={[styles.filterBtn, { backgroundColor: filter === f ? C.accent : C.card, borderColor: filter === f ? C.accent : C.border }]}>
                <Text style={[styles.filterText, { color: filter === f ? '#fff' : C.textSecond }]}>{f}</Text>
              </TouchableOpacity>
            ))}
            {subjects.map(s => (
              <TouchableOpacity key={s.id} onPress={() => setSubjectFilter(subjectFilter === s.id ? null : s.id)}
                style={[styles.filterBtn, { backgroundColor: subjectFilter === s.id ? s.color + '33' : C.card, borderColor: subjectFilter === s.id ? s.color : C.border }]}>
                <Text style={{ fontSize: 11 }}>{s.icon}</Text>
                <Text style={[styles.filterText, { color: subjectFilter === s.id ? s.color : C.textSecond }]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={{ fontSize: 13, fontWeight: '500', color: C.textHint }}>
            {search ? 'No tasks match your search.' : filter === 'Done' ? 'No completed tasks yet.' : 'No tasks here. Tap + to add one.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: t }) => {
            const dl = t.done ? 'Done' : daysLeft(t.date);
            const bc = badgeColor(dl, C);
            return (
              <TouchableOpacity activeOpacity={0.85} onLongPress={() => openEdit(t)}
                style={[styles.taskCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <TouchableOpacity onPress={() => toggleDone(t)}
                  style={[styles.checkbox, { borderColor: t.done ? C.sage : C.inputBorder, backgroundColor: t.done ? C.sage : 'transparent' }]}>
                  {t.done && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.done ? C.textHint : C.textPrimary, textDecorationLine: t.done ? 'line-through' : 'none' }}>{t.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    {t.subjectColor && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.subjectColor }} />}
                    {t.subjectName && <Text style={{ fontSize: 10, fontWeight: '600', color: C.textSecond }}>{t.subjectName}</Text>}
                    {t.date && <Text style={{ fontSize: 10, fontWeight: '500', color: C.textHint }}>· {t.date}</Text>}
                  </View>
                </View>
                {dl && <View style={[styles.badge, { backgroundColor: bc.bg }]}><Text style={{ fontSize: 10, fontWeight: '700', color: bc.txt }}>{dl}</Text></View>}
                <TouchableOpacity onPress={() => openEdit(t)} style={[styles.editBtn, { backgroundColor: C.accentLight }]}>
                  <Text style={{ fontSize: 10, color: C.accent, fontWeight: '700' }}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(t.id)} style={[styles.deleteBtn, { backgroundColor: isDark ? '#2E1E1A' : '#FDF0EE' }]}>
                  <Text style={{ fontSize: 10, color: '#C0594A', fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: C.card }]}>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>{editingTask ? 'Edit task' : 'Add new task'}</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: C.textSecond }]}>Task name</Text>
              <TextInput style={[styles.input, { backgroundColor: C.inputBg, borderColor: nameFocus ? C.accent : C.inputBorder, color: C.textPrimary }]}
                placeholder="e.g. Chapter 5 exercises" placeholderTextColor={C.textHint}
                value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))}
                onFocus={() => setNameFocus(true)} onBlur={() => setNameFocus(false)} />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: C.textSecond }]}>Due date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(true)}
                style={[styles.input, styles.dateBtn, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
                <Text style={{ fontSize: 14, color: form.date ? C.textPrimary : C.textHint, fontWeight: '500' }}>
                  {form.date || 'Pick a date (optional)'}
                </Text>
                {form.date && (
                  <TouchableOpacity onPress={() => setForm(p => ({ ...p, date: '' }))}>
                    <Text style={{ color: C.textHint, fontSize: 13 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {subjects.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: C.textSecond }]}>Subject</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 7, paddingHorizontal: 2 }}>
                    <TouchableOpacity onPress={() => setSelSubject(null)}
                      style={[styles.subBtn, { backgroundColor: !selSubject ? C.accentLight : C.inputBg, borderColor: !selSubject ? C.accent : C.border }]}>
                      <Text style={[styles.subBtnText, { color: !selSubject ? C.accent : C.textSecond }]}>None</Text>
                    </TouchableOpacity>
                    {subjects.map(s => (
                      <TouchableOpacity key={s.id} onPress={() => setSelSubject(s)}
                        style={[styles.subBtn, { backgroundColor: selSubject?.id === s.id ? s.color + '22' : C.inputBg, borderColor: selSubject?.id === s.id ? s.color : C.border }]}>
                        <Text style={{ fontSize: 12 }}>{s.icon}</Text>
                        <Text style={[styles.subBtnText, { color: selSubject?.id === s.id ? s.color : C.textSecond }]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, { backgroundColor: C.border }]}>
                <Text style={[styles.modalBtnText, { color: C.label }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveTask} style={[styles.modalBtn, { backgroundColor: C.accent }]}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{editingTask ? 'Save' : 'Add task'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={datePickerVisible}
        value={form.date || null}
        colors={C}
        isDark={isDark}
        onCancel={() => setDatePickerVisible(false)}
        onConfirm={d => { setForm(p => ({ ...p, date: d })); setDatePickerVisible(false); }}
      />
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  count: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '600', lineHeight: 28 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '500', padding: 0 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 9, paddingTop: 8 },
  taskCard: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, flexShrink: 0 },
  editBtn: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  deleteBtn: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 18, padding: 20, width: '100%', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  formGroup: { gap: 6 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: '500' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1 },
  subBtnText: { fontSize: 11, fontWeight: '700' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center' },
  modalBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
});