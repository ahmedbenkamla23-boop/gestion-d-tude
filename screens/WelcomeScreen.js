import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from '../ThemeContext';

export default function WelcomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 60 }}>
        <View style={{ alignItems: 'center', marginTop: 40, gap: 14 }}>
          <View style={{ width: 80, height: 80, backgroundColor: colors.accent, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700' }}>S</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' }}>Study Manager</Text>
          <Text style={{ fontSize: 15, color: colors.textSecond, textAlign: 'center', lineHeight: 22 }}>Organize your subjects,{'\n'}tasks and deadlines.</Text>
        </View>
        <View style={{ gap: 11 }}>
          <TouchableOpacity style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' }} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ borderRadius: 14, borderWidth: 1.5, borderColor: colors.accent, paddingVertical: 14, alignItems: 'center' }} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
            <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600' }}>Create account</Text>
          </TouchableOpacity>
          <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textHint, marginTop: 4 }}>Your academic life, organized.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
