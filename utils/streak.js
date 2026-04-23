import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const toDateStr = d => d.toISOString().split('T')[0];

/**
 * Call when user marks a task as DONE.
 * Returns updated { currentStreak, longestStreak, lastStreakDate }
 */
export async function recordTaskCompletion(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const today = toDateStr(new Date());

  if (!snap.exists()) {
    const data = { currentStreak: 1, longestStreak: 1, lastStreakDate: today };
    await setDoc(ref, data, { merge: true });
    return data;
  }

  const { currentStreak = 0, longestStreak = 0, lastStreakDate } = snap.data();

  // Already completed a task today — no change
  if (lastStreakDate === today) return { currentStreak, longestStreak, lastStreakDate };

  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  const newStreak = lastStreakDate === yesterday ? currentStreak + 1 : 1;
  const newLongest = Math.max(newStreak, longestStreak);
  const data = { currentStreak: newStreak, longestStreak: newLongest, lastStreakDate: today };
  await setDoc(ref, data, { merge: true });
  return data;
}

/** Fetch streak data without modifying it */
export async function getStreak(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return { currentStreak: 0, longestStreak: 0, lastStreakDate: null };
  const { currentStreak = 0, longestStreak = 0, lastStreakDate = null } = snap.data();
  return { currentStreak, longestStreak, lastStreakDate };
}

/** Save notification + other settings */
export async function saveUserSettings(uid, settings) {
  await setDoc(doc(db, 'users', uid), { settings }, { merge: true });
}

/** Get user settings */
export async function getUserSettings(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return defaultSettings();
  return snap.data().settings || defaultSettings();
}

/** Check if user has completed onboarding */
export async function getOnboardingStatus(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return false;
  return snap.data().onboardingComplete === true;
}

/** Mark onboarding as done */
export async function completeOnboarding(uid) {
  await setDoc(doc(db, 'users', uid), { onboardingComplete: true }, { merge: true });
}

export const defaultSettings = () => ({
  taskReminders: true,
  dailyReminder: false,
  dailyReminderHour: 18,
  dailyReminderMinute: 0,
});
