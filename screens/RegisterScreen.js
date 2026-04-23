import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useTheme } from '../ThemeContext';

const getStrength = pw => {
  if (!pw) return { w: '0%', c: '#888', l: '' };
  if (pw.length < 6) return { w: '20%', c: '#C0594A', l: 'Too short' };
  const sc = [/[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  if (pw.length < 8 || sc === 0) return { w: '35%', c: '#C0594A', l: 'Weak' };
  if (sc === 1) return { w: '60%', c: '#C49A3C', l: 'Medium' };
  if (sc === 2) return { w: '80%', c: '#5A8A6A', l: 'Strong' };
  return { w: '100%', c: '#5A8A6A', l: 'Very strong' };
};

export default function RegisterScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const C = colors;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [pw2Focus, setPw2Focus] = useState(false);
  const str = getStrength(pw);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !pw || !pw2) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (pw.length < 6) { Alert.alert('Weak password', 'At least 6 characters required.'); return; }
    if (pw !== pw2) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch (e) {
      console.log('Registration error:', e.code);
      let msg = 'Something went wrong.';
      switch (e.code) {
        case 'auth/email-already-in-use':
          msg = 'Email already registered.';
          break;
        case 'auth/invalid-email':
          msg = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          msg = 'Password is too weak. Use at least 6 characters.';
          break;
        case 'auth/network-request-failed':
          msg = 'Network error. Check your connection.';
          break;
        default:
          msg = `Registration failed: ${e.code || 'Unknown error'}`;
      }
      Alert.alert('Registration failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(C);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={[styles.backBtn, { borderColor: C.inputBorder, backgroundColor: C.card }]} onPress={() => navigation.navigate('Welcome')}>
            <Text style={{ fontSize: 18, color: C.label }}>←</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: C.textPrimary }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: C.textSecond }]}>Start organizing your studies</Text>

          <Text style={[styles.label, { color: C.label }]}>Full name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: C.inputBg, borderColor: nameFocus ? C.accent : C.inputBorder, color: C.textPrimary }]}
            placeholder="Your name"
            placeholderTextColor={C.textHint}
            value={name}
            onChangeText={setName}
            onFocus={() => setNameFocus(true)}
            onBlur={() => setNameFocus(false)}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: C.label }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: C.inputBg, borderColor: emailFocus ? C.accent : C.inputBorder, color: C.textPrimary }]}
            placeholder="you@example.com"
            placeholderTextColor={C.textHint}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setEmailFocus(false)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: C.label }]}>Password</Text>
          <View style={[styles.passwordWrap, { backgroundColor: C.inputBg, borderColor: pwFocus ? C.accent : C.inputBorder }]}>
            <TextInput
              style={[styles.passwordInput, { color: C.textPrimary }]}
              placeholder="Min. 6 characters"
              placeholderTextColor={C.textHint}
              value={pw}
              onChangeText={setPw}
              onFocus={() => setPwFocus(true)}
              onBlur={() => setPwFocus(false)}
              secureTextEntry={!showPw}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, { color: C.accent }]}>{showPw ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {pw.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={[styles.strengthBar, { backgroundColor: C.border }]}>
                <View style={[styles.strengthFill, { width: str.w, backgroundColor: str.c }]} />
              </View>
              <Text style={[styles.strengthText, { color: str.c }]}>{str.l}</Text>
            </View>
          )}

          <Text style={[styles.label, { color: C.label }]}>Confirm password</Text>
          <View style={[styles.passwordWrap, { backgroundColor: C.inputBg, borderColor: pw2Focus && pw2.length > 0 && pw2 !== pw ? '#C0594A' : pw2Focus ? C.accent : C.inputBorder }]}>
            <TextInput
              style={[styles.passwordInput, { color: C.textPrimary }]}
              placeholder="Repeat your password"
              placeholderTextColor={C.textHint}
              value={pw2}
              onChangeText={setPw2}
              onFocus={() => setPw2Focus(true)}
              onBlur={() => setPw2Focus(false)}
              secureTextEntry={!showPw2}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPw2(!showPw2)} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, { color: C.accent }]}>{showPw2 ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {pw2.length > 0 && pw2 !== pw && <Text style={styles.errorText}>Passwords do not match</Text>}

          <View style={styles.termsRow}>
            <Text style={[styles.termsText, { color: C.textHint }]}>By signing up you agree to our </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
              <Text style={[styles.termsLink, { color: C.accent }]}>Terms</Text>
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: C.textHint }]}> and </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={[styles.termsLink, { color: C.accent }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: C.textHint }]}>.</Text>
          </View>

          <TouchableOpacity style={[styles.createBtn, { backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>Create account</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: C.textSecond }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={[styles.footerLink, { color: C.accent }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },
  subtitle: { fontSize: 15, marginBottom: 32, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.2 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, marginBottom: 18, fontWeight: '500' },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, marginBottom: 8 },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, fontWeight: '500' },
  toggleBtn: { paddingHorizontal: 14 },
  toggleText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  strengthContainer: { marginBottom: 14 },
  strengthBar: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthText: { fontSize: 11, fontWeight: '600' },
  errorText: { fontSize: 12, color: '#C0594A', marginBottom: 14, fontWeight: '500' },
  termsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginVertical: 16 },
  termsText: { fontSize: 12, fontWeight: '500' },
  termsLink: { fontSize: 12, fontWeight: '700' },
  createBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  createText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, fontWeight: '500' },
  footerLink: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
});