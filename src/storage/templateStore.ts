import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskTemplate } from '../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'template_store';

export async function getAll(): Promise<TaskTemplate[]> {
  const json = await AsyncStorage.getItem(KEY);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export async function save(template: Omit<TaskTemplate, 'id'>): Promise<void> {
  const list = await getAll();
  list.push({ ...template, id: uuidv4() });
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function remove(id: string): Promise<void> {
  const list = await getAll();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter(t => t.id !== id)));
}
