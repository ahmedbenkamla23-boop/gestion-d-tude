import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar,
  ScrollView, TextInput, Modal, Alert, ActivityIndicator, FlatList, StyleSheet
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import app from '../firebaseConfig';
import { useTheme } from '../ThemeContext';

const auth = getAuth(app);
const db = getFirestore(app);

const ICONS = ['📐','🔬','📖','🎨','💻','📊','🗺️','🎵','🧬','⚗️','🏛️','📝','🌍','🧮','🎭'];
const COLORS = ['#5C6BC0','#C49A3C','#5A8A6A','#C0594A','#8E6BC0','#4A9AB5','#C07A5C','#7A9A4A','#B05C8A'];

export default function SubjectsScreen() {
  const { colors, isDark } = useTheme();
  const user = auth.currentUser;
  const C = colors;

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailSubject, setDetailSubject] = useState(null);
  const [subjectTasks, setSubjectTasks] = useState([]);
  const [name, setName] = useState('');
  const [selIcon, setSelIcon] = useState(0);
  const [selColor, setSelColor] = useState(0);
  const [dupError, setDupError] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);

  const styles = createStyles(C);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'subjects'), where('userId', '==', user.uid));
    return onSnapshot(q, snap => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!detailSubject) return;
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid), where('subjectId', '==', detailSubject.id));
    return onSnapshot(q, snap => {
      const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      tasks.sort((a, b) => a.done - b.done || new Date(a.date) - new Date(b.date));
      setSubjectTasks(tasks);
    });
  }, [detailSubject]);

  const openModal = () => { setName(''); setSelIcon(0); setSelColor(0); setDupError(false); setNameFocus(false); setModalVisible(true); };

  const saveSubject = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (subjects.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) { setDupError(true); return; }
    try {
      await addDoc(collection(db, 'subjects'), { userId: user.uid, name: trimmed, icon: ICONS[selIcon], color: COLORS[selColor], createdAt: new Date().toISOString() });
      setModalVisible(false);
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const deleteSubject = id => Alert.alert('Delete subject', 'Delete this subject?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(doc(db, 'subjects', id)) },
  ]);

  if (loading) return <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}><ActivityIndicator color={C.accent} size="large" /></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: C.textPrimary }]}>Subjects</Text>
            <Text style={[styles.count, { color: C.textSecond }]}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={openModal} style={[styles.addBtn, { backgroundColor: C.accent }]}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {subjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={[styles.emptyText, { color: C.textHint }]}>No subjects yet. Tap + to add one.</Text>
          </View>
        ) : subjects.map(s => (
          <TouchableOpacity key={s.id} style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => setDetailSubject(s)} activeOpacity={0.75}>
            <View style={[styles.cardIcon, { backgroundColor: s.color + '22' }]}>
              <Text style={styles.cardIconText}>{s.icon}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardName, { color: C.textPrimary }]}>{s.name}</Text>
              <Text style={[styles.cardMeta, { color: C.textSecond }]}>Tap to view tasks</Text>
            </View>
            <View style={[styles.cardBar, { backgroundColor: s.color }]} />
            <TouchableOpacity onPress={() => deleteSubject(s.id)} style={[styles.deleteBtn, { backgroundColor: isDark ? '#2E1E1A' : '#FDF0EE' }]}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Subject Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: C.card }]}>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Add new subject</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: C.textSecond }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: C.inputBg, borderColor: dupError ? '#C0594A' : nameFocus ? C.accent : C.inputBorder, color: C.textPrimary }]}
                placeholder="e.g. Mathematics"
                placeholderTextColor={C.textHint}
                value={name}
                onChangeText={t => { setName(t); setDupError(false); }}
                onFocus={() => setNameFocus(true)}
                onBlur={() => setNameFocus(false)}
              />
              {dupError && <Text style={styles.errorText}>A subject with this name already exists.</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: C.textSecond }]}>Icon</Text>
              <View style={styles.iconGrid}>
                {ICONS.map((ic, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelIcon(i)}
                    style={[styles.iconBtn, { backgroundColor: i === selIcon ? C.accentLight : C.inputBg, borderColor: i === selIcon ? C.accent : 'transparent' }]}>
                    <Text style={styles.iconBtnText}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: C.textSecond }]}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((c, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelColor(i)}
                    style={[styles.colorBtn, { backgroundColor: c, borderColor: i === selColor ? C.textPrimary : 'transparent' }]} />
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, { backgroundColor: C.border }]}>
                <Text style={[styles.modalBtnText, { color: C.label }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveSubject} style={[styles.modalBtn, { backgroundColor: C.accent }]}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Add subject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 19,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  cardMeta: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  cardBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 4,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#C0594A',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 18,
    padding: 20,
    width: '100%',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 10,
    color: '#C0594A',
    marginTop: 4,
    fontWeight: '500',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  iconBtn: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconBtnText: {
    fontSize: 17,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Text style={{ fontSize: 28 }}>✅</Text>
                <Text style={{ fontSize: 12, color: C.textHint, fontWeight: '500' }}>No tasks for this subject yet.</Text>
              </View>
            ) : (
              <FlatList
                data={subjectTasks}
                keyExtractor={t => t.id}
                contentContainerStyle={{ padding: 14, gap: 8 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: t }) => (
                  <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: t.done ? C.sage : C.inputBorder, backgroundColor: t.done ? C.sage : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {t.done && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: t.done ? C.textHint : C.textPrimary, textDecorationLine: t.done ? 'line-through' : 'none' }}>{t.name}</Text>
                      <Text style={{ fontSize: 10, color: C.textSecond, marginTop: 2 }}>Due {t.date}</Text>
                    </View>
                    {!t.done && t.daysLeft ? (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, backgroundColor: detailSubject.color + '18' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: detailSubject.color }}>{t.daysLeft}</Text>
                      </View>
                    ) : t.done ? (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, backgroundColor: C.sageLight }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: C.sage }}>Done</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              />
            )}
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
