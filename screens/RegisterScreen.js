import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import app from '../firebaseConfig';
import { useTheme } from '../ThemeContext';

const auth = getAuth(app);

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
    if (!name.trim() || !email.trim() || !pw || !pw2) { Alert.alert('Missing fields', 'Please fill in all fields.'); return; }
    if (pw.length < 6) { Alert.alert('Weak password', 'At least 6 characters required.'); return; }
    if (pw !== pw2) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch (e) {
      let msg = 'Something went wrong.';
      if (e.code === 'auth/email-already-in-use') msg = 'Email already registered.';
      else if (e.code === 'auth/invalid-email') msg = 'Invalid email address.';
      Alert.alert('Registration failed', msg);
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

          <Text style={[styles.title, { color: colors.textPrimary }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecond }]}>Start organizing your studies</Text>

          <Text style={[styles.label, { color: colors.label }]}>Full name</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: nameFocus ? colors.accent : colors.inputBorder, color: colors.textPrimary }]} placeholder="Ahmed Ben Kamla" placeholderTextColor={colors.textHint} value={name} onChangeText={setName} onFocus={() => setNameFocus(true)} onBlur={() => setNameFocus(false)} autoCapitalize="words" />

          <Text style={[styles.label, { color: colors.label }]}>Email</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: emailFocus ? colors.accent : colors.inputBorder, color: colors.textPrimary }]} placeholder="you@example.com" placeholderTextColor={colors.textHint} value={email} onChangeText={setEmail} onFocus={() => setEmailFocus(true)} onBlur={() => setEmailFocus(false)} keyboardType="email-address" />

          <Text style={[styles.label, { color: colors.label }]}>Password</Text>
          <View style={[styles.passwordWrap, { backgroundColor: colors.inputBg, borderColor: pwFocus ? colors.accent : colors.inputBorder }]}>
            <TextInput style={[styles.passwordInput, { color: colors.textPrimary }]} placeholder="Min. 6 characters" placeholderTextColor={colors.textHint} value={pw} onChangeText={setPw} onFocus={() => setPwFocus(true)} onBlur={() => setPwFocus(false)} secureTextEntry={!showPw} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, { color: colors.accent }]}>{showPw ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {pw.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={[styles.strengthBar, { backgroundColor: colors.border }]}>
                <View style={[styles.strengthFill, { width: str.w, backgroundColor: str.c }]} />
              </View>
              <Text style={[styles.strengthText, { color: str.c }]}>{str.l}</Text>
            </View>
          )}

          <Text style={[styles.label, { color: colors.label }]}>Confirm password</Text>
          <View style={[styles.passwordWrap, { backgroundColor: colors.inputBg, borderColor: pw2Focus && pw2.length > 0 && pw2 !== pw ? '#C0594A' : pw2Focus ? colors.accent : colors.inputBorder }]}>
            <TextInput style={[styles.passwordInput, { color: colors.textPrimary }]} placeholder="Repeat your password" placeholderTextColor={colors.textHint} value={pw2} onChangeText={setPw2} onFocus={() => setPw2Focus(true)} onBlur={() => setPw2Focus(false)} secureTextEntry={!showPw2} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowPw2(!showPw2)} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, { color: colors.accent }]}>{showPw2 ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {pw2.length > 0 && pw2 !== pw && <Text style={styles.errorText}>Passwords do not match</Text>}

          <Text style={[styles.termsText, { color: colors.textHint }]}>
            By signing up you agree to our <Text style={{ color: colors.accent, fontWeight: '600' }}>Terms</Text> and <Text style={{ color: colors.accent, fontWeight: '600' }}>Privacy Policy</Text>.
          </Text>

          <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>Create account</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecond }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>Sign in</Text>
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
  strengthContainer: {
    marginBottom: 14,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  strengthFill: {
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#C0594A',
    marginBottom: 14,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 16,
    fontWeight: '500',
  },
  createBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  createText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
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
