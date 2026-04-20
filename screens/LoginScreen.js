import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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

  const inp = { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.textPrimary, marginBottom: 16 };
  const pwWrap = { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12, marginBottom: 10 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 28, backgroundColor: colors.card }} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 18, color: colors.label }}>←</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 26, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 }}>Welcome back</Text>
          <Text style={{ fontSize: 14, color: colors.textSecond, marginBottom: 32 }}>Sign in to your account</Text>

          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.label, marginBottom: 8 }}>Email</Text>
          <TextInput style={inp} placeholder="you@example.com" placeholderTextColor={colors.textHint} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.label, marginBottom: 8 }}>Password</Text>
          <View style={pwWrap}>
            <TextInput style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.textPrimary }} placeholder="••••••••" placeholderTextColor={colors.textHint} value={password} onChangeText={setPassword} secureTextEntry={!show} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShow(!show)} style={{ paddingHorizontal: 14 }}>
              <Text style={{ fontSize: 13, color: colors.accent, fontWeight: '500' }}>{show ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 28 }}>
            <Text style={{ fontSize: 13, color: colors.accent, fontWeight: '500' }}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 24, opacity: loading ? 0.7 : 1 }} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign in</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ fontSize: 12, color: colors.textHint }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.textSecond }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={{ fontSize: 14, color: colors.accent, fontWeight: '600' }}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
