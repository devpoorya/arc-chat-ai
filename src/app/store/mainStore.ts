import { type threads } from "@/db/schema/content.sql";
import { create } from "zustand";

export type Message = {
  role: "user" | "system";
  content: string;
  type: "error" | "normal";
};
type MainStore = {
  threadsList: (typeof threads.$inferSelect)[];
  setThreadsList: (threadsList: (typeof threads.$inferSelect)[]) => void;
  currentThreadId: number | null;
  setCurrentThreadId: (currentThreadId: number | null) => void;
  currentMessages: Message[];
  setCurrentMessages: (currentMessages: Message[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (sidebarExpanded: boolean) => void;
};

export const useMainStore = create<MainStore>()((set) => ({
  threadsList: [],
  setThreadsList: (threadsList: (typeof threads.$inferSelect)[]) =>
    set({ threadsList }),
  currentThreadId: null,
  setCurrentThreadId: (currentThreadId: number | null) =>
    set({ currentThreadId }),
  currentMessages: [],
  setCurrentMessages: (currentMessages: Message[]) => set({ currentMessages }),
  loading: false,
  setLoading: (loading: boolean) => set({ loading }),
  sidebarExpanded: true,
  setSidebarExpanded: (sidebarExpanded: boolean) => set({ sidebarExpanded }),
}));
