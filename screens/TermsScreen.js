import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, StyleSheet,
} from 'react-native';
import { useTheme } from '../ThemeContext';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account and using Study Manager, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.',
  },
  {
    title: '2. Use of the Service',
    body: 'Study Manager is provided for personal, non-commercial educational use. You may use the app to manage your academic subjects, tasks, and deadlines. You agree not to misuse the service or attempt to access it in unauthorized ways.',
  },
  {
    title: '3. Account Responsibility',
    body: 'You are responsible for maintaining the security of your account credentials. You must notify us immediately of any unauthorized access to your account. We are not liable for any loss resulting from unauthorized use of your account.',
  },
  {
    title: '4. User Content',
    body: 'You retain ownership of all content you create in the app (subjects, tasks, notes). By using the service, you grant us a limited license to store and display your content solely for the purpose of providing the service.',
  },
  {
    title: '5. Prohibited Conduct',
    body: 'You agree not to: attempt to hack or compromise the app\'s security, use the service for any illegal purpose, upload malicious content, or attempt to reverse-engineer any part of the application.',
  },
  {
    title: '6. Service Availability',
    body: 'We strive to maintain high availability but do not guarantee uninterrupted service. We may perform maintenance, updates, or temporarily suspend the service. We are not liable for any disruption or data loss.',
  },
  {
    title: '7. Disclaimer of Warranties',
    body: 'The service is provided "as is" without warranties of any kind. We do not warrant that the service will be error-free or meet your specific requirements. Use of the app is at your own risk.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app, including loss of data or academic materials.',
  },
  {
    title: '9. Termination',
    body: 'You may delete your account at any time. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, your data will be deleted in accordance with our Privacy Policy.',
  },
  {
    title: '10. Changes to Terms',
    body: 'We may update these Terms of Service at any time. We will notify you of significant changes through the app. Continued use after changes constitutes acceptance of the updated terms.',
  },
  {
    title: '11. Contact',
    body: 'If you have any questions about these Terms, please contact us at support@studyapp.com.',
  },
];

export default function TermsScreen({ navigation }) {
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
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Terms of Service</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: C.textHint }]}>Last updated: April 2026</Text>
        <Text style={[styles.intro, { color: C.textSecond }]}>
          Please read these Terms of Service carefully before using Study Manager.
          These terms govern your use of our application and services.
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
