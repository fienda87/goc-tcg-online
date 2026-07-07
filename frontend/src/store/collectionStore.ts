import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { ALL_CARDS, type CardData } from '../data/cards';

interface CollectionState {
  cards: any[];
  ipPoints: number;
  loading: boolean;
  setCards: (cards: any[]) => void;
  addIpPoints: (amount: number) => Promise<void>;
  deductIpPoints: (amount: number) => Promise<void>;
  extractCard: (cardName: string, countToExtract: number, pointsPerCard: number) => Promise<void>;
  fetchCollection: () => Promise<void>;
  addPulledCards: (newCards: CardData[], pointsReward: number) => Promise<void>;
  buyCard: (card: CardData, price: number) => Promise<boolean>;
  extractAllCards: (totalExtractablePoints: number) => Promise<void>;
  migrateGuestData: () => Promise<void>;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      cards: [],
      ipPoints: 0,
      loading: false,

      setCards: (cards) => set({ cards }),

      addIpPoints: async (amount) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const newIp = get().ipPoints + amount;
          set({ ipPoints: newIp });
          localStorage.setItem('goc-guest-dirty', 'true');
          return;
        }

        try {
          const { data: newDbIp, error } = await supabase.rpc('adjust_ip_points', { p_amount: amount });
          if (error) throw error;
          set({ ipPoints: newDbIp });
        } catch (e) {
          console.error('Error updating points in Supabase:', e);
          set({ ipPoints: get().ipPoints + amount });
        }
      },

      deductIpPoints: async (amount) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const newIp = Math.max(0, get().ipPoints - amount);
          set({ ipPoints: newIp });
          localStorage.setItem('goc-guest-dirty', 'true');
          return;
        }

        try {
          const { data: newDbIp, error } = await supabase.rpc('adjust_ip_points', { p_amount: -amount });
          if (error) throw error;
          set({ ipPoints: newDbIp });
        } catch (e) {
          console.error('Error updating points in Supabase:', e);
          set({ ipPoints: Math.max(0, get().ipPoints - amount) });
        }
      },

      fetchCollection: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Guest mode - use persisted local storage

        set({ loading: true });
        try {
          // Fetch profile for IP points
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('ip_points')
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          // Fetch owned cards
          const { data: dbCards, error: cardsError } = await supabase
            .from('owned_cards')
            .select('id, card_id, volume');

          if (cardsError) throw cardsError;

          // Map dbCards back to frontend card objects
          const mappedCards = (dbCards || []).map((dbCard) => {
            const baseCard = ALL_CARDS.find((c) => c.id === dbCard.card_id);
            return {
              ...(baseCard || {}),
              id: dbCard.id, // Use Supabase row UUID as instance ID
              card_id: dbCard.card_id,
              volume: dbCard.volume
            };
          }).filter(c => c.name !== undefined); // Filter out any deleted/broken cards

          set({
            ipPoints: profile?.ip_points ?? 0,
            cards: mappedCards,
            loading: false
          });
        } catch (err) {
          console.error('Error fetching collection from Supabase:', err);
          set({ loading: false });
        }
      },

      addPulledCards: async (newCards, pointsReward) => {
        const { data: { user } } = await supabase.auth.getUser();
        const currentCards = get().cards;
        const currentIp = get().ipPoints;

        if (!user) {
          // Guest mode
          const clientInstances = newCards.map(c => ({
            ...c,
            id: `gacha-${Date.now()}-${Math.random()}`
          }));
          set({
            cards: [...currentCards, ...clientInstances],
            ipPoints: currentIp + pointsReward
          });
          localStorage.setItem('goc-guest-dirty', 'true');
          return;
        }

        // Logged-in mode: Save to database
        try {
          const insertPayload = newCards.map((card) => ({
            user_id: user.id,
            card_id: card.id,
            volume: card.volume || 1,
          }));

          const { data: inserted, error: insertError } = await supabase
            .from('owned_cards')
            .insert(insertPayload)
            .select('id, card_id, volume');

          if (insertError) throw insertError;

          // Update profile points
          const newIp = currentIp + pointsReward;
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ ip_points: newIp })
            .eq('id', user.id);

          if (profileError) throw profileError;

          // Map inserted cards to state
          const mappedInserted = inserted.map((dbCard) => {
            const baseCard = ALL_CARDS.find((c) => c.id === dbCard.card_id);
            return {
              ...(baseCard || {}),
              id: dbCard.id,
              card_id: dbCard.card_id,
              volume: dbCard.volume
            };
          });

          set({
            cards: [...currentCards, ...mappedInserted],
            ipPoints: newIp
          });
        } catch (err) {
          console.error('Error saving pulled cards to Supabase:', err);
        }
      },

      buyCard: async (card, price) => {
        const { data: { user } } = await supabase.auth.getUser();
        const currentCards = get().cards;
        const currentIp = get().ipPoints;

        if (currentIp < price) return false;

        const newIp = currentIp - price;

        if (!user) {
          // Guest mode
          const newCardInstance = { 
            ...card, 
            id: `shop-${Date.now()}-${Math.random()}` 
          };
          set({
            cards: [...currentCards, newCardInstance],
            ipPoints: newIp
          });
          localStorage.setItem('goc-guest-dirty', 'true');
          return true;
        }

        // Logged-in mode: save to database via secure atomic transaction RPC
        try {
          const { data, error } = await supabase.rpc('buy_card_transaction', {
            p_card_id: card.id,
            p_volume: card.volume || 1,
            p_price: price
          });

          if (error) throw error;

          const result = Array.isArray(data) ? data[0] : data;
          if (!result || !result.success) {
            console.error('Database transaction failed or insufficient points');
            return false;
          }

          const baseCard = ALL_CARDS.find((c) => c.id === card.id);
          const newCardInstance = {
            ...(baseCard || {}),
            id: result.inserted_card_id,
            card_id: card.id,
            volume: card.volume || 1
          };

          set({
            cards: [...currentCards, newCardInstance],
            ipPoints: result.new_points
          });
          return true;
        } catch (err) {
          console.error('Error purchasing card in Supabase:', err);
          return false;
        }
      },

      extractCard: async (cardName, countToExtract, pointsPerCard) => {
        const { data: { user } } = await supabase.auth.getUser();
        const currentCards = get().cards;
        const currentIp = get().ipPoints;

        if (!user) {
          // Guest mode
          let removedCount = 0;
          const newCards = currentCards.filter((card) => {
            if (card.name === cardName && removedCount < countToExtract) {
              removedCount++;
              return false;
            }
            return true;
          });
          set({
            cards: newCards,
            ipPoints: currentIp + (countToExtract * pointsPerCard)
          });
          localStorage.setItem('goc-guest-dirty', 'true');
          return;
        }

        // Logged-in mode: delete rows from database
        try {
          // Find the exact rows in currentCards that match the cardName
          const targetCardRows = currentCards.filter(c => c.name === cardName).slice(0, countToExtract);
          const targetIds = targetCardRows.map(c => c.id);

          if (targetIds.length > 0) {
            const { error: deleteError } = await supabase
              .from('owned_cards')
              .delete()
              .in('id', targetIds);

            if (deleteError) throw deleteError;
          }

          // Update profile points
          const newIp = currentIp + (countToExtract * pointsPerCard);
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ ip_points: newIp })
            .eq('id', user.id);

          if (profileError) throw profileError;

          // Filter local state
          const remainingCards = currentCards.filter(c => !targetIds.includes(c.id));
          set({
            cards: remainingCards,
            ipPoints: newIp
          });
        } catch (err) {
          console.error('Error recycling card in Supabase:', err);
        }
      },

      extractAllCards: async (totalExtractablePoints) => {
        const { data: { user } } = await supabase.auth.getUser();
        const currentCards = get().cards;
        const currentIp = get().ipPoints;

        // Group cards to identify duplicates and extra IDs to delete
        const counts: Record<string, number> = {};
        const retainedCards: any[] = [];
        const idsToDelete: string[] = [];

        currentCards.forEach((c) => {
          if (!counts[c.name]) {
            counts[c.name] = 1;
            retainedCards.push(c);
          } else {
            idsToDelete.push(c.id);
          }
        });

        if (idsToDelete.length === 0) return;

        const newIp = currentIp + totalExtractablePoints;

        if (!user) {
          // Guest mode
          set({
            cards: retainedCards,
            ipPoints: newIp
          });
          localStorage.setItem('goc-guest-dirty', 'true');
          return;
        }

        // Logged-in mode: delete in database
        try {
          const { error: deleteError } = await supabase
            .from('owned_cards')
            .delete()
            .in('id', idsToDelete);

          if (deleteError) throw deleteError;

          // Update profile points
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ ip_points: newIp })
            .eq('id', user.id);

          if (profileError) throw profileError;

          set({
            cards: retainedCards,
            ipPoints: newIp
          });
        } catch (err) {
          console.error('Error extracting all duplicates in Supabase:', err);
        }
      },

      migrateGuestData: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if there is actual guest data to migrate
        const isGuestDirty = localStorage.getItem('goc-guest-dirty') === 'true';
        if (!isGuestDirty) return;

        const currentCards = get().cards;
        const currentIp = get().ipPoints;

        // If there are guest cards or points, migrate them
        if (currentCards.length > 0 || currentIp > 0) {
          try {
            console.log('Migrating guest data to Supabase account for user:', user.id);

            // 1. Fetch current profile points to add them together
            const { data: profile } = await supabase
              .from('profiles')
              .select('ip_points')
              .single();

            const existingIp = profile?.ip_points ?? 0;
            const newIp = existingIp + currentIp;

            // Update profile with sum of points
            await supabase
              .from('profiles')
              .update({ ip_points: newIp })
              .eq('id', user.id);

            // 2. Insert all guest cards to owned_cards
            if (currentCards.length > 0) {
              const insertPayload = currentCards.map((card) => ({
                user_id: user.id,
                card_id: card.id || card.card_id,
                volume: card.volume || 1,
              }));

              await supabase
                .from('owned_cards')
                .insert(insertPayload);
            }

            // 3. Migrate binders dynamically
            const { useBinderStore } = await import('./binderStore');
            const localBinders = useBinderStore.getState().binders;
            if (localBinders.length > 0) {
              for (const b of localBinders) {
                // Insert binder
                const { data: dbBinder, error: binderError } = await supabase
                  .from('binders')
                  .insert({
                    user_id: user.id,
                    name: b.name,
                    color_id: b.colorId,
                    color_hex: b.colorHex,
                    color_display: b.colorDisplay,
                  })
                  .select('id')
                  .single();

                if (!binderError && dbBinder) {
                  // Insert non-empty slots for this binder
                  const slotsPayload = b.slots
                    .filter((s) => s.card !== null)
                    .map((s) => ({
                      binder_id: dbBinder.id,
                      slot_position: s.slotPosition,
                      card_id: s.card!.id,
                    }));

                  if (slotsPayload.length > 0) {
                    await supabase.from('binder_slots').insert(slotsPayload);
                  }
                }
              }
            }

            // Clear local storage cache keys so we don't migrate multiple times on refresh
            localStorage.removeItem('goc-collection');
            localStorage.removeItem('goc-binders');
            localStorage.removeItem('goc-gacha-timer');
            localStorage.removeItem('goc-guest-dirty');

            console.log('Guest data successfully migrated to Supabase account.');
          } catch (err) {
            console.error('Error migrating guest data:', err);
          }
        }
      },
    }),
    {
      name: 'goc-collection',
    }
  )
);
