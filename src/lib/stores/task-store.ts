import { create } from "zustand";
import type { TaskItem } from "@/lib/api/contributor";

interface TaskStore {
  /** The task the contributor just clicked in the list. Used by the detail page. */
  selectedTask: TaskItem | null;
  setSelectedTask: (task: TaskItem) => void;
  clearSelectedTask: () => void;
}

export const useTaskStore = create<TaskStore>()((set) => ({
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
  clearSelectedTask: () => set({ selectedTask: null }),
}));
