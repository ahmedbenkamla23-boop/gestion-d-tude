import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, ScrollView,
  Alert, Switch, StatusBar, Modal, StyleSheet,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebaseConfig';
import { useTheme } from '../ThemeContext';
import { getStreak } from '../utils/streak';
import Svg, { Path } from 'react-native-svg';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const IconSubjects = ({ color }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19V8a2 2 0 012-2h12a2 2 0 012 2v11M4 19h16M9 6V4M15 6V4M8 12h8M8 16h5" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const IconTasks = ({ color }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const IconCog = ({ color }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const streakEmoji = n => n >= 30 ? '🏆' : n >= 14 ? '🔥' : n >= 7 ? '⚡' : n >= 3 ? '✨' : '🌱';

const dlLabel = dateStr => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff < 0 ? 'Overdue' : diff === 0 ? 'Today' : `${diff}d`;
};

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const user = auth.currentUser;
  const today = new Date();
  const C = colors;

  const [calDate, setCalDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null); // null = no selection
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [dayModalTasks, setDayModalTasks] = useState([]);
  const [dayModalTitle, setDayModalTitle] = useState('');
  const [dayModalVisible, setDayModalVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    getStreak(user.uid).then(setStreak).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(query(collection(db, 'subjects'), where('userId', '==', user.uid)),
      snap => setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(query(collection(db, 'tasks'), where('userId', '==', user.uid)),
      snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); };
  }, [user]);

  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);
  const upcoming = [...pending].filter(t => t.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);

  const dotDays = tasks.filter(t => t.date && !t.done).map(t => {
    const d = new Date(t.date);
    return d.getFullYear() === calDate.getFullYear() && d.getMonth() === calDate.getMonth()
      ? d.getDate() : null;
  }).filter(Boolean);

  const openDayModal = (d) => {
    const y = calDate.getFullYear(), m = calDate.getMonth();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${y}-${pad(m + 1)}-${pad(d)}`;
    const dayTasks = tasks.filter(t => t.date === dateStr);
    if (dayTasks.length === 0) return; // no tasks — don't open
    setDayModalTasks(dayTasks);
    setDayModalTitle(`${MONTHS[m]} ${d}`);
    setDayModalVisible(true);
    setSelectedDay(d);
  };

  const dlColor = l => l === 'Overdue' ? { color: '#C0594A', bg: '#FDF0EE' } : l === 'Today' ? { color: C.amber, bg: C.amberLight } : { color: C.accent, bg: C.accentLight };

  const renderCal = () => {
    const y = calDate.getFullYear(), m = calDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++)
      cells.push(<View key={`p${i}`} style={styles.calCell}><Text style={{ fontSize: 12, color: C.textHint }}>{prevDays - firstDay + i + 1}</Text></View>);
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
      const isSel = d === selectedDay && !isToday;
      const hasDot = dotDays.includes(d);
      cells.push(
        <TouchableOpacity key={d} onPress={() => openDayModal(d)}
          style={[styles.calCell, { backgroundColor: isToday ? C.accent : isSel ? C.accentLight : 'transparent' }]}>
          <Text style={{ fontSize: 12, fontWeight: isToday || isSel ? '700' : '500', color: isToday ? '#fff' : isSel ? C.accent : C.textPrimary }}>{d}</Text>
          {hasDot && <View style={[styles.calDot, { backgroundColor: isToday ? '#fff' : C.amber }]} />}
        </TouchableOpacity>
      );
    }
    const rem = 42 - firstDay - daysInMonth;
    for (let i = 1; i <= rem; i++)
      cells.push(<View key={`n${i}`} style={styles.calCell}><Text style={{ fontSize: 12, color: C.textHint }}>{i}</Text></View>);
    return cells;
  };

  const styles = createStyles(C);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: C.textSecond }]}>Good morning,</Text>
            <Text style={[styles.userName, { color: C.textPrimary }]}>
              {user?.displayName || user?.email?.split('@')[0] || 'Student'} 👋
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.avatar, { backgroundColor: C.accent }]}>
            <Text style={styles.avatarText}>{(user?.displayName || 'S')[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Streak banner */}
        {streak.currentStreak > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} activeOpacity={0.85}
            style={[styles.streakBanner, { backgroundColor: C.accent }]}>
            <View>
              <Text style={styles.streakTitle}>{streakEmoji(streak.currentStreak)} {streak.currentStreak}-day streak!</Text>
              <Text style={styles.streakSub}>Best: {streak.longestStreak} days · Complete tasks to grow 💪</Text>
            </View>
            <View style={styles.streakRing}>
              <Text style={styles.streakRingNum}>{streak.currentStreak}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Theme toggle */}
        <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }]}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.textPrimary }}>{isDark ? '🌙 Dark mode' : '☀️ Light mode'}</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: C.border, true: C.accent }} thumbColor="#fff" />
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: 'Subjects', num: subjects.length, icon: <IconSubjects color={C.accent} />, bg: C.accentLight },
            { label: 'Pending',  num: pending.length,  icon: <IconTasks color={C.amber} />,    bg: C.amberLight  },
            { label: 'Done',     num: done.length,     icon: <IconCog color={C.sage} />,        bg: C.sageLight   },
          ].map(item => (
            <View key={item.label} style={[styles.card, { flex: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: item.bg }]}>{item.icon}</View>
              <Text style={[styles.statNum, { color: C.textPrimary }]}>{item.num}</Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: C.textSecond, marginTop: 2 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.2 }}>
              {MONTHS[calDate.getMonth()]} {calDate.getFullYear()}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {['‹','›'].map((ch, i) => (
                <TouchableOpacity key={ch} onPress={() => { setSelectedDay(null); setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + (i ? 1 : -1), 1)); }}
                  style={[styles.calNavBtn, { backgroundColor: C.border }]}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: C.textSecond }}>{ch}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {DAYS.map(d => <Text key={d} style={[styles.calDay, { color: C.textHint }]}>{d}</Text>)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{renderCal()}</View>
          <Text style={{ fontSize: 10, color: C.textHint, marginTop: 8, textAlign: 'center' }}>Tap a day with a dot to see tasks</Text>
        </View>

        {/* Upcoming */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.2 }}>Upcoming deadlines</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>See all</Text>
          </TouchableOpacity>
        </View>

        {upcoming.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}>🎉</Text>
            <Text style={{ fontSize: 13, color: C.textHint, fontWeight: '500' }}>No upcoming deadlines!</Text>
          </View>
        ) : upcoming.map(t => {
          const dl = dlLabel(t.date); const bc = dlColor(dl);
          return (
            <View key={t.id} style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }]}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: t.subjectColor || C.accent }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.textPrimary }}>{t.name}</Text>
                <Text style={{ fontSize: 11, color: C.textSecond, marginTop: 3, fontWeight: '500' }}>
                  {t.date}{t.subjectName ? ` · ${t.subjectName}` : ''}
                </Text>
              </View>
              {dl && <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: bc.bg }}><Text style={{ fontSize: 11, fontWeight: '700', color: bc.color }}>{dl}</Text></View>}
            </View>
          );
        })}

        {/* Shortcuts */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {[
            { label: 'Subjects', icon: <IconSubjects color={C.accent} />, bg: C.accentLight, s: 'Subjects' },
            { label: 'Tasks',    icon: <IconTasks color={C.amber} />,    bg: C.amberLight,  s: 'Tasks'    },
            { label: 'Settings', icon: <IconCog color={C.sage} />,       bg: C.sageLight,   s: 'Settings' },
          ].map(f => (
            <TouchableOpacity key={f.label} style={[styles.card, { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14 }]}
              activeOpacity={0.8} onPress={() => navigation.navigate(f.s)}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: f.bg, alignItems: 'center', justifyContent: 'center' }}>{f.icon}</View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: C.textPrimary }}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Day tasks modal */}
      <Modal visible={dayModalVisible} transparent animationType="slide" onRequestClose={() => setDayModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={[styles.daySheet, { backgroundColor: C.card }]}>
            <View style={styles.dayHandle} />
            <Text style={[styles.dayTitle, { color: C.textPrimary }]}>📅 {dayModalTitle}</Text>
            {dayModalTasks.map(t => {
              const dl = t.done ? 'Done' : dlLabel(t.date);
              const bc = t.done ? { color: C.sage, bg: C.sageLight } : dlColor(dl);
              return (
                <View key={t.id} style={[styles.dayTaskRow, { borderColor: C.border }]}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: t.subjectColor || C.accent, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: t.done ? C.textHint : C.textPrimary, textDecorationLine: t.done ? 'line-through' : 'none' }}>{t.name}</Text>
                    {t.subjectName && <Text style={{ fontSize: 10, color: C.textSecond, marginTop: 2 }}>{t.subjectName}</Text>}
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: bc.bg }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: bc.color }}>{dl}</Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity onPress={() => setDayModalVisible(false)}
              style={[styles.dayClose, { backgroundColor: C.border }]}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.textPrimary }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30, gap: 12 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  greeting: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  streakBanner: { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  streakTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 3 },
  streakSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },
  streakRing: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  streakRingNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statNum: { fontSize: 20, fontWeight: '700' },
  calNavBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  calDay: { width: '14.28%', textAlign: 'center', fontSize: 10, fontWeight: '600', paddingVertical: 4 },
  calCell: { width: '14.28%', height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, position: 'relative' },
  calDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 3 },
  daySheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36, gap: 10 },
  dayHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  dayTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  dayTaskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  dayClose: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
});
