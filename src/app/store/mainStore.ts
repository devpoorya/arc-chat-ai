import { type threads } from "@/db/schema/content.sql";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Message = {
  role: "user" | "system";
  content: string;
  type: "error" | "normal";
  files?: File[];
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
  openRouterApiKey: string | null;
  setOpenRouterApiKey: (key: string | null) => void;
  serperApiKey: string | null;
  setSerperApiKey: (key: string | null) => void;
};

export const useMainStore = create<MainStore>()(
  persist(
    (set) => ({
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
      openRouterApiKey: null,
      setOpenRouterApiKey: (key: string | null) => set({ openRouterApiKey: key }),
      serperApiKey: null,
      setSerperApiKey: (key: string | null) => set({ serperApiKey: key }),
    }),
    {
      name: "arc-chat-storage",
    }
  )
);
