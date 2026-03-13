import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerSession } from "@/types/game";

interface PlayerStoreState {
  session: PlayerSession | null;
  setSession: (session: PlayerSession) => void;
  clearSession: () => void;
}

export const usePlayerStore = create<PlayerStoreState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: "playerSession",
    }
  )
);
