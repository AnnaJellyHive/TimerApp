export interface TaskTemplate {
  id: string;
  taskName: string;
  subtasks: string[];
  durationSeconds: number;
  breakDurationSeconds: number;
}

export interface CompletedTask {
  id: string;
  taskName: string;
  subtasks: string[];
  durationSeconds: number;
  breakDurationSeconds: number;
  completedAt: number; // timestamp ms
}

export type RootStackParamList = {
  TaskInput: { prefill?: Partial<CompletedTask> } | undefined;
  Timer: {
    taskName: string;
    subtasks: string[];
    durationSeconds: number;
    breakDurationSeconds: number;
  };
  Continue: {
    taskName: string;
    subtasks: string[];
    durationSeconds: number;
    breakDurationSeconds: number;
  };
  History: undefined;
};
