export interface TaskTemplate {
  id: string;
  taskName: string;
  subtasks: string[];
  durationSeconds: number;
  breakDurationSeconds: number;
  category?: string;
}

export interface CompletedTask {
  id: string;
  taskName: string;
  subtasks: string[];
  durationSeconds: number;
  breakDurationSeconds: number;
  category?: string;
  completedAt: number; // timestamp ms
  checklistItems?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  createdAt: number;
  items: ChecklistItem[];
}

export type RootStackParamList = {
  TaskInput: { prefill?: Partial<CompletedTask> } | undefined;
  Timer: {
    taskName: string;
    subtasks: string[];
    durationSeconds: number;
    breakDurationSeconds: number;
    category?: string;
  };
  Continue: {
    taskName: string;
    subtasks: string[];
    durationSeconds: number;
    breakDurationSeconds: number;
    category?: string;
  };
  History: undefined;
  Checklists: undefined;
  ChecklistDetail: { checklistId: string };
};
