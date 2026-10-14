import { create } from 'zustand';

type CartState = {
  items: string[];
  add: (id: string) => void;
};

export const useCart = create<CartState>((set) => ({
  items: [],
  add: (id) => set((s) => ({ items: [...s.items, id] })),
}));
