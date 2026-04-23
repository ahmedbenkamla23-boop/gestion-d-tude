import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Image, Animated,
} from 'react-native';
import { useTheme } from '../ThemeContext';

const logo = require('../assets/logo.png');

export default function WelcomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <View style={styles.content}>
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoFrame}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Study Manager</Text>
          <Text style={[styles.subtitle, { color: colors.textSecond }]}>
            Organize your subjects,{'\n'}tasks and deadlines.
          </Text>
        </Animated.View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.75}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.accent }]}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.75}>
            <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Create account</Text>
          </TouchableOpacity>
          <Text style={[styles.hint, { color: colors.textHint }]}>Your academic life, organized.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 60 },
  hero: { alignItems: 'center', gap: 2, marginBottom: 12 },
  logoFrame: { width: 330, height: 330, borderRadius: 82, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 310, height: 310 },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },
  subtitle: { fontSize: 17, textAlign: 'center', lineHeight: 24, fontWeight: '500', letterSpacing: 0.1 },
  actions: { gap: 12, width: '100%', maxWidth: 300, paddingBottom: 20 },
  primaryButton: {
    borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  secondaryButton: {
    borderRadius: 12, borderWidth: 1.8, paddingVertical: 15,
    paddingHorizontal: 24, alignItems: 'center', backgroundColor: 'transparent',
  },
  secondaryButtonText: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  hint: { textAlign: 'center', fontSize: 12, marginTop: 8, fontWeight: '400', letterSpacing: 0.2 },
});
