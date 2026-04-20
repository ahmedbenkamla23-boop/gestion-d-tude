import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from '../firebaseConfig';
import { useTheme } from '../ThemeContext';

const auth = getAuth(app);

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Missing fields', 'Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      let msg = 'Something went wrong.';
      if (e.code === 'auth/user-not-found') msg = 'No account with this email.';
      else if (e.code === 'auth/wrong-password') msg = 'Incorrect password.';
      else if (e.code === 'auth/invalid-email') msg = 'Invalid email address.';
      Alert.alert('Sign in failed', msg);
    } finally { setLoading(false); }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={[styles.backBtn, { borderColor: colors.inputBorder, backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 18, color: colors.label }}>←</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecond }]}>Sign in to your account</Text>

          <Text style={[styles.label, { color: colors.label }]}>Email</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: emailFocus ? colors.accent : colors.inputBorder, color: colors.textPrimary }]} placeholder="you@example.com" placeholderTextColor={colors.textHint} value={email} onChangeText={setEmail} onFocus={() => setEmailFocus(true)} onBlur={() => setEmailFocus(false)} keyboardType="email-address" autoCapitalize="none" />

          <Text style={[styles.label, { color: colors.label }]}>Password</Text>
          <View style={[styles.passwordWrap, { backgroundColor: colors.inputBg, borderColor: pwFocus ? colors.accent : colors.inputBorder }]}>
            <TextInput style={[styles.passwordInput, { color: colors.textPrimary }]} placeholder="••••••••" placeholderTextColor={colors.textHint} value={password} onChangeText={setPassword} onFocus={() => setPwFocus(true)} onBlur={() => setPwFocus(false)} secureTextEntry={!show} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShow(!show)} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, { color: colors.accent }]}>{show ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.signInBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Sign in</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textHint }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecond }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 40,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 32,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 18,
    fontWeight: '500',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  toggleBtn: {
    paddingHorizontal: 14,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 28,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  signInBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  signInText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
