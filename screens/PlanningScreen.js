import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StatusBar, ScrollView, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useTheme } from '../ThemeContext';

export default function PlanningScreen() {
  const { colors, isDark } = useTheme();
  const C = colors;
  const user = auth.currentUser;
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    return onSnapshot(q, snap => {
      const t = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      t.sort((a, b) => new Date(a.date) - new Date(b.date));
      setTasks(t);
    });
  }, [user]);

  const grouped = tasks.reduce((acc, task) => {
    const date = task.date || 'No date';
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {});

  const styles = createStyles(C);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: C.textPrimary }]}>Planning</Text>
        {Object.keys(grouped).length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📅</Text>
            <Text style={{ fontSize: 13, color: C.textHint }}>No tasks with dates yet.</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([date, dayTasks]) => (
            <View key={date} style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[styles.dateHeader, { color: C.accent }]}>{date === 'No date' ? 'Unscheduled' : date}</Text>
              {dayTasks.map(task => (
                <View key={task.id} style={styles.taskRow}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: task.subjectColor || C.accent }} />
                  <Text style={[styles.taskName, { color: task.done ? C.textHint : C.textPrimary, textDecorationLine: task.done ? 'line-through' : 'none' }]}>{task.name}</Text>
                  {task.subjectName && <Text style={[styles.subjectName, { color: C.textSecond }]}>({task.subjectName})</Text>}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1 },
  dateHeader: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  taskName: { fontSize: 13, fontWeight: '500' },
  subjectName: { fontSize: 11, fontWeight: '500' },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 10 },
});