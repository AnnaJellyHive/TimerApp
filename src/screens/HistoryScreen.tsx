import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeableRow from '../components/SwipeableRow';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, CompletedTask } from '../types';
import * as StreakStore from '../storage/streakStore';
import { getCategoryConfig } from '../utils/categoryConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      StreakStore.getLastDays(3).then(result => {
        setTasks(result);
        setLoading(false);
      });
    }, [])
  );

  async function deleteTask(task: CompletedTask) {
    Alert.alert('Ta bort?', 'Vill du verkligen ta bort denna post?', [
      { text: 'Nej', style: 'cancel' },
      {
        text: 'Ja',
        onPress: async () => {
          await StreakStore.remove(task.id);
          setTasks(prev => prev.filter(t => t.id !== task.id));
        },
      },
    ]);
  }

  function reuseTask(task: CompletedTask) {
    navigation.navigate('TaskInput', { prefill: task });
  }

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('sv-SE', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Historik</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#1d6d2b" style={{ marginTop: 48 }} />
        ) : tasks.length === 0 ? (
          <Text testID="emptyHistoryText" style={styles.empty}>
            Inga avklarade uppgifter de senaste 3 dagarna
          </Text>
        ) : (
          <FlatList
            accessibilityLabel="taskHistoryList"
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 16 }}
            data={[...tasks].reverse()}
            keyExtractor={t => t.id}
            renderItem={({ item }) => (
              <SwipeableRow
                deleteAccessibilityLabel="historyDeleteYes"
                onDelete={() => deleteTask(item)}
                containerStyle={{ marginBottom: 10 }}>
                <TouchableOpacity onPress={() => reuseTask(item)}>
                  {(() => {
                    const catCfg = getCategoryConfig(item.category);
                    return (
                      <View testID={`historyItem_${item.id}`} style={[styles.card, { borderLeftColor: catCfg.accent, borderLeftWidth: 4 }]}>
                        <Text testID="taskItemTitle" accessible={true} accessibilityLabel={Platform.OS === 'android' ? 'taskItemTitle' : undefined} style={styles.cardTitle}>
                          {item.taskName}
                        </Text>
                        <Text testID="taskItemTime" style={styles.cardSub}>{formatDate(item.completedAt)}</Text>
                        <Text style={styles.cardSub}>{item.subtasks.length} underuppgifter</Text>
                        {item.category && (
                          <View style={[styles.categoryChip, { backgroundColor: catCfg.accentLight }]}>
                            <Text style={[styles.categoryChipText, { color: catCfg.accent }]}>
                              {catCfg.emoji} {item.category}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </TouchableOpacity>
              </SwipeableRow>
            )}
          />
        )}
      </View>

      <BottomNavBar activeTab="Historik" onTabPress={tab => { if (tab === 'Uppgifter') navigation.navigate('TaskInput'); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faf8' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2d3432', paddingHorizontal: 24, paddingTop: 24, marginBottom: 8 },
  list: { flex: 1, paddingHorizontal: 24 },
  empty: { fontSize: 16, color: '#536350', textAlign: 'center', marginTop: 48 },
  card: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 16, elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#2d3432' },
  cardSub: { fontSize: 13, color: '#536350' },
  categoryChip: {
    alignSelf: 'flex-start', backgroundColor: '#e8f5e9',
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  categoryChipText: { fontSize: 11, color: '#1d6d2b' },
});
