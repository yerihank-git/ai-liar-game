import { create } from "zustand";
import type { Room, Player, Description, Message, Vote } from "@/types/game";

interface GameStoreState {
  room: Room | null;
  players: Player[];
  descriptions: Description[];
  messages: Message[];
  votes: Vote[];

  setRoom: (room: Room) => void;
  setPlayers: (players: Player[]) => void;
  setDescriptions: (descriptions: Description[]) => void;
  addDescription: (description: Description) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setVotes: (votes: Vote[]) => void;
  addVote: (vote: Vote) => void;
  reset: () => void;
}

const initialState = {
  room: null,
  players: [],
  descriptions: [],
  messages: [],
  votes: [],
};

export const useGameStore = create<GameStoreState>()((set) => ({
  ...initialState,

  setRoom: (room) => set({ room }),
  setPlayers: (players) => set({ players }),
  setDescriptions: (descriptions) => set({ descriptions }),
  addDescription: (description) =>
    set((s) => ({ descriptions: [...s.descriptions, description] })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  setVotes: (votes) => set({ votes }),
  addVote: (vote) =>
    set((s) => {
      const filtered = s.votes.filter((v) => v.voter_id !== vote.voter_id);
      return { votes: [...filtered, vote] };
    }),
  reset: () => set(initialState),
}));
