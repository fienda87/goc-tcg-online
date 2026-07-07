import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardData } from '../data/cards';
import { BINDER_COLORS } from '../constants/binderColors';
import { ALL_CARDS } from '../data/cards';
import { supabase } from '../lib/supabase';

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Guest mode - fallback to persisted local storage

        set({ loading: true, error: null });
        try {
          // Fetch all binders
          const { data: dbBinders, error: binderError } = await supabase
            .from('binders')
            .select('*')
            .order('created_at', { ascending: true });

          if (binderError) throw binderError;

          const detailedBinders: BinderDetail[] = [];

          for (const b of dbBinders || []) {
            // Fetch slots for this binder
            const { data: dbSlots, error: slotError } = await supabase
              .from('binder_slots')
              .select('slot_position, card_id')
              .eq('binder_id', b.id);

            if (slotError) throw slotError;

            // Build slots array of size 24
            const slots: BinderSlot[] = Array.from({ length: 24 }, (_, i) => ({
              slotPosition: i,
              card: null,
            }));

            (dbSlots || []).forEach((s) => {
              if (s.slot_position >= 0 && s.slot_position < 24 && s.card_id) {
                const card = ALL_CARDS.find((c) => c.id === s.card_id);
                if (card) {
                  slots[s.slot_position] = {
                    slotPosition: s.slot_position,
                    card,
                  };
                }
              }
            });

            detailedBinders.push({
              id: b.id,
              name: b.name,
              colorId: b.color_id,
              colorHex: b.color_hex,
              colorDisplay: b.color_display,
              cardCount: slots.filter((s) => s.card !== null).length,
              updatedAt: b.updated_at,
              slots,
            });
          }

          set({ binders: detailedBinders, loading: false });
        } catch (err: any) {
          set({ error: err.message || 'Gagal memuat binder', loading: false });
        }
      },

      fetchBinderDetail: async (binderId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        
        // If guest, find in local state
        if (!user) {
          set({ loading: true, error: null });
          const binder = get().binders.find((b) => b.id === binderId);
          if (!binder) {
            set({ error: 'Binder tidak ditemukan', loading: false, currentBinder: null });
            return;
          }
          set({ currentBinder: binder, loading: false });
          return;
        }

        // Logged-in: fetch from Supabase
        set({ loading: true, error: null });
        try {
          const { data: b, error: binderError } = await supabase
            .from('binders')
            .select('*')
            .eq('id', binderId)
            .single();

          if (binderError) throw binderError;

          const { data: dbSlots, error: slotError } = await supabase
            .from('binder_slots')
            .select('slot_position, card_id')
            .eq('binder_id', b.id);

          if (slotError) throw slotError;

          const slots: BinderSlot[] = Array.from({ length: 24 }, (_, i) => ({
            slotPosition: i,
            card: null,
          }));

          (dbSlots || []).forEach((s) => {
            if (s.slot_position >= 0 && s.slot_position < 24 && s.card_id) {
              const card = ALL_CARDS.find((c) => c.id === s.card_id);
              if (card) {
                slots[s.slot_position] = {
                  slotPosition: s.slot_position,
                  card,
                };
              }
            }
          });

          const binderDetail: BinderDetail = {
            id: b.id,
            name: b.name,
            colorId: b.color_id,
            colorHex: b.color_hex,
            colorDisplay: b.color_display,
            cardCount: slots.filter((s) => s.card !== null).length,
            updatedAt: b.updated_at,
            slots,
          };

          set({
            currentBinder: binderDetail,
            binders: get().binders.map((x) => (x.id === binderId ? binderDetail : x)),
            loading: false,
          });
        } catch (err: any) {
          set({ error: err.message || 'Gagal memuat detail binder', loading: false, currentBinder: null });
        }
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

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Guest mode
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

          set({ binders: [...state.binders, newBinder] });
          localStorage.setItem('goc-guest-dirty', 'true');
          return newBinder;
        }

        // Logged-in: Save to Supabase
        const { data: dbBinder, error: binderError } = await supabase
          .from('binders')
          .insert({
            user_id: user.id,
            name: cleanName,
            color_id: color.id,
            color_hex: color.hex,
            color_display: color.display,
          })
          .select('*')
          .single();

        if (binderError) throw binderError;

        const newBinder: BinderDetail = {
          id: dbBinder.id,
          name: dbBinder.name,
          colorId: dbBinder.color_id,
          colorHex: dbBinder.color_hex,
          colorDisplay: dbBinder.color_display,
          cardCount: 0,
          updatedAt: dbBinder.updated_at,
          slots: Array.from({ length: 24 }, (_, i) => ({
            slotPosition: i,
            card: null,
          })),
        };

        set({ binders: [...state.binders, newBinder] });
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

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { error } = await supabase
            .from('binders')
            .update({
              name: updatedName,
              color_id: updatedColor.id,
              color_hex: updatedColor.hex,
              color_display: updatedColor.display,
              updated_at: new Date().toISOString(),
            })
            .eq('id', binderId);

          if (error) throw error;
        } else {
          localStorage.setItem('goc-guest-dirty', 'true');
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
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { error } = await supabase
            .from('binders')
            .delete()
            .eq('id', binderId);

          if (error) throw error;
        } else {
          localStorage.setItem('goc-guest-dirty', 'true');
        }

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

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { error } = await supabase
            .from('binder_slots')
            .upsert({
              binder_id: binderId,
              slot_position: targetPosition,
              card_id: cardId,
            }, {
              onConflict: 'binder_id,slot_position'
            });

          if (error) throw error;
        } else {
          localStorage.setItem('goc-guest-dirty', 'true');
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

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Delete from database
          const { error } = await supabase
            .from('binder_slots')
            .delete()
            .eq('binder_id', binderId)
            .eq('slot_position', slotPosition);

          if (error) throw error;
        } else {
          localStorage.setItem('goc-guest-dirty', 'true');
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

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // First delete all existing slots in database for this binder
          const { error: deleteError } = await supabase
            .from('binder_slots')
            .delete()
            .eq('binder_id', binderId);

          if (deleteError) throw deleteError;

          // Insert new slots payload (excluding empty cards)
          const insertPayload = newSlotsPayload
            .filter((item) => item.cardId)
            .map((item) => ({
              binder_id: binderId,
              slot_position: item.slotPosition,
              card_id: item.cardId,
            }));

          if (insertPayload.length > 0) {
            const { error: insertError } = await supabase
              .from('binder_slots')
              .insert(insertPayload);

            if (insertError) throw insertError;
          }
        } else {
          localStorage.setItem('goc-guest-dirty', 'true');
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

        const newCardCount = reconstructedSlots.filter((s) => s.card !== null).length;

        const updatedBinder: BinderDetail = {
          ...binder,
          slots: reconstructedSlots,
          cardCount: newCardCount,
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
