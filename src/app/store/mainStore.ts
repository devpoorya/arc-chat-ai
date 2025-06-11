import { create } from "zustand";

export type Message = {
  role: "user" | "system";
  content: string;
  type: "error" | "normal";
};
type MainStore = {
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
  currentThreadId: null,
  setCurrentThreadId: (currentThreadId: number | null) =>
    set({ currentThreadId }),
  currentMessages: [],
  setCurrentMessages: (currentMessages: Message[]) => set({ currentMessages }),
  loading: false,
  setLoading: (loading: boolean) => set({ loading }),
  sidebarExpanded: false,
  setSidebarExpanded: (sidebarExpanded: boolean) => set({ sidebarExpanded }),
}));
