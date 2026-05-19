import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Modal, FlatList, Image, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableRow from '../components/SwipeableRow';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TaskTemplate } from '../types';
import * as TemplateStore from '../storage/templateStore';
import { getCategoryConfig } from '../utils/categoryConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskInput'>;

const MAX_LENGTH = 50;
const CATEGORIES = ['Övrigt', 'Plugg', 'Träning', 'Hem', 'Socialt', 'Mental hälsa'];
const CATEGORY_ICONS: Record<string, string> = {
  'Övrigt': '🔘',
  'Plugg': '📚',
  'Träning': '🏋️',
  'Hem': '🏠',
  'Socialt': '👥',
  'Mental hälsa': '🧘',
};

const FOCUS_PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
];
const FOCUS_PRESET_SECS = FOCUS_PRESETS.map(p => p.seconds);

const BREAK_PRESETS = [
  { label: 'Ingen', seconds: 0 },
  { label: '30 s', seconds: 30 },
  { label: '1 min', seconds: 60 },
];
const BREAK_PRESET_SECS = BREAK_PRESETS.map(p => p.seconds);

type TimeUnit = 'sek' | 'min';
type PresetOrCustom = number | 'custom';

function presetsFromSeconds(
  seconds: number,
  presetValues: number[],
): { preset: PresetOrCustom; customValue: string; customUnit: TimeUnit } {
  if (presetValues.includes(seconds)) {
    return { preset: seconds, customValue: '', customUnit: 'min' };
  }
  if (seconds < 60 || seconds % 60 !== 0) {
    return { preset: 'custom', customValue: String(seconds), customUnit: 'sek' };
  }
  return { preset: 'custom', customValue: String(seconds / 60), customUnit: 'min' };
}

export default function TaskInputScreen({ route, navigation }: Props) {
  const prefill = route.params?.prefill;

  const initFocus = presetsFromSeconds(prefill?.durationSeconds ?? 60, FOCUS_PRESET_SECS);
  const initBreak = presetsFromSeconds(prefill?.breakDurationSeconds ?? 30, BREAK_PRESET_SECS);

  const [taskName, setTaskName] = useState(prefill?.taskName ?? '');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>(prefill?.subtasks ?? []);
  const [focusPreset, setFocusPreset] = useState<PresetOrCustom>(initFocus.preset);
  const [focusCustomValue, setFocusCustomValue] = useState(initFocus.customValue);
  const [focusCustomUnit, setFocusCustomUnit] = useState<TimeUnit>(initFocus.customUnit);
  const [breakPreset, setBreakPreset] = useState<PresetOrCustom>(initBreak.preset);
  const [breakCustomValue, setBreakCustomValue] = useState(initBreak.customValue);
  const [breakCustomUnit, setBreakCustomUnit] = useState<TimeUnit>(initBreak.customUnit);
  const [category, setCategory] = useState(prefill?.category ?? 'Övrigt');
  const [showCategory, setShowCategory] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const hasContent = taskName.length > 0 || subtasks.length > 0;

  function getDurationSeconds(): number {
    if (focusPreset !== 'custom') return focusPreset;
    const val = parseInt(focusCustomValue) || 1;
    return focusCustomUnit === 'min' ? val * 60 : val;
  }

  function getBreakDurationSeconds(): number {
    if (breakPreset !== 'custom') return breakPreset;
    const val = parseInt(breakCustomValue) || 0;
    return breakCustomUnit === 'min' ? val * 60 : val;
  }

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
    setFocusPreset(60);
    setFocusCustomValue('');
    setFocusCustomUnit('min');
    setBreakPreset(30);
    setBreakCustomValue('');
    setBreakCustomUnit('min');
    setCategory('Övrigt');
  }

  function startTimer() {
    if (!taskName.trim()) { Alert.alert('Skriv in en uppgift'); return; }
    if (subtasks.length === 0) { Alert.alert('Lägg till minst en underuppgift'); return; }
    navigation.navigate('Timer', {
      taskName: taskName.trim().slice(0, MAX_LENGTH),
      subtasks: subtasks.map(s => s.slice(0, MAX_LENGTH)),
      durationSeconds: Math.max(1, getDurationSeconds()),
      breakDurationSeconds: Math.max(0, getBreakDurationSeconds()),
      category,
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
      durationSeconds: Math.max(1, getDurationSeconds()),
      breakDurationSeconds: Math.max(0, getBreakDurationSeconds()),
      category,
    });
    Alert.alert('Uppgift sparad!');
  }

  async function openTemplates() {
    const all = await TemplateStore.getAll();
    if (all.length === 0) { Alert.alert('Inga sparade uppgifter'); return; }
    setTemplates(all);
    setShowTemplates(true);
  }

  function applyTemplate(t: TaskTemplate, closeModal = false) {
    setTaskName(t.taskName);
    setSubtasks(t.subtasks);
    const fp = presetsFromSeconds(t.durationSeconds, FOCUS_PRESET_SECS);
    setFocusPreset(fp.preset);
    setFocusCustomValue(fp.customValue);
    setFocusCustomUnit(fp.customUnit);
    const bp = presetsFromSeconds(t.breakDurationSeconds, BREAK_PRESET_SECS);
    setBreakPreset(bp.preset);
    setBreakCustomValue(bp.customValue);
    setBreakCustomUnit(bp.customUnit);
    setCategory(t.category ?? 'Övrigt');
    if (closeModal) setShowTemplates(false);
    TemplateStore.updateLastUsed(t.id).catch(() => {});
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

  function renderTimePresets(
    label: string,
    presets: { label: string; seconds: number }[],
    selected: PresetOrCustom,
    onSelect: (s: PresetOrCustom) => void,
    customValue: string,
    setCustomValue: (v: string) => void,
    customUnit: TimeUnit,
    setCustomUnit: (u: TimeUnit) => void,
  ) {
    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.presetRow}>
          {presets.map(p => (
            <TouchableOpacity
              key={p.seconds}
              style={[styles.presetChip, selected === p.seconds && styles.presetChipActive]}
              onPress={() => onSelect(p.seconds)}>
              <Text style={[styles.presetChipText, selected === p.seconds && styles.presetChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.presetChip, selected === 'custom' && styles.presetChipActive]}
            onPress={() => onSelect('custom')}>
            <Text style={[styles.presetChipText, selected === 'custom' && styles.presetChipTextActive]}>
              Anpassa
            </Text>
          </TouchableOpacity>
        </View>
        {selected === 'custom' && (
          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              keyboardType="number-pad"
              value={customValue}
              onChangeText={setCustomValue}
              placeholder="0"
              maxLength={4}
            />
            <TouchableOpacity
              style={[styles.unitChip, customUnit === 'sek' && styles.unitChipActive]}
              onPress={() => setCustomUnit('sek')}>
              <Text style={[styles.unitChipText, customUnit === 'sek' && styles.unitChipTextActive]}>sek</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitChip, customUnit === 'min' && styles.unitChipActive]}
              onPress={() => setCustomUnit('min')}>
              <Text style={[styles.unitChipText, customUnit === 'min' && styles.unitChipTextActive]}>min</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8faf8' }}>
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
        placeholder="T.ex. städa rummet, läsa bok"
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

      {/* Kategori */}
      <Text style={styles.label}>Kategori</Text>
      <TouchableOpacity
        accessibilityLabel="categoryButton"
        style={styles.categoryBtn}
        onPress={() => setShowCategory(true)}>
        <Text
          testID="selectedCategoryLabel"
          accessibilityLabel={Platform.OS === 'android' ? 'selectedCategoryLabel' : undefined}
          style={styles.categoryBtnText}>{CATEGORY_ICONS[category]} {category}</Text>
        <Text style={styles.categoryChevron}>▾</Text>
      </TouchableOpacity>

      {/* Tider */}
      {renderTimePresets(
        'Fokustid',
        FOCUS_PRESETS, focusPreset, setFocusPreset,
        focusCustomValue, setFocusCustomValue,
        focusCustomUnit, setFocusCustomUnit,
      )}
      {renderTimePresets(
        'Paus-tid',
        BREAK_PRESETS, breakPreset, setBreakPreset,
        breakCustomValue, setBreakCustomValue,
        breakCustomUnit, setBreakCustomUnit,
      )}

      {/* Knappar */}
      <TouchableOpacity accessibilityLabel="startButton" onPress={startTimer} style={styles.primaryBtn}>
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

      {hasContent && (
        <TouchableOpacity accessibilityLabel="clearButton" style={styles.clearBtn} onPress={clearAll}>
          <Text style={styles.clearBtnText}>Rensa</Text>
        </TouchableOpacity>
      )}

      {/* Kategoridialog */}
      <Modal visible={showCategory} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Välj kategori</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => {
                const selected = cat === category;
                return (
                  <TouchableOpacity
                    key={cat}
                    accessibilityLabel={cat}
                    style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                    onPress={() => { setCategory(cat); setShowCategory(false); }}>
                    <View style={[styles.categoryIconCircle, selected && styles.categoryIconCircleSelected]}>
                      <Text style={styles.categoryIconEmoji}>{CATEGORY_ICONS[cat]}</Text>
                    </View>
                    <Text style={[styles.categoryCardLabel, selected && styles.categoryCardLabelSelected]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Malldialogruta */}
      <Modal visible={showTemplates} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Välj sparad uppgift</Text>
            <FlatList
              data={templates}
              keyExtractor={t => t.id}
              renderItem={({ item }) => {
                const catCfg = getCategoryConfig(item.category);
                return (
                  <SwipeableRow
                    deleteAccessibilityLabel="templateDeleteYes"
                    onDelete={() => deleteTemplate(item.id)}>
                    <View style={styles.templateRow}>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => applyTemplate(item, true)}>
                        <Text testID="templateItemName" style={styles.templateName}>{item.taskName}</Text>
                        <View style={[styles.templateCategoryChip, { backgroundColor: catCfg.accentLight }]}>
                          <Text style={[styles.templateCategoryChipText, { color: catCfg.accent }]}>
                            {catCfg.emoji} {item.category ?? 'Övrigt'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </SwipeableRow>
                );
              }}
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
    <BottomNavBar
      activeTab="Uppgifter"
      onTabPress={tab => {
        if (tab === 'Historik') navigation.navigate('History');
        if (tab === 'Listor') navigation.navigate('Checklists');
      }}
    />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  appTitleIcon: { width: 32, height: 32, marginRight: 8 },
  appTitle: { fontSize: 26, fontWeight: 'bold', color: '#1d6d2b' },
  container: { padding: 24, paddingBottom: 48 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 6, color: '#2d3432' },
  input: {
    borderWidth: 1, borderColor: 'rgba(83, 99, 80, 0.15)', borderRadius: 8,
    padding: 10, fontSize: 16, marginBottom: 8, backgroundColor: '#f0f4f0', color: '#2d3432',
  },
  error: { color: 'red', fontSize: 12, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addBtn: {
    backgroundColor: '#1d6d2b', borderRadius: 9999,
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
  primaryBtn: { backgroundColor: '#1d6d2b', borderRadius: 9999, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: {
    borderRadius: 9999,
    padding: 10, alignItems: 'center', marginTop: 8, flex: 1,
  },
  secondaryBtnText: { color: '#1d6d2b', fontSize: 14 },
  clearBtn: { alignItems: 'center', marginTop: 16 },
  clearBtnText: { color: '#536350', fontSize: 14 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 20, maxHeight: Dimensions.get('window').height * 0.7,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  templateRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  templateName: { fontSize: 16 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 12,
    padding: 14, alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: '#eee',
  },
  categoryCardSelected: { borderColor: '#1d6d2b', backgroundColor: '#f0faf0' },
  categoryIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#a4f6a3', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  categoryIconCircleSelected: { backgroundColor: '#1d6d2b' },
  categoryIconEmoji: { fontSize: 28 },
  categoryCardLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  categoryCardLabelSelected: { color: '#1d6d2b' },
  categoryBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(83, 99, 80, 0.15)', borderRadius: 8,
    padding: 10, backgroundColor: '#f0f4f0', marginBottom: 8,
  },
  categoryBtnText: { fontSize: 16, color: '#2d3432' },
  categoryChevron: { fontSize: 16, color: '#536350' },
  templateCategoryChip: {
    alignSelf: 'flex-start', borderRadius: 9999,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  templateCategoryChipText: { fontSize: 11, fontWeight: '600' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  presetChip: {
    borderWidth: 1, borderColor: 'rgba(83, 99, 80, 0.25)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#f0f4f0',
  },
  presetChipActive: { backgroundColor: '#1d6d2b', borderColor: '#1d6d2b' },
  presetChipText: { fontSize: 14, color: '#2d3432' },
  presetChipTextActive: { color: '#fff', fontWeight: '600' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  customInput: {
    borderWidth: 1, borderColor: 'rgba(83, 99, 80, 0.15)', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12, fontSize: 16,
    backgroundColor: '#f0f4f0', color: '#2d3432',
    width: 80, textAlign: 'center',
  },
  unitChip: {
    borderWidth: 1, borderColor: 'rgba(83, 99, 80, 0.25)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#f0f4f0',
  },
  unitChipActive: { backgroundColor: '#1d6d2b', borderColor: '#1d6d2b' },
  unitChipText: { fontSize: 14, color: '#2d3432' },
  unitChipTextActive: { color: '#fff', fontWeight: '600' },
  recentSection: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(83, 99, 80, 0.12)',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
    marginBottom: 8,
  },
  recentLabel: {
    fontSize: 11, fontWeight: '600', color: '#536350',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1,
  },
  recentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(83,99,80,0.08)',
  },
  recentEmoji: { fontSize: 18, marginRight: 10 },
  recentName: { flex: 1, fontSize: 15, color: '#2d3432' },
  recentChevron: { fontSize: 22, color: '#b0b8b0', marginLeft: 4 },
});
