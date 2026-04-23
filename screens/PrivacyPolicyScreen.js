import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, StyleSheet,
} from 'react-native';
import { useTheme } from '../ThemeContext';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect the email address and display name you provide when creating your account. We also store the academic subjects and tasks you create within the app. We do not collect any sensitive personal information beyond what is necessary to provide the service.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'Your information is used solely to provide and improve the Study Manager service. We use your email for authentication and account recovery. Your subjects and tasks are stored to enable synchronization across your devices.',
  },
  {
    title: '3. Data Storage',
    body: 'Your data is stored securely using Google Firebase, which complies with industry-standard security practices. Data is encrypted in transit and at rest. We retain your data for as long as your account is active.',
  },
  {
    title: '4. Data Sharing',
    body: 'We do not sell, trade, or share your personal data with third parties. Your data is only accessible to you when authenticated with your account. We use Firebase services which are governed by Google\'s privacy policy.',
  },
  {
    title: '5. Your Rights',
    body: 'You have the right to access, modify, or delete your personal data at any time. You can delete your account and all associated data by contacting us. You may also request a copy of the data we hold about you.',
  },
  {
    title: '6. Cookies & Analytics',
    body: 'This app does not use tracking cookies. We may use anonymous usage analytics to improve the app experience. No personally identifiable information is included in these analytics.',
  },
  {
    title: '7. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes through the app. Continued use of the app after changes constitutes acceptance of the updated policy.',
  },
  {
    title: '8. Contact',
    body: 'If you have any questions about this Privacy Policy or your data, please contact us at support@studyapp.com.',
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const C = colors;
  const styles = createStyles(C);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: C.border }]}
          onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: C.label }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Privacy Policy</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: C.textHint }]}>Last updated: April 2026</Text>
        <Text style={[styles.intro, { color: C.textSecond }]}>
          Study Manager is committed to protecting your privacy. This policy explains how we collect,
          use, and safeguard your personal information.
        </Text>

        {SECTIONS.map((s, i) => (
          <View key={i} style={[styles.section, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>{s.title}</Text>
            <Text style={[styles.sectionBody, { color: C.textSecond }]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 10 },
  lastUpdated: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  intro: { fontSize: 14, lineHeight: 22, fontWeight: '500', marginBottom: 6 },
  section: {
    borderRadius: 14, padding: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 0.1 },
  sectionBody: { fontSize: 13, lineHeight: 20, fontWeight: '400' },
});
