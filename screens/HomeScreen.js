import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Switch, StatusBar, StyleSheet } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import app from '../firebaseConfig';
import { useTheme } from '../ThemeContext';
import Svg, { Path, Rect } from 'react-native-svg';

const auth = getAuth(app);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const TASK_DATES = { '2026-3': [19, 21, 25, 28] };

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
const IconPlanning = ({ color }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={18} rx={3} stroke={color} strokeWidth={2} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const user = auth.currentUser;
  const today = new Date();
  const [calDate, setCalDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.getDate());

  const C = colors;
  const styles = createStyles(C);

  const renderCal = () => {
    const y = calDate.getFullYear(), m = calDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const taskDays = TASK_DATES[`${y}-${m}`] || [];
    const cells = [];
    for (let i = 0; i < firstDay; i++)
      cells.push(<View key={`p${i}`} style={styles.calCell}><Text style={{ fontSize: 12, color: C.textHint }}>{prevDays - firstDay + i + 1}</Text></View>);
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
      const isSel = d === selected && !isToday;
      const hasDot = taskDays.includes(d);
      cells.push(
        <TouchableOpacity key={d} onPress={() => setSelected(d)}
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

  const handleLogout = () => Alert.alert('Sign out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => signOut(auth).catch(e => Alert.alert('Error', e.message)) },
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: C.textSecond }]}>Good morning,</Text>
            <Text style={[styles.userName, { color: C.textPrimary }]}>{user?.displayName || user?.email?.split('@')[0] || 'Student'} 👋</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={[styles.avatar, { backgroundColor: C.accent }]}>
            <Text style={styles.avatarText}>{(user?.displayName || 'S')[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Dark mode toggle */}
        <View style={[styles.card, styles.themeToggle]}>
          <Text style={[styles.themeLabel, { color: C.textPrimary }]}>{isDark ? '🌙 Dark mode' : '☀️ Light mode'}</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: C.border, true: C.accent }} thumbColor="#fff" />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Subjects', num: '6', icon: <IconSubjects color={C.accent} />, bg: C.accentLight },
            { label: 'Due soon', num: '4', icon: <IconTasks color={C.amber} />, bg: C.amberLight },
            { label: 'Done',     num: '12', icon: <IconPlanning color={C.sage} />, bg: C.sageLight },
          ].map(item => (
            <View key={item.label} style={[styles.card, styles.statCard]}>
              <View style={[styles.statIcon, { backgroundColor: item.bg }]}>{item.icon}</View>
              <Text style={[styles.statNum, { color: C.textPrimary }]}>{item.num}</Text>
              <Text style={[styles.statLabel, { color: C.textSecond }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar */}
        <View style={styles.card}>
          <View style={styles.calHeader}>
            <Text style={[styles.calMonth, { color: C.textPrimary }]}>{MONTHS[calDate.getMonth()]} {calDate.getFullYear()}</Text>
            <View style={styles.calNav}>
              {['‹','›'].map((ch, i) => (
                <TouchableOpacity key={ch} onPress={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + (i ? 1 : -1), 1))}
                  style={[styles.calNavBtn, { backgroundColor: C.border }]}>
                  <Text style={[styles.calNavText, { color: C.textSecond }]}>{ch}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.calDaysHeader}>
            {DAYS.map(d => <Text key={d} style={[styles.calDay, { color: C.textHint }]}>{d}</Text>)}
          </View>
          <View style={styles.calGrid}>{renderCal()}</View>
        </View>

        {/* Upcoming */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Upcoming deadlines</Text>
          <Text style={[styles.seeAll, { color: C.accent }]}>See all</Text>
        </View>
        {[
          { name: 'Maths — Chapter 5',   meta: 'Apr 19 · Homework', color: C.accent, bg: C.accentLight, badge: '2d' },
          { name: 'Physics — Lab report', meta: 'Apr 21 · Report',   color: C.amber,  bg: C.amberLight,  badge: '4d' },
          { name: 'English — Essay',      meta: 'Apr 25 · Essay',    color: C.sage,   bg: C.sageLight,   badge: '8d' },
        ].map(t => (
          <View key={t.name} style={[styles.card, styles.taskCard]}>
            <View style={[styles.taskDot, { backgroundColor: t.color }]} />
            <View style={styles.taskInfo}>
              <Text style={[styles.taskName, { color: C.textPrimary }]}>{t.name}</Text>
              <Text style={[styles.taskMeta, { color: C.textSecond }]}>{t.meta}</Text>
            </View>
            <View style={[styles.taskBadge, { backgroundColor: t.bg }]}>
              <Text style={[styles.taskBadgeText, { color: t.color }]}>{t.badge}</Text>
            </View>
          </View>
        ))}

        {/* Feature shortcuts */}
        <View style={styles.shortcutsRow}>
          {[
            { label: 'Subjects', icon: <IconSubjects color={C.accent} />, bg: C.accentLight },
            { label: 'Tasks',    icon: <IconTasks color={C.amber} />,    bg: C.amberLight  },
            { label: 'Planning', icon: <IconPlanning color={C.sage} />,  bg: C.sageLight   },
          ].map(f => (
            <TouchableOpacity key={f.label} style={[styles.card, styles.shortcutCard]} activeOpacity={0.8}>
              <View style={[styles.shortcutIcon, { backgroundColor: f.bg }]}>{f.icon}</View>
              <Text style={[styles.shortcutLabel, { color: C.textPrimary }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calMonth: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  calNav: {
    flexDirection: 'row',
    gap: 6,
  },
  calNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calDaysHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calDay: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    paddingVertical: 4,
    letterSpacing: 0.1,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%',
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  calDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  taskDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  taskMeta: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  taskBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  taskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  shortcutCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  shortcutIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
