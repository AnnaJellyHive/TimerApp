import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import * as StreakStore from '../storage/streakStore';
import Plant from '../components/Plant';

type Props = NativeStackScreenProps<RootStackParamList, 'Continue'>;

export default function ContinueScreen({ route, navigation }: Props) {
  const { taskName, subtasks, durationSeconds, breakDurationSeconds, category } = route.params;

  const totalSeconds =
    subtasks.length * durationSeconds + (subtasks.length - 1) * breakDurationSeconds;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeLabel =
    minutes > 0 && seconds === 0 ? `${minutes} min` :
    minutes > 0 ? `${minutes} min ${seconds} sek` :
    `${seconds} sek`;

  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    StreakStore.save({ taskName, subtasks, durationSeconds, breakDurationSeconds, category })
      .then(() => StreakStore.getLastDays(1))
      .then(tasks => {
        const today = new Date().setHours(0, 0, 0, 0);
        const count = tasks.filter(t => t.completedAt >= today && !t.checklistItems).length;
        setTodayCount(count);
      })
      .catch(() => {});
  }, []);

  const plantStage = Math.min(todayCount, 5);
  const tillBloom = 5 - plantStage;

  async function goTo(dest: 'timer' | 'history') {
    if (dest === 'timer') {
      navigation.replace('Timer', { taskName, subtasks, durationSeconds, breakDurationSeconds, category });
    } else {
      navigation.navigate('History');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Plantan */}
      <Plant stage={plantStage} size={196} />

      {/* Rubrik */}
      <Text
        testID="continueDoneLabel"
        accessibilityLabel={Platform.OS === 'android' ? 'continueDoneLabel' : undefined}
        style={styles.headline}>
        Plantan fick ett nytt blad.
      </Text>

      {/* Uppgiftsnamn */}
      <Text
        testID="continueTaskName"
        accessibilityLabel={Platform.OS === 'android' ? 'continueTaskName' : undefined}
        style={styles.taskName}>
        {taskName}
      </Text>

      {/* Fokus-badge */}
      <View style={styles.focusBadge}>
        <Text style={styles.focusBadgeLabel}>⏱ FOKUS</Text>
        <Text style={styles.focusBadgeTime}>{timeLabel}</Text>
      </View>

      {/* Progress-dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < plantStage && styles.dotFilled,
              i === plantStage - 1 && styles.dotLatest,
            ]}
          />
        ))}
      </View>
      <Text style={styles.bloomText}>
        {tillBloom > 0
          ? `${tillBloom} till så blommar plantan`
          : 'Plantan blommar! 🌸'}
      </Text>

      {/* Knappar */}
      <TouchableOpacity
        testID="continueYesButton"
        accessibilityLabel="continueYesButton"
        style={styles.primaryBtn}
        onPress={() => goTo('timer')}>
        <Text style={styles.primaryBtnText}>Kör igen!</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="continueNoButton"
        accessibilityLabel="continueNoButton"
        style={styles.ghostBtn}
        onPress={() => goTo('history')}>
        <Text style={styles.ghostBtnText}>Vi är klara</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 28, backgroundColor: '#f5f7f4',
  },
  konfetti: { width: 140, height: 140, marginBottom: 0 },
  eyebrow: {
    fontSize: 11, fontWeight: '600', letterSpacing: 2,
    color: '#5a6260', textTransform: 'uppercase', marginBottom: 8,
  },
  headline: {
    fontSize: 26, fontWeight: '700', color: '#0e1311',
    textAlign: 'center', marginTop: 12, marginBottom: 4,
  },
  taskName: {
    fontSize: 14, color: '#5a6260', textAlign: 'center', marginBottom: 16,
  },
  focusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#e3efe5',
    borderWidth: 1, borderColor: 'rgba(31,107,58,0.13)',
    borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10,
    marginBottom: 20,
  },
  focusBadgeLabel: { fontSize: 13, fontWeight: '600', color: '#1f6b3a', letterSpacing: 0.3 },
  focusBadgeTime: { fontSize: 20, fontWeight: '700', color: '#1f6b3a' },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#e6ebe7',
  },
  dotFilled: { backgroundColor: '#1f6b3a' },
  dotLatest: { width: 12, height: 12, borderRadius: 6 },
  bloomText: {
    fontSize: 13, color: '#5a6260', marginBottom: 28,
  },
  primaryBtn: {
    backgroundColor: '#1f6b3a', borderRadius: 9999,
    paddingVertical: 16, alignItems: 'center', width: '100%', marginBottom: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  ghostBtn: { paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  ghostBtnText: { color: '#1f6b3a', fontSize: 15, fontWeight: '500' },
});
