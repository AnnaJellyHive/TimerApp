import AsyncStorage from '@react-native-async-storage/async-storage';
import { Checklist } from '../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'checklist_store';

export async function getAll(): Promise<Checklist[]> {
  const json = await AsyncStorage.getItem(KEY);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export async function save(name: string, templateItems?: Checklist['items']): Promise<Checklist> {
  const list = await getAll();
  const items = templateItems
    ? templateItems.map(i => ({ id: uuidv4(), text: i.text, checked: false }))
    : [];
  const newChecklist: Checklist = { id: uuidv4(), name, createdAt: Date.now(), items };
  list.push(newChecklist);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  return newChecklist;
}

export async function remove(id: string): Promise<void> {
  const list = await getAll();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter(c => c.id !== id)));
}

export async function update(checklist: Checklist): Promise<void> {
  const list = await getAll();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.map(c => c.id === checklist.id ? checklist : c)));
}
