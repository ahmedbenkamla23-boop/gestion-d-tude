import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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

  const inp = { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.textPrimary, marginBottom: 16 };
  const pwWrap = (err) => ({ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: err ? '#C0594A' : colors.inputBorder, borderRadius: 12, marginBottom: 8 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 28, backgroundColor: colors.card }} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 18, color: colors.label }}>←</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 26, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 }}>Create account</Text>
          <Text style={{ fontSize: 14, color: colors.textSecond, marginBottom: 32 }}>Start organizing your studies</Text>

          {[['Full name', name, setName, 'Ahmed Ben Kamla', 'words', 'default'],
            ['Email', email, setEmail, 'you@example.com', 'none', 'email-address']].map(([lbl, val, set, ph, cap, kb]) => (
            <View key={lbl}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.label, marginBottom: 8 }}>{lbl}</Text>
              <TextInput style={inp} placeholder={ph} placeholderTextColor={colors.textHint} value={val} onChangeText={set} autoCapitalize={cap} keyboardType={kb} />
            </View>
          ))}

          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.label, marginBottom: 8 }}>Password</Text>
          <View style={pwWrap(false)}>
            <TextInput style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.textPrimary }} placeholder="Min. 6 characters" placeholderTextColor={colors.textHint} value={pw} onChangeText={setPw} secureTextEntry={!showPw} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ paddingHorizontal: 14 }}>
              <Text style={{ fontSize: 13, color: colors.accent, fontWeight: '500' }}>{showPw ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {pw.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                <View style={{ height: 4, borderRadius: 2, width: str.w, backgroundColor: str.c }} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '500', color: str.c }}>{str.l}</Text>
            </View>
          )}

          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.label, marginBottom: 8 }}>Confirm password</Text>
          <View style={pwWrap(pw2.length > 0 && pw2 !== pw)}>
            <TextInput style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.textPrimary }} placeholder="Repeat your password" placeholderTextColor={colors.textHint} value={pw2} onChangeText={setPw2} secureTextEntry={!showPw2} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowPw2(!showPw2)} style={{ paddingHorizontal: 14 }}>
              <Text style={{ fontSize: 13, color: colors.accent, fontWeight: '500' }}>{showPw2 ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {pw2.length > 0 && pw2 !== pw && <Text style={{ fontSize: 12, color: '#C0594A', marginBottom: 12, marginTop: -4 }}>Passwords do not match</Text>}

          <Text style={{ fontSize: 12, color: colors.textHint, textAlign: 'center', lineHeight: 18, marginVertical: 14 }}>
            By signing up you agree to our <Text style={{ color: colors.accent }}>Terms</Text> and <Text style={{ color: colors.accent }}>Privacy Policy</Text>.
          </Text>

          <TouchableOpacity style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 20, opacity: loading ? 0.7 : 1 }} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create account</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.textSecond }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ fontSize: 14, color: colors.accent, fontWeight: '600' }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
