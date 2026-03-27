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
};
