import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import SwipeableRow from '../components/SwipeableRow';
import { RootStackParamList, Checklist, ChecklistItem } from '../types';
import * as ChecklistStore from '../storage/checklistStore';
import * as StreakStore from '../storage/streakStore';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'ChecklistDetail'>;

export default function ChecklistDetailScreen({ route, navigation }: Props) {
  const { checklistId } = route.params;
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      ChecklistStore.getAll().then(all => {
        const found = all.find(c => c.id === checklistId);
        if (!found) { navigation.goBack(); return; }
        setChecklist(found);
        setTitleInput(found.name);
      });
    }, [checklistId])
  );

  async function saveTitle() {
    if (!checklist || !titleInput.trim()) { setEditingTitle(false); return; }
    const updated = { ...checklist, name: titleInput.trim() };
    setChecklist(updated);
    await ChecklistStore.update(updated);
    setEditingTitle(false);
  }

  async function toggleItem(itemId: string) {
    if (!checklist) return;
    const updated: Checklist = {
      ...checklist,
      items: checklist.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i),
    };
    setChecklist(updated);
    await ChecklistStore.update(updated);

    if (updated.items.length > 0 && updated.items.every(i => i.checked)) {
      await StreakStore.save({
        taskName: updated.name,
        subtasks: [],
        durationSeconds: 0,
        breakDurationSeconds: 0,
        checklistItems: updated.items,
      });
      await ChecklistStore.remove(updated.id);
      navigation.navigate('History');
    }
  }

  async function addItem() {
    const text = newItemText.trim();
    if (!text || !checklist) return;
    const newItem: ChecklistItem = { id: uuidv4(), text, checked: false };
    const updated: Checklist = { ...checklist, items: [...checklist.items, newItem] };
    setChecklist(updated);
    setNewItemText('');
    await ChecklistStore.update(updated);
  }

  async function removeItem(itemId: string) {
    if (!checklist) return;
    const updated: Checklist = { ...checklist, items: checklist.items.filter(i => i.id !== itemId) };
    setChecklist(updated);
    await ChecklistStore.update(updated);
  }

  async function moveItem(index: number, direction: 'up' | 'down') {
    if (!checklist) return;
    const items = [...checklist.items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    const updated = { ...checklist, items };
    setChecklist(updated);
    await ChecklistStore.update(updated);
  }

  if (!checklist) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹ Tillbaka</Text>
        </TouchableOpacity>

        {editingTitle ? (
          <TextInput
            style={styles.titleInput}
            value={titleInput}
            onChangeText={setTitleInput}
            onBlur={saveTitle}
            onSubmitEditing={saveTitle}
            autoFocus
            maxLength={60}
            autoCorrect={false}
          />
        ) : (
          <TouchableOpacity onPress={() => setEditingTitle(true)}>
            <Text style={styles.title}>{checklist.name}</Text>
          </TouchableOpacity>
        )}

        <FlatList
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 16 }}
          data={checklist.items}
          keyExtractor={i => i.id}
          extraData={checklist}
          ListEmptyComponent={
            <Text style={styles.empty}>Inga punkter än — lägg till nedan</Text>
          }
          renderItem={({ item, index }) => (
            <SwipeableRow
              onDelete={() => removeItem(item.id)}
              deleteAccessibilityLabel="itemDeleteYes"
              containerStyle={{ marginBottom: 8 }}>
              <View style={styles.itemRow}>
                <TouchableOpacity
                  style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                  onPress={() => toggleItem(item.id)}>
                  {item.checked && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>
                  {item.text}
                </Text>
                <View style={styles.moveButtons}>
                  <TouchableOpacity
                    style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}
                    onPress={() => moveItem(index, 'up')}
                    disabled={index === 0}>
                    <Text style={styles.moveBtnText}>▲</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.moveBtn, index === checklist.items.length - 1 && styles.moveBtnDisabled]}
                    onPress={() => moveItem(index, 'down')}
                    disabled={index === checklist.items.length - 1}>
                    <Text style={styles.moveBtnText}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SwipeableRow>
          )}
        />

        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Lägg till punkt"
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={addItem}
            returnKeyType="done"
            maxLength={100}
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faf8' },
  backBtn: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backBtnText: { fontSize: 16, color: '#1d6d2b', fontWeight: '500' },
  title: {
    fontSize: 24, fontWeight: 'bold', color: '#2d3432',
    paddingHorizontal: 24, marginBottom: 8,
  },
  titleInput: {
    fontSize: 24, fontWeight: 'bold', color: '#2d3432',
    paddingHorizontal: 24, marginBottom: 8,
    borderBottomWidth: 2, borderBottomColor: '#1d6d2b',
  },
  list: { flex: 1, paddingHorizontal: 24 },
  empty: { fontSize: 15, color: '#536350', textAlign: 'center', marginTop: 32 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14,
    ...Platform.select({
      ios: { shadowColor: '#2d3432', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: '#1d6d2b',
    marginRight: 12, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#1d6d2b' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  itemText: { fontSize: 15, color: '#2d3432', flex: 1 },
  itemTextChecked: { textDecorationLine: 'line-through', color: '#536350', opacity: 0.7 },
  moveButtons: { flexDirection: 'column', marginLeft: 8 },
  moveBtn: { padding: 4 },
  moveBtnDisabled: { opacity: 0.2 },
  moveBtnText: { fontSize: 11, color: '#536350' },
  addRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#e0e8e0',
    backgroundColor: '#f8faf8',
  },
  addInput: {
    flex: 1, borderWidth: 1, borderColor: '#c8d5c8',
    borderRadius: 10, padding: 12, fontSize: 15,
    color: '#2d3432', backgroundColor: '#fff', marginRight: 8,
  },
  addBtn: {
    backgroundColor: '#1d6d2b', borderRadius: 10,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 22, fontWeight: 'bold', lineHeight: 26 },
});
