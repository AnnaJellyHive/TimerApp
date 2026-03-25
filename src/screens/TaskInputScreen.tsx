import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Modal, FlatList, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import SwipeableRow from '../components/SwipeableRow';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TaskTemplate } from '../types';
import * as TemplateStore from '../storage/templateStore';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskInput'>;

const MAX_LENGTH = 50;
const DEFAULT_DURATION = 120;

export default function TaskInputScreen({ route, navigation }: Props) {
  const prefill = route.params?.prefill;

  const [taskName, setTaskName] = useState(prefill?.taskName ?? '');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>(prefill?.subtasks ?? []);
  const [duration, setDuration] = useState(String(prefill?.durationSeconds ?? DEFAULT_DURATION));
  const [breakDuration, setBreakDuration] = useState(String(prefill?.breakDurationSeconds ?? DEFAULT_DURATION));
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const hasContent = taskName.length > 0 || subtasks.length > 0
    || duration !== String(DEFAULT_DURATION) || breakDuration !== String(DEFAULT_DURATION);

  function addSubtask() {
    const text = subtaskInput.trim();
    if (!text) return;
    setSubtasks(prev => [...prev, text]);
    setSubtaskInput('');
  }

  function removeSubtask(index: number) {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  }

  function clearAll() {
    setTaskName('');
    setSubtasks([]);
    setSubtaskInput('');
    setDuration(String(DEFAULT_DURATION));
    setBreakDuration(String(DEFAULT_DURATION));
  }

  function startTimer() {
    if (!taskName.trim()) { Alert.alert('Skriv in en uppgift'); return; }
    if (subtasks.length === 0) { Alert.alert('Lägg till minst en underuppgift'); return; }
    navigation.navigate('Timer', {
      taskName: taskName.trim().slice(0, MAX_LENGTH),
      subtasks: subtasks.map(s => s.slice(0, MAX_LENGTH)),
      durationSeconds: Math.max(1, parseInt(duration) || DEFAULT_DURATION),
      breakDurationSeconds: Math.max(1, parseInt(breakDuration) || DEFAULT_DURATION),
    });
  }

  async function saveTemplate() {
    if (!taskName.trim()) { Alert.alert('Skriv in en uppgift'); return; }
    if (subtasks.length === 0) { Alert.alert('Lägg till minst en underuppgift'); return; }
    const all = await TemplateStore.getAll();
    if (all.some(t => t.taskName === taskName.trim())) {
      Alert.alert('En sparad uppgift med det namnet finns redan');
      return;
    }
    await TemplateStore.save({
      taskName: taskName.trim().slice(0, MAX_LENGTH),
      subtasks: subtasks.map(s => s.slice(0, MAX_LENGTH)),
      durationSeconds: Math.max(1, parseInt(duration) || DEFAULT_DURATION),
      breakDurationSeconds: Math.max(1, parseInt(breakDuration) || DEFAULT_DURATION),
    });
    Alert.alert('Uppgift sparad!');
  }

  async function openTemplates() {
    const all = await TemplateStore.getAll();
    if (all.length === 0) { Alert.alert('Inga sparade uppgifter'); return; }
    setTemplates(all);
    setShowTemplates(true);
  }

  function applyTemplate(t: TaskTemplate) {
    setTaskName(t.taskName);
    setSubtasks(t.subtasks);
    setDuration(String(t.durationSeconds));
    setBreakDuration(String(t.breakDurationSeconds));
    setShowTemplates(false);
  }

  async function deleteTemplate(id: string) {
    Alert.alert('Ta bort?', 'Vill du ta bort denna uppgift?', [
      { text: 'Nej', style: 'cancel' },
      {
        text: 'Ja',
        onPress: async () => {
          await TemplateStore.remove(id);
          setTemplates(prev => prev.filter(t => t.id !== id));
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      <View style={styles.appTitleRow}>
        <Image source={require('../../assets/ic_launcher.png')} style={styles.appTitleIcon} />
        <Text style={styles.appTitle}>Zonat</Text>
      </View>

      {/* Uppgiftsnamn */}
      <Text style={styles.label}>Uppgift</Text>
      <TextInput
        accessibilityLabel="taskInput"
        style={styles.input}
        placeholder="T.ex. plugga matte, städa rummet"
        value={taskName}
        onChangeText={setTaskName}
        maxLength={60}
        autoCorrect={false}
      />
      {taskName.length >= MAX_LENGTH && (
        <Text testID="taskInputError" style={styles.error}>
          Max {MAX_LENGTH} tecken
        </Text>
      )}

      {/* Underuppgifter */}
      <Text style={styles.label}>Underuppgifter</Text>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel="subtaskInput"
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Lägg till underuppgift"
          value={subtaskInput}
          onChangeText={setSubtaskInput}
          onSubmitEditing={addSubtask}
          returnKeyType="done"
          maxLength={60}
          autoCorrect={false}
        />
        <TouchableOpacity accessibilityLabel="addSubtaskButton" style={styles.addBtn} onPress={addSubtask}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {subtaskInput.length >= MAX_LENGTH && (
        <Text testID="subtaskInputError" style={styles.error}>
          Max {MAX_LENGTH} tecken
        </Text>
      )}

      <View accessibilityLabel="subtaskChips">
        {subtasks.map((s, i) => (
          <View key={i} accessibilityLabel={`subtaskChip_${i}`} style={styles.chip}>
            <Text style={styles.chipText}>{i + 1}. {s}</Text>
            <TouchableOpacity onPress={() => removeSubtask(i)}>
              <Text style={styles.chipClose}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Tider */}
      <Text style={styles.label}>Arbetstid (sekunder)</Text>
      <TextInput
        accessibilityLabel="durationInput"
        style={styles.input}
        keyboardType="default"
        value={duration}
        onChangeText={setDuration}
      />

      <Text style={styles.label}>Paus-tid (sekunder)</Text>
      <TextInput
        accessibilityLabel="breakDurationInput"
        style={styles.input}
        keyboardType="default"
        value={breakDuration}
        onChangeText={setBreakDuration}
      />

      {/* Knappar */}
      <TouchableOpacity accessibilityLabel="startButton" style={styles.primaryBtn} onPress={startTimer}>
        <Text style={styles.primaryBtnText}>Starta</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity accessibilityLabel="saveTemplateButton" style={styles.secondaryBtn} onPress={saveTemplate}>
          <Text style={styles.secondaryBtnText}>Spara uppgift</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="chooseTemplateButton" style={styles.secondaryBtn} onPress={openTemplates}>
          <Text style={styles.secondaryBtnText}>Välj sparad uppgift</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity accessibilityLabel="historyButton" style={styles.secondaryBtn} onPress={() => navigation.navigate('History')}>
        <Text style={styles.secondaryBtnText}>Historik</Text>
      </TouchableOpacity>

      {hasContent && (
        <TouchableOpacity accessibilityLabel="clearButton" style={styles.clearBtn} onPress={clearAll}>
          <Text style={styles.clearBtnText}>Rensa</Text>
        </TouchableOpacity>
      )}

      {/* Malldialogruta */}
      <Modal visible={showTemplates} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Välj sparad uppgift</Text>
            <FlatList
              data={templates}
              keyExtractor={t => t.id}
              renderItem={({ item }) => (
                <SwipeableRow
                  deleteAccessibilityLabel="templateDeleteYes"
                  onDelete={() => deleteTemplate(item.id)}>
                <View style={styles.templateRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => applyTemplate(item)}>
                    <Text testID="templateItemName" style={styles.templateName}>{item.taskName}</Text>
                  </TouchableOpacity>
                </View>
              </SwipeableRow>
              )}
            />
            <TouchableOpacity
              accessibilityLabel="templateDialogClose"
              style={[styles.secondaryBtn, { flex: undefined }]}
              onPress={() => setShowTemplates(false)}>
              <Text style={styles.secondaryBtnText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const GREEN = '#4CAF50';

const styles = StyleSheet.create({
  appTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  appTitleIcon: { width: 32, height: 32, marginRight: 8 },
  appTitle: { fontSize: 26, fontWeight: 'bold', color: GREEN },
  container: { padding: 24, paddingBottom: 48 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, fontSize: 16, marginBottom: 8, backgroundColor: '#fff',
  },
  error: { color: 'red', fontSize: 12, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addBtn: {
    backgroundColor: GREEN, borderRadius: 8,
    paddingHorizontal: 16, justifyContent: 'center', marginLeft: 8,
  },
  addBtnText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e8f5e9', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 12,
    marginBottom: 6, alignSelf: 'flex-start',
  },
  chipText: { fontSize: 14, marginRight: 8 },
  chipClose: { fontSize: 14, color: '#888' },
  primaryBtn: {
    backgroundColor: GREEN, borderRadius: 8,
    padding: 14, alignItems: 'center', marginTop: 16,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: {
    borderWidth: 1, borderColor: GREEN, borderRadius: 8,
    padding: 10, alignItems: 'center', marginTop: 8, flex: 1,
  },
  secondaryBtnText: { color: GREEN, fontSize: 14 },
  clearBtn: { alignItems: 'center', marginTop: 16 },
  clearBtnText: { color: '#888', fontSize: 14 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 20, maxHeight: '70%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  templateRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  templateName: { fontSize: 16 },
  templateDeleteAction: {
    backgroundColor: '#e53935', justifyContent: 'center',
    alignItems: 'center', width: 80,
  },
  templateDeleteText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
