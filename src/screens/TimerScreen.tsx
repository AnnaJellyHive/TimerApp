import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

function BreakAnimation() {
  return (
    <View
      accessible
      accessibilityLabel="breakAnimation"
      style={styles.breakAnimationContainer}>
      <LottieView
        source={require('../../assets/pause_play.lottie')}
        autoPlay
        loop
        style={styles.breakLottie}
      />
    </View>
  );
}

type Props = NativeStackScreenProps<RootStackParamList, 'Timer'>;

export default function TimerScreen({ route, navigation }: Props) {
  const { taskName, subtasks, durationSeconds, breakDurationSeconds } = route.params;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const phaseEnded = useRef(false);

  const activeDuration = isBreak ? breakDurationSeconds : durationSeconds;
  const progress = timeLeft / activeDuration;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  // Pulsanimation för JOBBA!
  useEffect(() => {
    if (!isBreak) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 500, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => { pulseRef.current?.stop(); };
  }, [isBreak]);

  // Återställ timer när fas byter
  useEffect(() => {
    phaseEnded.current = false;
    setTimeLeft(isBreak ? breakDurationSeconds : durationSeconds);
  }, [currentIndex, isBreak]);

  // Nedräkning
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          phaseEnded.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, isBreak]);

  // Hantera fasövergång utanför setState
  useEffect(() => {
    if (timeLeft !== 0 || !phaseEnded.current) return;
    phaseEnded.current = false;

    if (!isBreak) {
      if (currentIndex + 1 < subtasks.length) {
        setIsBreak(true);
      } else {
        navigation.replace('Continue', { taskName, subtasks, durationSeconds, breakDurationSeconds });
      }
    } else {
      setCurrentIndex(prev => prev + 1);
      setIsBreak(false);
    }
  }, [timeLeft]);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const modeLabel = isBreak ? 'VILA!' : 'JOBBA!';
  const nextSubtask = isBreak && currentIndex + 1 < subtasks.length
    ? subtasks[currentIndex + 1] : null;

  return (
    <View style={styles.container}>
      <Text accessibilityLabel="timerModeLabel" style={styles.modeLabel}>{modeLabel}</Text>

      <Text accessibilityLabel="timerTaskName" style={styles.taskName} numberOfLines={2}>
        {isBreak && nextSubtask ? `Nästa: ${nextSubtask}` : subtasks[currentIndex]}
      </Text>

      <Text accessibilityLabel="timerProgress" style={styles.progress}>
        {isBreak ? 'Paus' : `${currentIndex + 1} av ${subtasks.length}`}
      </Text>

      {!isBreak && (
        <Animated.Image
          accessibilityLabel="timerAnimation"
          source={require('../../assets/ic_launcher.png')}
          style={[styles.animation, { transform: [{ scale: pulseAnim }] }]}
        />
      )}
      {isBreak && <BreakAnimation />}

      <Text accessibilityLabel="timerDisplay" style={styles.timerDisplay}>
        {formatTime(timeLeft)}
      </Text>

      <View accessibilityLabel="timerProgressBar" style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>

      <TouchableOpacity
        accessibilityLabel="cancelTimerButton"
        style={styles.cancelBtn}
        onPress={() => navigation.navigate('TaskInput')}>
        <Text style={styles.cancelBtnText}>Avbryt</Text>
      </TouchableOpacity>
    </View>
  );
}

const GREEN = '#4CAF50';

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  modeLabel: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  taskName: { fontSize: 18, textAlign: 'center', marginBottom: 4 },
  progress: { fontSize: 14, color: '#888', marginBottom: 40 },
  animation: { width: 120, height: 120, marginBottom: 16 },
  timerDisplay: { fontSize: 80, fontWeight: 'bold', marginBottom: 24 },
  progressBarBg: {
    flexDirection: 'row', width: '100%', height: 16,
    backgroundColor: '#e0e0e0', borderRadius: 8, marginBottom: 48, overflow: 'hidden',
  },
  progressBarFill: { backgroundColor: GREEN },
  breakAnimationContainer: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: GREEN, marginBottom: 16,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  breakLottie: {
    width: 140, height: 140,
  },
  cancelBtn: {
    borderWidth: 1, borderColor: GREEN,
    borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10,
  },
  cancelBtnText: { color: GREEN, fontSize: 16 },
});
