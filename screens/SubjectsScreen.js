import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar,
  ScrollView, TextInput, Modal, Alert, ActivityIndicator, FlatList
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

  const openModal = () => { setName(''); setSelIcon(0); setSelColor(0); setDupError(false); setModalVisible(true); };

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

  const cardStyle = { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 };
  const lblStyle = { fontSize: 10, fontWeight: '600', color: C.textSecond, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={C.accent} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30, gap: 8 }} showsVerticalScrollIndicator={false}>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: C.textPrimary }}>Subjects</Text>
            <Text style={{ fontSize: 11, color: C.textSecond, marginTop: 1 }}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={openModal} style={{ width: 32, height: 32, backgroundColor: C.accent, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26 }}>+</Text>
          </TouchableOpacity>
        </View>

        {subjects.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 50, gap: 8 }}>
            <Text style={{ fontSize: 32 }}>📚</Text>
            <Text style={{ fontSize: 13, color: C.textHint, fontWeight: '500' }}>No subjects yet. Tap + to add one.</Text>
          </View>
        ) : subjects.map(s => (
          <TouchableOpacity key={s.id} style={cardStyle} onPress={() => setDetailSubject(s)} activeOpacity={0.8}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: s.color + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 17 }}>{s.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.textPrimary }}>{s.name}</Text>
              <Text style={{ fontSize: 10, color: C.textSecond, marginTop: 1 }}>Tap to view tasks</Text>
            </View>
            <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: s.color, marginRight: 4 }} />
            <TouchableOpacity onPress={() => deleteSubject(s.id)} style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: isDark ? '#2E1E1A' : '#FDF0EE', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 11, color: '#C0594A' }}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Subject Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, width: '100%', gap: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary }}>Add new subject</Text>

            <View>
              <Text style={lblStyle}>Name</Text>
              <TextInput
                style={{ backgroundColor: C.inputBg, borderWidth: 1, borderColor: dupError ? '#C0594A' : C.inputBorder, borderRadius: 10, padding: 10, fontSize: 13, color: C.textPrimary }}
                placeholder="e.g. Mathematics"
                placeholderTextColor={C.textHint}
                value={name}
                onChangeText={t => { setName(t); setDupError(false); }}
              />
              {dupError && <Text style={{ fontSize: 10, color: '#C0594A', marginTop: 4 }}>A subject with this name already exists.</Text>}
            </View>

            <View>
              <Text style={lblStyle}>Icon</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {ICONS.map((ic, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelIcon(i)}
                    style={{ width: 36, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: i === selIcon ? C.accentLight : C.inputBg, borderWidth: 1.5, borderColor: i === selIcon ? C.accent : 'transparent' }}>
                    <Text style={{ fontSize: 15 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={lblStyle}>Color</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {COLORS.map((c, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelColor(i)}
                    style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: c, borderWidth: 2.5, borderColor: i === selColor ? C.textPrimary : 'transparent' }} />
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, backgroundColor: C.border, borderRadius: 10, padding: 11, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.label }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveSubject} style={{ flex: 1, backgroundColor: C.accent, borderRadius: 10, padding: 11, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Add subject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subject Detail */}
      <Modal visible={!!detailSubject} transparent={false} animationType="slide" onRequestClose={() => setDetailSubject(null)}>
        {detailSubject && (
          <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <TouchableOpacity onPress={() => setDetailSubject(null)} style={{ width: 30, height: 30, backgroundColor: C.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 15, color: C.label }}>←</Text>
              </TouchableOpacity>
              <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: detailSubject.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16 }}>{detailSubject.icon}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary }}>{detailSubject.name}</Text>
                <Text style={{ fontSize: 10, color: C.textSecond }}>{subjectTasks.filter(t => !t.done).length} pending · {subjectTasks.length} total</Text>
              </View>
            </View>

            {subjectTasks.length === 0 ? (
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
