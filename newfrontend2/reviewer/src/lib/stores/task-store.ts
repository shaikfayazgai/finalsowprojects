import { create } from "zustand";
import type { TaskItem } from "@/lib/api/contributor";

interface TaskStore {
  /** The task the contributor just clicked in the list. Used by the detail page. */
  selectedTask: TaskItem | null;
  statusOverrides: Record<string, TaskItem["status"]>;
  setSelectedTask: (task: TaskItem) => void;
  setTaskStatusOverride: (taskId: string, status: TaskItem["status"]) => void;
  clearSelectedTask: () => void;
}

export const useTaskStore = create<TaskStore>()((set) => ({
  selectedTask: null,
  statusOverrides: {},
  setSelectedTask: (task) => set({ selectedTask: task }),
  setTaskStatusOverride: (taskId, status) =>
    set((state) => ({
      selectedTask:
        state.selectedTask?.id === taskId
          ? { ...state.selectedTask, status }
          : state.selectedTask,
      statusOverrides: { ...state.statusOverrides, [taskId]: status },
    })),
  clearSelectedTask: () => set({ selectedTask: null }),
}));
