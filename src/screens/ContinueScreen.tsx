import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import * as StreakStore from '../storage/streakStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Continue'>;

export default function ContinueScreen({ route, navigation }: Props) {
  const { taskName, subtasks, durationSeconds, breakDurationSeconds } = route.params;

  const totalSeconds =
    subtasks.length * durationSeconds + (subtasks.length - 1) * breakDurationSeconds;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeLabel =
    minutes > 0 && seconds === 0 ? `${minutes} minuter` :
    minutes > 0 ? `${minutes} min ${seconds} sek` :
    `${seconds} sekunder`;

  async function saveAndGoTo(dest: 'timer' | 'history') {
    try {
      await StreakStore.save({ taskName, subtasks, durationSeconds, breakDurationSeconds });
    } catch { /* ignorera om lagring misslyckas */ }
    if (dest === 'timer') {
      navigation.replace('Timer', { taskName, subtasks, durationSeconds, breakDurationSeconds });
    } else {
      navigation.navigate('History');
    }
  }

  return (
    <View style={styles.container}>
      <Text testID="continueDoneLabel" accessibilityLabel={Platform.OS === 'android' ? 'continueDoneLabel' : undefined} style={styles.doneLabel}>
        🎉 {timeLabel} klara!
      </Text>
      <Text testID="continueTaskName" accessibilityLabel={Platform.OS === 'android' ? 'continueTaskName' : undefined} style={styles.taskName}>{taskName}</Text>
      <Text style={styles.question}>Vill du köra en gång till?</Text>

      <TouchableOpacity
        testID="continueYesButton"
        accessibilityLabel="continueYesButton"
        style={styles.primaryBtn}
        onPress={() => saveAndGoTo('timer')}>
        <Text style={styles.primaryBtnText}>Ja, kör igen!</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="continueNoButton"
        accessibilityLabel="continueNoButton"
        style={styles.secondaryBtn}
        onPress={() => saveAndGoTo('history')}>
        <Text style={styles.secondaryBtnText}>Nej, vi är klara</Text>
      </TouchableOpacity>
    </View>
  );
}

const GREEN = '#4CAF50';

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneLabel: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  taskName: { fontSize: 18, color: '#555', marginBottom: 32, textAlign: 'center' },
  question: { fontSize: 16, marginBottom: 24 },
  primaryBtn: {
    backgroundColor: GREEN, borderRadius: 8,
    padding: 14, alignItems: 'center', width: '100%', marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: {
    borderWidth: 1, borderColor: GREEN, borderRadius: 8,
    padding: 14, alignItems: 'center', width: '100%',
  },
  secondaryBtnText: { color: GREEN, fontSize: 16 },
});
