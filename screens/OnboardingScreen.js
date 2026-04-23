import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar,
  FlatList, Dimensions, StyleSheet, Animated,
} from 'react-native';
import { useTheme } from '../ThemeContext';
import { completeOnboarding } from '../utils/streak';
import { auth } from '../firebaseConfig';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '📚',
    title: 'Organize your subjects',
    body: 'Add all your courses in one place. Assign icons and colors so everything is easy to find.',
    accent: '#4F7D5B',
  },
  {
    emoji: '✅',
    title: 'Track every task',
    body: 'Create tasks with due dates and link them to subjects. Never miss a deadline again.',
    accent: '#D79C34',
  },
  {
    emoji: '🔥',
    title: 'Build your streak',
    body: 'Complete tasks every day to build your streak. Climb from 🌱 to 🏆 and stay motivated.',
    accent: '#C0594A',
  },
];

export default function OnboardingScreen({ onDone }) {
  const { colors, isDark } = useTheme();
  const C = colors;
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const next = () => {
    if (idx < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: idx + 1, animated: true });
    } else {
      finish();
    }
  };

  const finish = async () => {
    const user = auth.currentUser;
    if (user) await completeOnboarding(user.uid).catch(() => {});
    onDone();
  };

  const slide = SLIDES[idx];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* Skip */}
      <TouchableOpacity onPress={finish} style={styles.skipBtn}>
        <Text style={[styles.skipText, { color: C.textHint }]}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal pagingEnabled scrollEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item: s }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.emojiCircle, { backgroundColor: s.accent + '22' }]}>
              <Text style={styles.emoji}>{s.emoji}</Text>
            </View>
            <Text style={[styles.title, { color: C.textPrimary }]}>{s.title}</Text>
            <Text style={[styles.body, { color: C.textSecond }]}>{s.body}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.dot, {
            backgroundColor: i === idx ? slide.accent : C.border,
            width: i === idx ? 20 : 7,
          }]} />
        ))}
      </View>

      {/* Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={next}
          style={[styles.btn, { backgroundColor: slide.accent }]}>
          <Text style={styles.btnText}>{idx === SLIDES.length - 1 ? "Let's go! 🚀" : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { alignSelf: 'flex-end', padding: 16 },
  skipText: { fontSize: 14, fontWeight: '600' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 16 },
  emojiCircle: { width: 130, height: 130, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emoji: { fontSize: 64 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  body: { fontSize: 16, textAlign: 'center', lineHeight: 24, fontWeight: '400' },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 20 },
  dot: { height: 7, borderRadius: 4 },
  footer: { paddingHorizontal: 28, paddingBottom: 36 },
  btn: { borderRadius: 14, paddingVertical: 17, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
});
