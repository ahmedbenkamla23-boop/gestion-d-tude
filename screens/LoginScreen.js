import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useTheme } from '../ThemeContext';

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const C = colors;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // On success, navigation will be handled by App.tsx (onAuthStateChanged)
    } catch (e) {
      console.log('Login error code:', e.code);
      // Handle specific Firebase auth errors
      switch (e.code) {
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Check your internet connection.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled.');
          break;
        default:
          setError(`Login failed: ${e.code || 'Unknown error'}`);
      }
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

          <Text style={[styles.title, { color: C.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: C.textSecond }]}>Sign in to your account</Text>

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
              placeholder="••••••••"
              placeholderTextColor={C.textHint}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPwFocus(true)}
              onBlur={() => setPwFocus(false)}
              secureTextEntry={!show}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShow(!show)} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, { color: C.accent }]}>{show ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.forgotText, { color: C.accent }]}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.signInBtn, { backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Sign in</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
            <Text style={[styles.dividerText, { color: C.textHint }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: C.textSecond }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Register')}>
              <Text style={[styles.footerLink, { color: C.accent }]}>Create one</Text>
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
  errorText: { color: '#C0594A', fontSize: 12, marginBottom: 12, fontWeight: '500' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 28 },
  forgotText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  signInBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  signInText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, fontWeight: '500' },
  footerLink: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
});