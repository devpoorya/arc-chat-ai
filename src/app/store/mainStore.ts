import { create } from "zustand";

export type Message = {
  role: "user" | "assistant";
  content: string;
  type: "error" | "normal";
};
type MainStore = {
  currentMessages: Message[];
  setCurrentMessages: (currentMessages: Message[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

export const useMainStore = create<MainStore>()((set) => ({
  currentMessages: [],
  setCurrentMessages: (currentMessages: Message[]) => set({ currentMessages }),
  loading: false,
  setLoading: (loading: boolean) => set({ loading }),
}));
