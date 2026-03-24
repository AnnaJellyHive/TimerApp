import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import SwipeableRow from '../components/SwipeableRow';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, CompletedTask } from '../types';
import * as StreakStore from '../storage/streakStore';

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
    <View style={styles.container}>
      <Text style={styles.title}>Historik</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 48 }} />
      ) : tasks.length === 0 ? (
        <Text testID="emptyHistoryText" style={styles.empty}>
          Inga avklarade uppgifter de senaste 3 dagarna
        </Text>
      ) : (
        <FlatList
          accessibilityLabel="taskHistoryList"
          data={[...tasks].reverse()}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <SwipeableRow
              deleteAccessibilityLabel="historyDeleteYes"
              onDelete={() => deleteTask(item)}
              containerStyle={{ marginBottom: 10 }}>
              <TouchableOpacity onPress={() => reuseTask(item)}>
                <View testID={`historyItem_${item.id}`} style={styles.card}>
                  <Text testID="taskItemTitle" accessible={true} style={styles.cardTitle}>
                    {item.taskName}
                  </Text>
                  <Text testID="taskItemTime" style={styles.cardSub}>{formatDate(item.completedAt)}</Text>
                  <Text style={styles.cardSub}>{item.subtasks.length} underuppgifter</Text>
                </View>
              </TouchableOpacity>
            </SwipeableRow>
          )}
        />
      )}

      <TouchableOpacity
        accessibilityLabel="newTaskButton"
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('TaskInput')}>
        <Text style={styles.primaryBtnText}>Ny uppgift</Text>
      </TouchableOpacity>
    </View>
  );
}

const GREEN = '#4CAF50';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  empty: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 48 },
  card: {
    backgroundColor: '#f9f9f9', borderRadius: 10,
    padding: 16, elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#666' },
  primaryBtn: {
    backgroundColor: GREEN, borderRadius: 8,
    padding: 14, alignItems: 'center', marginTop: 16,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
