import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Modal, TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import BottomNavBar from '../components/BottomNavBar';
import SwipeableRow from '../components/SwipeableRow';
import { RootStackParamList, Checklist } from '../types';
import * as ChecklistStore from '../storage/checklistStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Checklists'>;

export default function ChecklistsScreen({ navigation }: Props) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState('');

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      ChecklistStore.getAll().then(result => {
        setChecklists(result);
        setLoading(false);
      });
    }, [])
  );

  async function createList() {
    const name = newListName.trim();
    if (!name) return;
    const created = await ChecklistStore.save(name);
    setChecklists(prev => [...prev, created]);
    setNewListName('');
    setShowCreate(false);
    navigation.navigate('ChecklistDetail', { checklistId: created.id });
  }

  async function deleteList(list: Checklist) {
    Alert.alert('Ta bort?', `Vill du ta bort "${list.name}"?`, [
      { text: 'Nej', style: 'cancel' },
      {
        text: 'Ja',
        onPress: async () => {
          await ChecklistStore.remove(list.id);
          setChecklists(prev => prev.filter(c => c.id !== list.id));
        },
      },
    ]);
  }

  function progressText(list: Checklist): string {
    if (list.items.length === 0) return 'Inga punkter';
    const done = list.items.filter(i => i.checked).length;
    return `${done} av ${list.items.length} klara`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Listor</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1d6d2b" style={{ marginTop: 48 }} />
        ) : checklists.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.empty}>Du har inga aktiva listor.</Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 16 }}
            data={[...checklists].reverse()}
            keyExtractor={c => c.id}
            renderItem={({ item }) => (
              <SwipeableRow
                onDelete={() => deleteList(item)}
                deleteAccessibilityLabel="checklistDeleteYes"
                containerStyle={{ marginBottom: 10 }}>
                <TouchableOpacity onPress={() => navigation.navigate('ChecklistDetail', { checklistId: item.id })}>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSub}>{progressText(item)}</Text>
                  </View>
                </TouchableOpacity>
              </SwipeableRow>
            )}
          />
        )}

        <View style={styles.createBtnWrapper}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.primaryBtnText}>Ny lista</Text>
          </TouchableOpacity>
        </View>
      </View>

      <BottomNavBar
        activeTab="Listor"
        onTabPress={tab => {
          if (tab === 'Uppgifter') navigation.navigate('TaskInput');
          if (tab === 'Historik') navigation.navigate('History');
        }}
      />

      <Modal visible={showCreate} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ny lista</Text>
            <TextInput
              style={styles.input}
              placeholder="Namn på listan"
              value={newListName}
              onChangeText={setNewListName}
              onSubmitEditing={createList}
              autoFocus
              maxLength={60}
              autoCorrect={false}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 8 }]}
              onPress={createList}>
              <Text style={styles.primaryBtnText}>Skapa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setShowCreate(false); setNewListName(''); }}>
              <Text style={styles.cancelBtnText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faf8' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2d3432', paddingHorizontal: 24, paddingTop: 24, marginBottom: 8 },
  list: { flex: 1, paddingHorizontal: 24 },
  empty: { fontSize: 16, color: '#536350', textAlign: 'center', marginTop: 48 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderLeftColor: '#1d6d2b',
    borderLeftWidth: 4,
    ...Platform.select({
      ios: { shadowColor: '#2d3432', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#2d3432' },
  cardSub: { fontSize: 13, color: '#536350' },
  createBtnWrapper: { paddingHorizontal: 24, paddingBottom: 12 },
  primaryBtn: {
    backgroundColor: '#1d6d2b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 24, width: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2d3432', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#c8d5c8', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#2d3432', backgroundColor: '#f8faf8',
    marginBottom: 8,
  },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: '#536350', fontSize: 15 },
});
