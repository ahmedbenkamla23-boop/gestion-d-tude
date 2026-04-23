import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  StatusBar, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useTheme } from '../ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const C = colors;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);

  const handleReset = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (e) {
      if (e.code === 'auth/user-not-found') setError('No account found with this email.');
      else if (e.code === 'auth/invalid-email') setError('Invalid email address.');
      else setError('Something went wrong. Try again.');
    } finally { setLoading(false); }
  };

  const styles = createStyles(C);

  if (sent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
        <View style={styles.scrollContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: C.inputBorder, backgroundColor: C.card }]}>
            <Text style={{ fontSize: 18, color: C.label }}>←</Text>
          </TouchableOpacity>
          <View style={[styles.successBox, { backgroundColor: C.accentLight, borderColor: C.accent }]}>
            <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 10 }}>📬</Text>
            <Text style={[styles.successTitle, { color: C.accent }]}>Email sent!</Text>
            <Text style={[styles.successText, { color: C.textSecond }]}>
              Check your inbox for the reset link.
            </Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: C.accent, marginTop: 20 }]} onPress={() => navigation.goBack()}>
              <Text style={styles.btnText}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={[styles.backBtn, { borderColor: C.inputBorder, backgroundColor: C.card }]} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 18, color: C.label }}>←</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: C.textPrimary }]}>Reset password</Text>
          <Text style={[styles.subtitle, { color: C.textSecond }]}>Enter your email and we'll send you a reset link.</Text>

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
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.btn, { backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }]} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send reset link</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={[styles.backLinkText, { color: C.accent }]}>Back to sign in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 32, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, marginBottom: 8, fontWeight: '500' },
  errorText: { color: '#C0594A', fontSize: 12, marginBottom: 12, fontWeight: '500' },
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  backLink: { alignItems: 'center' },
  backLinkText: { fontSize: 14, fontWeight: '600' },
  successBox: { borderRadius: 16, borderWidth: 1, padding: 24, marginTop: 10, alignItems: 'center' },
  successTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  successText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
});