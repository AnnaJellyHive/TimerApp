import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskTemplate } from '../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'template_store';
const SEEDED_KEY = 'template_store_seeded_v1';

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

export async function seedDefaultTemplates(): Promise<void> {
  const alreadySeeded = await AsyncStorage.getItem(SEEDED_KEY);
  if (alreadySeeded) return;

  const defaults: Omit<TaskTemplate, 'id'>[] = [
    {
      taskName: 'Lugnande andningsövning',
      category: 'Mental hälsa',
      subtasks: ['Andas in', 'Andas ut', 'Andas in igen', 'Och andas ut', 'Andas in en tredje gång', 'Andas ut igen'],
      durationSeconds: 6,
      breakDurationSeconds: 3,
    },
    {
      taskName: 'Räkna matte',
      category: 'Plugg',
      subtasks: [
        'Öppna matteboken och välj ut 2 uppgifter',
        'Jobba på att lösa första uppgiften',
        'Jobba på att lösa andra uppgiften',
        'Jämför dina lösningar med facit',
      ],
      durationSeconds: 120,
      breakDurationSeconds: 120,
    },
  ];

  for (const t of defaults) {
    await save(t);
  }

  await AsyncStorage.setItem(SEEDED_KEY, '1');
}