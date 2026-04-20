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

  const renderCal = () => {
    const y = calDate.getFullYear(), m = calDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const taskDays = TASK_DATES[`${y}-${m}`] || [];
    const cells = [];
    for (let i = 0; i < firstDay; i++)
      cells.push(<View key={`p${i}`} style={{ width: '14.28%', height: 34, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 12, color: C.textHint }}>{prevDays - firstDay + i + 1}</Text></View>);
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
      const isSel = d === selected && !isToday;
      const hasDot = taskDays.includes(d);
      cells.push(
        <TouchableOpacity key={d} onPress={() => setSelected(d)}
          style={{ width: '14.28%', height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, position: 'relative',
            backgroundColor: isToday ? C.accent : isSel ? C.accentLight : 'transparent' }}>
          <Text style={{ fontSize: 12, fontWeight: isToday || isSel ? '700' : '500', color: isToday ? '#fff' : isSel ? C.accent : C.textPrimary }}>{d}</Text>
          {hasDot && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isToday ? '#fff' : C.amber, position: 'absolute', bottom: 3 }} />}
        </TouchableOpacity>
      );
    }
    const rem = 42 - firstDay - daysInMonth;
    for (let i = 1; i <= rem; i++)
      cells.push(<View key={`n${i}`} style={{ width: '14.28%', height: 34, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 12, color: C.textHint }}>{i}</Text></View>);
    return cells;
  };

  const handleLogout = () => Alert.alert('Sign out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => signOut(auth).catch(e => Alert.alert('Error', e.message)) },
  ]);

  const card = { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30, gap: 12 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 12, color: C.textSecond }}>Good morning,</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: C.textPrimary }}>{user?.displayName || user?.email?.split('@')[0] || 'Student'} 👋</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={{ width: 38, height: 38, backgroundColor: C.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{(user?.displayName || 'S')[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Dark mode toggle */}
        <View style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }]}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.textPrimary }}>{isDark ? '🌙 Dark mode' : '☀️ Light mode'}</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: C.border, true: C.accent }} thumbColor="#fff" />
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: 'Subjects', num: '6', icon: <IconSubjects color={C.accent} />, bg: C.accentLight },
            { label: 'Due soon', num: '4', icon: <IconTasks color={C.amber} />, bg: C.amberLight },
            { label: 'Done',     num: '12', icon: <IconPlanning color={C.sage} />, bg: C.sageLight },
          ].map(item => (
            <View key={item.label} style={[card, { flex: 1 }]}>
              <View style={{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 6, backgroundColor: item.bg }}>{item.icon}</View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: C.textPrimary }}>{item.num}</Text>
              <Text style={{ fontSize: 10, color: C.textSecond, fontWeight: '500', marginTop: 1 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar */}
        <View style={card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary }}>{MONTHS[calDate.getMonth()]} {calDate.getFullYear()}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {['‹','›'].map((ch, i) => (
                <TouchableOpacity key={ch} onPress={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + (i ? 1 : -1), 1))}
                  style={{ width: 28, height: 28, backgroundColor: C.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16, color: C.textSecond, fontWeight: '600' }}>{ch}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {DAYS.map(d => <Text key={d} style={{ width: '14.28%', textAlign: 'center', fontSize: 10, fontWeight: '600', color: C.textHint, paddingVertical: 3 }}>{d}</Text>)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{renderCal()}</View>
        </View>

        {/* Upcoming */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary }}>Upcoming deadlines</Text>
          <Text style={{ fontSize: 12, color: C.accent, fontWeight: '600' }}>See all</Text>
        </View>
        {[
          { name: 'Maths — Chapter 5',   meta: 'Apr 19 · Homework', color: C.accent, bg: C.accentLight, badge: '2d' },
          { name: 'Physics — Lab report', meta: 'Apr 21 · Report',   color: C.amber,  bg: C.amberLight,  badge: '4d' },
          { name: 'English — Essay',      meta: 'Apr 25 · Essay',    color: C.sage,   bg: C.sageLight,   badge: '8d' },
        ].map(t => (
          <View key={t.name} style={[card, { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }]}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: t.color }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.textPrimary }}>{t.name}</Text>
              <Text style={{ fontSize: 11, color: C.textSecond, marginTop: 2 }}>{t.meta}</Text>
            </View>
            <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: t.bg }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.color }}>{t.badge}</Text>
            </View>
          </View>
        ))}

        {/* Feature shortcuts */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: 'Subjects', icon: <IconSubjects color={C.accent} />, bg: C.accentLight },
            { label: 'Tasks',    icon: <IconTasks color={C.amber} />,    bg: C.amberLight  },
            { label: 'Planning', icon: <IconPlanning color={C.sage} />,  bg: C.sageLight   },
          ].map(f => (
            <TouchableOpacity key={f.label} style={[card, { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12 }]} activeOpacity={0.8}>
              <View style={{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: f.bg }}>{f.icon}</View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: C.textPrimary }}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
