import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar,
  ScrollView, Switch, Alert, ActivityIndicator, Modal, TextInput, StyleSheet,
} from 'react-native';
import { signOut, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useTheme } from '../ThemeContext';
import { getStreak, getUserSettings, saveUserSettings, defaultSettings } from '../utils/streak';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

const Icon = ({ d, color, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const I = {
  moon:    'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  sun:     'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  lock:    'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  shield:  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  doc:     'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  logout:  'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  chevron: 'M9 5l7 7-7 7',
  pencil:  'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
};

const streakEmoji = n => n >= 30 ? '🏆' : n >= 14 ? '🔥' : n >= 7 ? '⚡' : n >= 3 ? '✨' : '🌱';

const Section = ({ title, children, C }) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={{ fontSize: 11, fontWeight: '700', color: C.textHint, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 }}>{title}</Text>
    <View style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
      {children}
    </View>
  </View>
);

const Row = ({ icon, iconColor, iconBg, label, sublabel, right, onPress, danger, last, C }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border }}>
    <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: iconBg || C.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
      <Icon d={icon} color={iconColor || C.accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: danger ? '#C0594A' : C.textPrimary }}>{label}</Text>
      {sublabel && <Text style={{ fontSize: 11, color: C.textSecond, marginTop: 1 }}>{sublabel}</Text>}
    </View>
    {right}
    {onPress && !right && <Icon d={I.chevron} color={C.textHint} />}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const C = colors;
  const user = auth.currentUser;
  if (!user) return null; 

  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(true);

  // Profile edit
  const [nameModal, setNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // Password change
  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const styles = createStyles(C);

  useEffect(() => {
    if (!user) return;
    getStreak(user.uid)
      .then(setStreak)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.uid]);

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }
    setNameLoading(true);
    try {
      await updateProfile(user, { displayName: newName.trim() });
      setNameModal(false);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setNameLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      Alert.alert('Missing fields', 'Fill in both fields.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Too short', 'New password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setPwModal(false);
      Alert.alert('Done', 'Password updated successfully.');
      setCurrentPw('');
      setNewPw('');
    } catch (e) {
      let msg = 'Something went wrong.';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'Current password is incorrect.';
      Alert.alert('Error', msg);
    } finally { setPwLoading(false); }
  };

  const handleLogout = () => Alert.alert('Sign out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => signOut(auth) },
  ]);

  const handleDeleteAccount = () => Alert.alert('Delete account', 'Permanently delete your account and all data?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await deleteUser(user); }
      catch (e) { Alert.alert('Error', 'Sign out and back in before deleting.'); }
    }},
  ]);

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <ActivityIndicator color={C.accent} size="large" style={{ flex: 1 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[styles.pageTitle, { color: C.textPrimary }]}>Settings</Text>

        {/* Profile */}
        <View style={[styles.profileCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={[styles.avatar, { backgroundColor: C.accent }]}>
            <Text style={styles.avatarText}>{(user?.displayName || 'S')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: C.textPrimary }]}>{user?.displayName || 'Student'}</Text>
            <Text style={[styles.profileEmail, { color: C.textSecond }]}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={() => { setNewName(user?.displayName || ''); setNameModal(true); }}
            style={[styles.editAvatarBtn, { backgroundColor: C.accentLight }]}>
            <Icon d={I.pencil} color={C.accent} />
          </TouchableOpacity>
        </View>

        {/* Streak */}
        <View style={[styles.streakCard, { backgroundColor: C.accent }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakLabel}>Task completion streak</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={styles.streakNum}>{streak.currentStreak}</Text>
              <Text style={styles.streakUnit}>day{streak.currentStreak !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={styles.streakSub}>Best: {streak.longestStreak} days</Text>
          </View>
          <Text style={{ fontSize: 52 }}>{streakEmoji(streak.currentStreak)}</Text>
        </View>

        {/* Milestones */}
        <View style={[styles.milestonesCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.textSecond, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>Milestones</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {[{days:3,e:'✨'},{days:7,e:'⚡'},{days:14,e:'🔥'},{days:30,e:'🏆'}].map(m => {
              const reached = streak.currentStreak >= m.days;
              return (
                <View key={m.days} style={{ alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 14, borderWidth: 2, borderColor: reached ? C.accent : C.inputBorder, backgroundColor: reached ? C.accent : C.border, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: reached ? 20 : 16, opacity: reached ? 1 : 0.4 }}>{m.e}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: reached ? C.accent : C.textHint }}>{m.days}d</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Appearance */}
        <Section title="Appearance" C={C}>
          <Row C={C} icon={isDark ? I.moon : I.sun} iconColor={C.amber} iconBg={C.amberLight}
            label={isDark ? 'Dark mode' : 'Light mode'} last
            right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: C.border, true: C.accent }} thumbColor="#fff" />} />
        </Section>

        {/* Account */}
        <Section title="Account" C={C}>
          <Row C={C} icon={I.user} iconColor={C.accent} iconBg={C.accentLight}
            label="Display name" sublabel={user?.displayName || 'Not set'}
            onPress={() => { setNewName(user?.displayName || ''); setNameModal(true); }} />
          <Row C={C} icon={I.lock} iconColor={C.sage} iconBg={C.sageLight}
            label="Change password" onPress={() => setPwModal(true)} last />
        </Section>

        {/* Legal */}
        <Section title="About" C={C}>
          <Row C={C} icon={I.doc} iconColor={C.accent} iconBg={C.accentLight} label="Terms of Service" onPress={() => navigation.navigate('Terms')} />
          <Row C={C} icon={I.shield} iconColor={C.sage} iconBg={C.sageLight} label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} last />
        </Section>

        {/* Danger zone */}
        <Section title="Danger zone" C={C}>
          <Row C={C} icon={I.logout} iconColor="#C0594A" iconBg="#FDF0EE" label="Sign out" onPress={handleLogout} danger />
          <Row C={C} icon={I.trash} iconColor="#C0594A" iconBg="#FDF0EE" label="Delete account" sublabel="Permanently removes all your data" onPress={handleDeleteAccount} danger last />
        </Section>

        <Text style={{ textAlign: 'center', fontSize: 11, color: C.textHint, marginTop: 8 }}>Study Manager v1.0.0</Text>
      </ScrollView>

      {/* Edit name modal */}
      <Modal visible={nameModal} transparent animationType="fade" onRequestClose={() => setNameModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredSheet, { backgroundColor: C.card }]}>
            <Text style={[styles.sheetTitle, { color: C.textPrimary, marginBottom: 14 }]}>Edit display name</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.textPrimary }]}
              placeholder="Your name" placeholderTextColor={C.textHint}
              value={newName} onChangeText={setNewName} autoCapitalize="words" autoFocus />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setNameModal(false)} style={[styles.modalBtn, { backgroundColor: C.border }]}>
                <Text style={{ fontWeight: '600', color: C.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveName} disabled={nameLoading}
                style={[styles.modalBtn, { backgroundColor: C.accent, opacity: nameLoading ? 0.7 : 1 }]}>
                <Text style={{ fontWeight: '700', color: '#fff' }}>{nameLoading ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change password modal */}
      <Modal visible={pwModal} transparent animationType="fade" onRequestClose={() => setPwModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredSheet, { backgroundColor: C.card }]}>
            <Text style={[styles.sheetTitle, { color: C.textPrimary, marginBottom: 14 }]}>Change password</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.textPrimary, marginBottom: 10 }]}
              placeholder="Current password" placeholderTextColor={C.textHint}
              value={currentPw} onChangeText={setCurrentPw} secureTextEntry autoCapitalize="none" />
            <TextInput style={[styles.modalInput, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.textPrimary }]}
              placeholder="New password (min. 6 chars)" placeholderTextColor={C.textHint}
              value={newPw} onChangeText={setNewPw} secureTextEntry autoCapitalize="none" />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setPwModal(false); setCurrentPw(''); setNewPw(''); }}
                style={[styles.modalBtn, { backgroundColor: C.border }]}>
                <Text style={{ fontWeight: '600', color: C.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleChangePassword} disabled={pwLoading}
                style={[styles.modalBtn, { backgroundColor: C.accent, opacity: pwLoading ? 0.7 : 1 }]}>
                <Text style={{ fontWeight: '700', color: '#fff' }}>{pwLoading ? 'Saving…' : 'Update'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 10 },
  pageTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileName: { fontSize: 15, fontWeight: '700' },
  profileEmail: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  editAvatarBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  streakCard: { borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  streakLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  streakNum: { color: '#fff', fontSize: 42, fontWeight: '800', lineHeight: 48 },
  streakUnit: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  streakSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  milestonesCard: { borderRadius: 14, padding: 14, borderWidth: 1 },
  centeredOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  centeredSheet: { borderRadius: 18, padding: 20, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  sheetTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 13, fontSize: 14, fontWeight: '500' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center' },
});