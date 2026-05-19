import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskTemplate } from '../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const KEY = 'template_store';
const SEEDED_KEY = 'template_store_seeded_v2';
const SEEDED_KEY_V1 = 'template_store_seeded_v1';

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

export async function updateLastUsed(id: string): Promise<void> {
  const list = await getAll();
  const updated = list.map(t => t.id === id ? { ...t, lastUsedAt: Date.now() } : t);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}

export async function getRecent(count: number = 3): Promise<TaskTemplate[]> {
  const list = await getAll();
  return list
    .filter(t => t.lastUsedAt != null)
    .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
    .slice(0, count);
}

const DEFAULT_TEMPLATE_NAMES = [
  'Lugnande andningsövning',
  'Fokusskifte - hitta 3 saker',
  'Räkna matte',
];

export async function seedDefaultTemplates(): Promise<void> {
  const alreadySeeded = await AsyncStorage.getItem(SEEDED_KEY);
  if (alreadySeeded) return;

  // Ta bort gamla v1-mallar om de finns
  const seededV1 = await AsyncStorage.getItem(SEEDED_KEY_V1);
  if (seededV1) {
    const existing = await getAll();
    const cleaned = existing.filter(t => !DEFAULT_TEMPLATE_NAMES.includes(t.taskName));
    await AsyncStorage.setItem(KEY, JSON.stringify(cleaned));
    await AsyncStorage.removeItem(SEEDED_KEY_V1);
  }

  const defaults: Omit<TaskTemplate, 'id'>[] = [
    {
      taskName: 'Lugnande andningsövning',
      category: 'Mental hälsa',
      subtasks: ['Andas in djupt', 'Håll andan', 'Andas ut långsamt', 'Känn hur kroppen slappnar av'],
      durationSeconds: 6,
      breakDurationSeconds: 0,
    },
    {
      taskName: 'Fokusskifte - hitta 3 saker',
      category: 'Mental hälsa',
      subtasks: [
        'Hitta 3 saker i rummet som är blå',
        'Hitta 3 ljud du kan höra',
        'Hitta 3 saker i rummet som har olika struktur',
        'Hitta 3 lukter du kan känna',
      ],
      durationSeconds: 45,
      breakDurationSeconds: 15,
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
