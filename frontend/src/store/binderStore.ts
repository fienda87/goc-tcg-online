import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardData } from '../data/cards';
import { BINDER_COLORS } from '../constants/binderColors';
import { ALL_CARDS } from '../data/cards';

export interface BinderSlot {
  slotPosition: number;
  card: CardData | null;
}

export interface Binder {
  id: string;
  name: string;
  colorId: string;
  colorHex: string;
  colorDisplay: string;
  cardCount: number;
  updatedAt: string;
}

export interface BinderDetail extends Binder {
  slots: BinderSlot[];
}

interface BinderStore {
  binders: BinderDetail[];
  loading: boolean;
  error: string | null;
  currentBinder: BinderDetail | null;

  fetchBinders: () => Promise<void>;
  fetchBinderDetail: (binderId: string) => Promise<void>;
  createBinder: (name: string, colorId: string) => Promise<BinderDetail>;
  updateBinder: (binderId: string, name?: string, colorId?: string) => Promise<void>;
  deleteBinder: (binderId: string) => Promise<void>;

  addCardToSlot: (binderId: string, cardId: string, slotPosition?: number) => Promise<void>;
  removeCardFromSlot: (binderId: string, slotPosition: number) => Promise<void>;
  reorderSlots: (binderId: string, newSlots: Array<{ slotPosition: number; cardId: string }>) => Promise<void>;

  optimisticReorder: (newSlots: BinderSlot[]) => void;
  rollbackReorder: (prevSlots: BinderSlot[]) => void;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const useBinderStore = create<BinderStore>()(
  persist(
    (set, get) => ({
      binders: [],
      loading: false,
      error: null,
      currentBinder: null,

      fetchBinders: async () => {
        set({ loading: true, error: null });
        set({ loading: false });
      },

      fetchBinderDetail: async (binderId: string) => {
        set({ loading: true, error: null });
        const binder = get().binders.find((b) => b.id === binderId);
        if (!binder) {
          set({ error: 'Binder tidak ditemukan', loading: false, currentBinder: null });
          return;
        }
        set({ currentBinder: binder, loading: false });
      },

      createBinder: async (name: string, colorId: string) => {
        set({ error: null });
        const cleanName = name.trim();
        if (!cleanName || cleanName.length < 3 || cleanName.length > 50) {
          throw new Error('Nama binder harus antara 3 hingga 50 karakter');
        }

        const state = get();
        if (state.binders.length >= 5) {
          throw new Error('Kamu hanya bisa memiliki maksimal 5 binder');
        }

        const nameExists = state.binders.some(
          (b) => b.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (nameExists) {
          throw new Error('Nama binder sudah digunakan');
        }

        const color = BINDER_COLORS.find((c) => c.id === colorId);
        if (!color) {
          throw new Error('Warna binder tidak valid');
        }

        const newBinder: BinderDetail = {
          id: generateId(),
          name: cleanName,
          colorId: color.id,
          colorHex: color.hex,
          colorDisplay: color.display,
          cardCount: 0,
          updatedAt: new Date().toISOString(),
          slots: Array.from({ length: 24 }, (_, i) => ({
            slotPosition: i,
            card: null,
          })),
        };

        set({
          binders: [...state.binders, newBinder],
        });

        return newBinder;
      },

      updateBinder: async (binderId: string, name?: string, colorId?: string) => {
        set({ error: null });
        const state = get();
        const binder = state.binders.find((b) => b.id === binderId);
        if (!binder) {
          throw new Error('Binder tidak ditemukan');
        }

        let updatedName = binder.name;
        if (name !== undefined) {
          const cleanName = name.trim();
          if (!cleanName || cleanName.length < 3 || cleanName.length > 50) {
            throw new Error('Nama binder harus antara 3 hingga 50 karakter');
          }
          const nameExists = state.binders.some(
            (b) => b.id !== binderId && b.name.toLowerCase() === cleanName.toLowerCase()
          );
          if (nameExists) {
            throw new Error('Nama binder sudah digunakan');
          }
          updatedName = cleanName;
        }

        let updatedColor = {
          id: binder.colorId,
          hex: binder.colorHex,
          display: binder.colorDisplay,
        };

        if (colorId !== undefined) {
          const color = BINDER_COLORS.find((c) => c.id === colorId);
          if (!color) {
            throw new Error('Warna binder tidak valid');
          }
          updatedColor = color;
        }

        const updatedBinder: BinderDetail = {
          ...binder,
          name: updatedName,
          colorId: updatedColor.id,
          colorHex: updatedColor.hex,
          colorDisplay: updatedColor.display,
          updatedAt: new Date().toISOString(),
        };

        set({
          binders: state.binders.map((b) => (b.id === binderId ? updatedBinder : b)),
          currentBinder: state.currentBinder?.id === binderId ? updatedBinder : state.currentBinder,
        });
      },

      deleteBinder: async (binderId: string) => {
        set({ error: null });
        const state = get();
        set({
          binders: state.binders.filter((b) => b.id !== binderId),
          currentBinder: state.currentBinder?.id === binderId ? null : state.currentBinder,
        });
      },

      addCardToSlot: async (binderId: string, cardId: string, slotPosition?: number) => {
        set({ error: null });
        const state = get();
        const binder = state.binders.find((b) => b.id === binderId);
        if (!binder) {
          throw new Error('Binder tidak ditemukan');
        }

        if (binder.cardCount >= 24) {
          throw new Error('Binder sudah penuh (maksimal 24 kartu)');
        }

        const card = ALL_CARDS.find((c) => c.id === cardId);
        if (!card) {
          throw new Error('Kartu tidak ditemukan');
        }

        const cardExists = binder.slots.some((s) => s.card?.name === card.name);
        if (cardExists) {
          throw new Error('Kartu ini sudah ada di dalam binder');
        }

        const newSlots = [...binder.slots];
        let targetPosition = slotPosition;

        if (targetPosition === undefined) {
          const emptySlotIndex = newSlots.findIndex((s) => s.card === null);
          if (emptySlotIndex === -1) {
            throw new Error('Tidak ada slot kosong yang tersedia');
          }
          targetPosition = emptySlotIndex;
        } else {
          if (targetPosition < 0 || targetPosition >= 24) {
            throw new Error('Posisi slot tidak valid');
          }
        }

        newSlots[targetPosition] = {
          slotPosition: targetPosition,
          card: card,
        };

        const updatedBinder: BinderDetail = {
          ...binder,
          slots: newSlots,
          cardCount: binder.cardCount + 1,
          updatedAt: new Date().toISOString(),
        };

        set({
          binders: state.binders.map((b) => (b.id === binderId ? updatedBinder : b)),
          currentBinder: state.currentBinder?.id === binderId ? updatedBinder : state.currentBinder,
        });
      },

      removeCardFromSlot: async (binderId: string, slotPosition: number) => {
        set({ error: null });
        const state = get();
        const binder = state.binders.find((b) => b.id === binderId);
        if (!binder) {
          throw new Error('Binder tidak ditemukan');
        }

        if (slotPosition < 0 || slotPosition >= 24) {
          throw new Error('Posisi slot tidak valid');
        }

        const newSlots = [...binder.slots];
        if (newSlots[slotPosition].card === null) {
          return;
        }

        newSlots[slotPosition] = {
          slotPosition,
          card: null,
        };

        const updatedBinder: BinderDetail = {
          ...binder,
          slots: newSlots,
          cardCount: Math.max(0, binder.cardCount - 1),
          updatedAt: new Date().toISOString(),
        };

        set({
          binders: state.binders.map((b) => (b.id === binderId ? updatedBinder : b)),
          currentBinder: state.currentBinder?.id === binderId ? updatedBinder : state.currentBinder,
        });
      },

      reorderSlots: async (binderId: string, newSlotsPayload: Array<{ slotPosition: number; cardId: string }>) => {
        set({ error: null });
        const state = get();
        const binder = state.binders.find((b) => b.id === binderId);
        if (!binder) {
          throw new Error('Binder tidak ditemukan');
        }

        const reconstructedSlots: BinderSlot[] = Array.from({ length: 24 }, (_, i) => ({
          slotPosition: i,
          card: null,
        }));

        for (const item of newSlotsPayload) {
          if (item.slotPosition >= 0 && item.slotPosition < 24) {
            const card = ALL_CARDS.find((c) => c.id === item.cardId);
            if (card) {
              reconstructedSlots[item.slotPosition] = {
                slotPosition: item.slotPosition,
                card,
              };
            }
          }
        }

        const updatedBinder: BinderDetail = {
          ...binder,
          slots: reconstructedSlots,
          updatedAt: new Date().toISOString(),
        };

        set({
          binders: state.binders.map((b) => (b.id === binderId ? updatedBinder : b)),
          currentBinder: state.currentBinder?.id === binderId ? updatedBinder : state.currentBinder,
        });
      },

      optimisticReorder: (newSlots: BinderSlot[]) => {
        set((state) => ({
          currentBinder: state.currentBinder ? { ...state.currentBinder, slots: newSlots } : null,
        }));
      },

      rollbackReorder: (prevSlots: BinderSlot[]) => {
        set((state) => ({
          currentBinder: state.currentBinder ? { ...state.currentBinder, slots: prevSlots } : null,
        }));
      },
    }),
    {
      name: 'goc-binders',
    }
  )
);
