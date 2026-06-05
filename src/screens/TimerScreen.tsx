import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import Sound from 'react-native-sound';
import { getCategoryConfig } from '../utils/categoryConfig';
import ProgressRing from '../components/ProgressRing';

Sound.setCategory('Playback', true);

type Props = NativeStackScreenProps<RootStackParamList, 'Timer'>;

export default function TimerScreen({ route, navigation }: Props) {
  const { taskName, subtasks, durationSeconds, breakDurationSeconds, category } = route.params;

  const cfg = getCategoryConfig(category);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [started, setStarted] = useState(false);
  const phaseEnded = useRef(false);
  const soundStart = useRef<Sound | null>(null);
  const soundEnd = useRef<Sound | null>(null);

  const dotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    soundStart.current = new Sound('sound_start_new.mp3', Sound.MAIN_BUNDLE, () => {});
    soundEnd.current   = new Sound('sound_end_new.mp3',   Sound.MAIN_BUNDLE, () => {});
    return () => {
      soundStart.current?.release();
      soundEnd.current?.release();
    };
  }, []);

  useFocusEffect(useCallback(() => {
    setStarted(true);
    return () => setStarted(false);
  }, []));

  const activeDuration = isBreak ? breakDurationSeconds : durationSeconds;
  const progress = activeDuration > 0 ? Math.min(1, Math.max(0, 1 - timeLeft / activeDuration)) : 0;

  // Pulsande status-prick
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Ljud vid start av FOKUS-period
  useEffect(() => {
    if (!started || isBreak) return;
    const t = setTimeout(() => {
      soundStart.current?.stop(() => soundStart.current?.play());
    }, 200);
    return () => clearTimeout(t);
  }, [currentIndex, isBreak, started]);

  // Återställ timer när fas byter
  useEffect(() => {
    if (!started) return;
    phaseEnded.current = false;
    setTimeLeft(isBreak ? breakDurationSeconds : durationSeconds);
  }, [currentIndex, isBreak, started]);

  // Nedräkning
  useEffect(() => {
    if (!started) return;
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
  }, [currentIndex, isBreak, started]);

  // Hantera fasövergång
  useEffect(() => {
    if (timeLeft !== 0 || !phaseEnded.current) return;
    phaseEnded.current = false;

    if (!isBreak) {
      if (currentIndex + 1 < subtasks.length) {
        if (breakDurationSeconds === 0) {
          setCurrentIndex(prev => prev + 1);
        } else {
          soundEnd.current?.stop(() => soundEnd.current?.play());
          setIsBreak(true);
        }
      } else {
        soundEnd.current?.stop(() => soundEnd.current?.play());
        setTimeout(() => {
          navigation.replace('Continue', { taskName, subtasks, durationSeconds, breakDurationSeconds, category });
        }, 500);
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

  const modeLabel = isBreak ? 'Ta en paus' : 'FOKUS!';
  const nextSubtask = isBreak && currentIndex + 1 < subtasks.length
    ? subtasks[currentIndex + 1] : null;
  const ringEmoji = isBreak ? '☕' : cfg.emoji;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cfg.bgLight }]}>
      <View style={styles.bgOrb} pointerEvents="none" />
      <View style={styles.decorativeFrame} pointerEvents="none" />

      <View style={styles.content}>
        <Text
          testID="timerModeLabel"
          accessible={true}
          accessibilityLabel={Platform.OS === 'android' ? 'timerModeLabel' : undefined}
          style={styles.modeLabel}>
          {modeLabel}
        </Text>

        <Text
          testID="timerTaskName"
          accessible={true}
          accessibilityLabel={Platform.OS === 'android' ? 'timerTaskName' : undefined}
          style={styles.taskName}
          numberOfLines={2}>
          {isBreak && nextSubtask ? `Nästa: ${nextSubtask}` : subtasks[currentIndex]}
        </Text>

        <Text
          testID="timerProgress"
          accessible={true}
          accessibilityLabel={Platform.OS === 'android' ? 'timerProgress' : undefined}
          style={styles.progress}>
          {isBreak ? 'Paus' : `${currentIndex + 1} av ${subtasks.length}`}
        </Text>

        {/* Kategori-etikett */}
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryHeaderSmall}>KATEGORI</Text>
          <Text style={styles.categoryHeaderName}>{category ?? 'Övrigt'}</Text>
        </View>

        {/* Progress-ring */}
        <View accessible={true} accessibilityLabel="timerAnimation">
          <ProgressRing
            progress={progress}
            color={cfg.accent}
            tint={cfg.accentLight}
            emoji={ringEmoji}
pulseEmoji={!isBreak}
            centerNode={isBreak ? (
              <LottieView
                source={require('../../assets/Little coffee cup.lottie')}
                autoPlay
                loop
                resizeMode="contain"
                style={{ width: 130, height: 130 }}
              />
            ) : undefined}
          />
        </View>

        <Text testID="timerDisplay" style={styles.timerDisplay}>
          {formatTime(timeLeft)}
        </Text>

        <TouchableOpacity
          accessibilityLabel="cancelTimerButton"
          style={styles.cancelBtn}
          onPress={() => navigation.navigate('TaskInput')}>
          <Text style={[styles.cancelBtnText, { color: cfg.accent }]}>Avbryt</Text>
        </TouchableOpacity>

        {/* Status-indikator */}
        <View style={styles.statusFooter}>
          <Animated.View style={[styles.statusDot, { backgroundColor: cfg.accent, opacity: dotAnim }]} />
          <Text style={styles.statusText}>{isBreak ? 'Tar en paus' : 'Session pågår'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  bgOrb: {
    position: 'absolute',
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: '#ffffff', opacity: 0.55,
    top: '50%', left: '50%', marginTop: -200, marginLeft: -200, zIndex: 0,
  },
  decorativeFrame: {
    position: 'absolute', top: 24, left: 24, right: 24, bottom: 24,
    borderRadius: 40, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', zIndex: 0,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1 },
  categoryHeader: { alignItems: 'center', marginBottom: 12 },
  categoryHeaderSmall: {
    fontSize: 11, fontWeight: '600', letterSpacing: 3,
    color: '#536350', opacity: 0.6, textTransform: 'uppercase',
  },
  categoryHeaderName: { fontSize: 18, color: '#2d3432' },
  modeLabel: { fontSize: 20, fontWeight: 'bold', marginBottom: 6, color: '#2d3432' },
  taskName: { fontSize: 17, textAlign: 'center', marginBottom: 2, color: '#2d3432' },
  progress: { fontSize: 13, color: '#536350', marginBottom: 16 },
  timerDisplay: { fontSize: 64, fontWeight: 'bold', letterSpacing: -1, marginTop: 16, marginBottom: 8, color: '#2d3432' },
  cancelBtn: { borderRadius: 9999, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  statusFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, color: '#536350', opacity: 0.6, letterSpacing: 2, textTransform: 'uppercase' },
});
