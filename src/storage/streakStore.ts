import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompletedTask } from '../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'streak_store';

export async function getAll(): Promise<CompletedTask[]> {
  const json = await AsyncStorage.getItem(KEY);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export async function save(task: Omit<CompletedTask, 'id' | 'completedAt'>): Promise<void> {
  const list = await getAll();
  list.push({ ...task, id: uuidv4(), completedAt: Date.now() });
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function remove(id: string): Promise<void> {
  const list = await getAll();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter(t => t.id !== id)));
}

function startOfDay(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function getLastDays(days: number): Promise<CompletedTask[]> {
  const cutoff = startOfDay() - (days - 1) * 86_400_000;
  const all = await getAll();
  return all.filter(t => t.completedAt >= cutoff);
}
