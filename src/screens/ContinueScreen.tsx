import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import * as StreakStore from '../storage/streakStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Continue'>;

export default function ContinueScreen({ route, navigation }: Props) {
  const { taskName, subtasks, durationSeconds, breakDurationSeconds, category } = route.params;

  const totalSeconds =
    subtasks.length * durationSeconds + (subtasks.length - 1) * breakDurationSeconds;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeLabel =
    minutes > 0 && seconds === 0 ? `${minutes} minuter` :
    minutes > 0 ? `${minutes} min ${seconds} sek` :
    `${seconds} sekunder`;

  useEffect(() => {
    StreakStore.save({ taskName, subtasks, durationSeconds, breakDurationSeconds, category }).catch(() => {});
  }, []);

  async function saveAndGoTo(dest: 'timer' | 'history') {
    if (dest === 'timer') {
      navigation.replace('Timer', { taskName, subtasks, durationSeconds, breakDurationSeconds, category });
    } else {
      navigation.navigate('History');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../../assets/konfetti.png')} style={styles.konfetti} resizeMode="contain" />
      <Text testID="continueDoneLabel" accessibilityLabel={Platform.OS === 'android' ? 'continueDoneLabel' : undefined} style={styles.doneLabel}>
        {timeLabel} klara!
      </Text>
      <Text testID="continueTaskName" accessibilityLabel={Platform.OS === 'android' ? 'continueTaskName' : undefined} style={styles.taskName}>{taskName}</Text>
      <Text style={styles.question}>Vill du köra en gång till?</Text>

      <View style={styles.primaryBtnWrapper}>
        <TouchableOpacity
          testID="continueYesButton"
          accessibilityLabel="continueYesButton"
          onPress={() => saveAndGoTo('timer')}>
          <LinearGradient
            colors={['#1d6d2b', '#0a6120']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Ja, kör igen!</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        testID="continueNoButton"
        accessibilityLabel="continueNoButton"
        style={styles.secondaryBtn}
        onPress={() => saveAndGoTo('history')}>
        <Text style={styles.secondaryBtnText}>Nej, vi är klara</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f8faf8' },
  konfetti: { width: 180, height: 180, marginBottom: 8 },
  doneLabel: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center', color: '#2d3432' },
  taskName: { fontSize: 18, color: '#536350', marginBottom: 32, textAlign: 'center' },
  question: { fontSize: 16, marginBottom: 24, color: '#2d3432' },
  primaryBtnWrapper: { borderRadius: 9999, overflow: 'hidden', width: '100%', marginBottom: 12 },
  primaryBtn: { paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { borderRadius: 9999, padding: 14, alignItems: 'center', width: '100%' },
  secondaryBtnText: { color: '#1d6d2b', fontSize: 16 },
});
