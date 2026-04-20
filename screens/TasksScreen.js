import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar,
  TextInput, Modal, Alert, ActivityIndicator, FlatList, ScrollView
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
  }, []);

  const openModal = () => { setTaskName(''); setTaskDate(''); setSelSubject(subjects[0] || null); setDateError(''); setModalVisible(true); };

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
  const lblStyle = { fontSize: 10, fontWeight: '600', color: C.textSecond, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={C.accent} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: C.textPrimary }}>Tasks</Text>
            <Text style={{ fontSize: 11, color: C.textSecond, marginTop: 1 }}>{pending} pending · {tasks.length} total</Text>
          </View>
          <TouchableOpacity onPress={openModal} style={{ width: 32, height: 32, backgroundColor: C.accent, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26 }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: filter === f ? C.accent : C.card, borderWidth: 1, borderColor: filter === f ? C.accent : C.border }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: filter === f ? '#fff' : C.textSecond }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Task list */}
      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ fontSize: 28 }}>✅</Text>
          <Text style={{ fontSize: 13, color: C.textHint, fontWeight: '500' }}>{filter === 'Done' ? 'No completed tasks yet.' : 'No tasks here. Tap + to add one.'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, gap: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: t }) => {
            const dl = t.done ? 'Done' : daysLeft(t.date);
            const bc = badgeColor(dl, C);
            return (
              <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity onPress={() => toggleDone(t)}
                  style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: t.done ? C.sage : C.inputBorder, backgroundColor: t.done ? C.sage : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {t.done && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.done ? C.textHint : C.textPrimary, textDecorationLine: t.done ? 'line-through' : 'none' }}>{t.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    {t.subjectColor && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.subjectColor }} />}
                    {t.subjectName && <Text style={{ fontSize: 10, color: C.textSecond }}>{t.subjectName}</Text>}
                    {t.date && <Text style={{ fontSize: 10, color: C.textHint }}>· {t.date}</Text>}
                  </View>
                </View>
                {dl && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, backgroundColor: bc.bg }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: bc.txt }}>{dl}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => deleteTask(t.id)} style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: isDark ? '#2E1E1A' : '#FDF0EE', alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}>
                  <Text style={{ fontSize: 10, color: '#C0594A' }}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Add Task Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, width: '100%', gap: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary }}>Add new task</Text>

            <View>
              <Text style={lblStyle}>Task name</Text>
              <TextInput
                style={{ backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, padding: 10, fontSize: 13, color: C.textPrimary }}
                placeholder="e.g. Chapter 5 exercises"
                placeholderTextColor={C.textHint}
                value={taskName}
                onChangeText={setTaskName}
              />
            </View>

            <View>
              <Text style={lblStyle}>Due date</Text>
              <TextInput
                style={{ backgroundColor: C.inputBg, borderWidth: 1, borderColor: dateError ? '#C0594A' : C.inputBorder, borderRadius: 10, padding: 10, fontSize: 13, color: C.textPrimary }}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor={C.textHint}
                value={taskDate}
                onChangeText={t => { setTaskDate(t); setDateError(''); }}
                keyboardType="numeric"
              />
              {dateError ? <Text style={{ fontSize: 10, color: '#C0594A', marginTop: 4 }}>{dateError}</Text> : null}
            </View>

            {subjects.length > 0 && (
              <View>
                <Text style={lblStyle}>Subject</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity onPress={() => setSelSubject(null)}
                      style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, backgroundColor: !selSubject ? C.accentLight : C.inputBg, borderWidth: 1, borderColor: !selSubject ? C.accent : C.border }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: !selSubject ? C.accent : C.textSecond }}>None</Text>
                    </TouchableOpacity>
                    {subjects.map(s => (
                      <TouchableOpacity key={s.id} onPress={() => setSelSubject(s)}
                        style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: selSubject?.id === s.id ? s.color + '22' : C.inputBg, borderWidth: 1, borderColor: selSubject?.id === s.id ? s.color : C.border }}>
                        <Text style={{ fontSize: 12 }}>{s.icon}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: selSubject?.id === s.id ? s.color : C.textSecond }}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, backgroundColor: C.border, borderRadius: 10, padding: 11, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.label }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveTask} style={{ flex: 1, backgroundColor: C.accent, borderRadius: 10, padding: 11, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Add task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
