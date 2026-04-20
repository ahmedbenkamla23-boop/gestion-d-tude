import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar,
  TextInput, Modal, Alert, ActivityIndicator, FlatList, ScrollView, StyleSheet
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import app from '../firebaseConfig';
import { useTheme } from '../ThemeContext';

const auth = getAuth(app);
const db = getFirestore(app);

const FILTERS = ['All', 'Pending', 'Done'];

const daysLeft = dateStr => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  return diff + 'd';
};

const badgeColor = (d, C) => {
  if (!d || d === 'Done') return { bg: C.sageLight, txt: C.sage };
  if (d === 'Overdue') return { bg: '#FDF0EE', txt: '#C0594A' };
  if (d === 'Today') return { bg: C.amberLight, txt: C.amber };
  return { bg: C.accentLight, txt: C.accent };
};

export default function TasksScreen() {
  const { colors, isDark } = useTheme();
  const user = auth.currentUser;
  const C = colors;

  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [selSubject, setSelSubject] = useState(null);
  const [dateError, setDateError] = useState('');
  const [taskNameFocus, setTaskNameFocus] = useState(false);
  const [taskDateFocus, setTaskDateFocus] = useState(false);

  const styles = createStyles(C);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsub1 = onSnapshot(q, snap => {
      const t = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      t.sort((a, b) => a.done - b.done || new Date(a.date) - new Date(b.date));
      setTasks(t);
      setLoading(false);
    });
    const q2 = query(collection(db, 'subjects'), where('userId', '==', user.uid));
    const unsub2 = onSnapshot(q2, snap => setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub1(); unsub2(); };
  }, [user]);

  const openModal = () => { setTaskName(''); setTaskDate(''); setSelSubject(subjects[0] || null); setDateError(''); setTaskNameFocus(false); setTaskDateFocus(false); setModalVisible(true); };

  const validateDate = str => /^\d{4}-\d{2}-\d{2}$/.test(str);

  const saveTask = async () => {
    if (!taskName.trim()) return;
    if (taskDate && !validateDate(taskDate)) { setDateError('Use format YYYY-MM-DD'); return; }
    try {
      const dl = daysLeft(taskDate);
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        name: taskName.trim(),
        date: taskDate || null,
        daysLeft: dl,
        subjectId: selSubject?.id || null,
        subjectName: selSubject?.name || null,
        subjectColor: selSubject?.color || null,
        done: false,
        createdAt: new Date().toISOString(),
      });
      setModalVisible(false);
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const toggleDone = async (t) => {
    await updateDoc(doc(db, 'tasks', t.id), { done: !t.done });
  };

  const deleteTask = id => Alert.alert('Delete task', 'Delete this task?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(doc(db, 'tasks', id)) },
  ]);

  const filtered = tasks.filter(t => {
    if (filter === 'Pending') return !t.done;
    if (filter === 'Done') return t.done;
    return true;
  });

  const pending = tasks.filter(t => !t.done).length;

  if (loading) return <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}><ActivityIndicator color={C.accent} size="large" /></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: C.textPrimary }]}>Tasks</Text>
            <Text style={[styles.count, { color: C.textSecond }]}>{pending} pending · {tasks.length} total</Text>
          </View>
          <TouchableOpacity onPress={openModal} style={[styles.addBtn, { backgroundColor: C.accent }]}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={[styles.filterBtn, { backgroundColor: filter === f ? C.accent : C.card, borderColor: filter === f ? C.accent : C.border }]}>
              <Text style={[styles.filterText, { color: filter === f ? '#fff' : C.textSecond }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Task list */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={[styles.emptyText, { color: C.textHint }]}>{filter === 'Done' ? 'No completed tasks yet.' : 'No tasks here. Tap + to add one.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: t }) => {
            const dl = t.done ? 'Done' : daysLeft(t.date);
            const bc = badgeColor(dl, C);
            return (
              <View style={[styles.taskCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <TouchableOpacity onPress={() => toggleDone(t)}
                  style={[styles.checkbox, { borderColor: t.done ? C.sage : C.inputBorder, backgroundColor: t.done ? C.sage : 'transparent' }]}>
                  {t.done && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskName, { color: t.done ? C.textHint : C.textPrimary, textDecorationLine: t.done ? 'line-through' : 'none' }]}>{t.name}</Text>
                  <View style={styles.taskMeta}>
                    {t.subjectColor && <View style={[styles.subjectDot, { backgroundColor: t.subjectColor }]} />}
                    {t.subjectName && <Text style={[styles.subjectName, { color: C.textSecond }]}>{t.subjectName}</Text>}
                    {t.date && <Text style={[styles.taskDate, { color: C.textHint }]}>· {t.date}</Text>}
                  </View>
                </View>
                {dl && (
                  <View style={[styles.badge, { backgroundColor: bc.bg }]}>
                    <Text style={[styles.badgeText, { color: bc.txt }]}>{dl}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => deleteTask(t.id)} style={[styles.deleteBtn, { backgroundColor: isDark ? '#2E1E1A' : '#FDF0EE' }]}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Add Task Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: C.card }]}>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Add new task</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: C.textSecond }]}>Task name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: C.inputBg, borderColor: taskNameFocus ? C.accent : C.inputBorder, color: C.textPrimary }]}
                placeholder="e.g. Chapter 5 exercises"
                placeholderTextColor={C.textHint}
                value={taskName}
                onChangeText={setTaskName}
                onFocus={() => setTaskNameFocus(true)}
                onBlur={() => setTaskNameFocus(false)}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: C.textSecond }]}>Due date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: C.inputBg, borderColor: dateError || taskDateFocus ? (dateError ? '#C0594A' : C.accent) : C.inputBorder, color: C.textPrimary }]}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor={C.textHint}
                value={taskDate}
                onChangeText={t => { setTaskDate(t); setDateError(''); }}
                onFocus={() => setTaskDateFocus(true)}
                onBlur={() => setTaskDateFocus(false)}
                keyboardType="numeric"
              />
              {dateError && <Text style={styles.errorText}>{dateError}</Text>}
            </View>

            {subjects.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: C.textSecond }]}>Subject</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                  <View style={styles.subjectList}>
                    <TouchableOpacity onPress={() => setSelSubject(null)}
                      style={[styles.subjectBtn, { backgroundColor: !selSubject ? C.accentLight : C.inputBg, borderColor: !selSubject ? C.accent : C.border }]}>
                      <Text style={[styles.subjectBtnText, { color: !selSubject ? C.accent : C.textSecond }]}>None</Text>
                    </TouchableOpacity>
                    {subjects.map(s => (
                      <TouchableOpacity key={s.id} onPress={() => setSelSubject(s)}
                        style={[styles.subjectBtn, { backgroundColor: selSubject?.id === s.id ? s.color + '22' : C.inputBg, borderColor: selSubject?.id === s.id ? s.color : C.border }]}>
                        <Text style={{ fontSize: 12 }}>{s.icon}</Text>
                        <Text style={[styles.subjectBtnText, { color: selSubject?.id === s.id ? s.color : C.textSecond }]}>{s.name}</Text>
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
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Add task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 7,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 9,
    paddingTop: 8,
  },
  taskCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  subjectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subjectName: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskDate: {
    fontSize: 10,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteBtnText: {
    fontSize: 10,
    color: '#C0594A',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 18,
    padding: 20,
    width: '100%',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 10,
    color: '#C0594A',
    marginTop: 4,
    fontWeight: '500',
  },
  subjectList: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 4,
  },
  subjectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
  },
  subjectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
