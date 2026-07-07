import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useCollectionStore } from './collectionStore';
import { useMailboxStore } from './mailboxStore';
import { checkAchievements, type AchievementDefinition } from '../data/achievements';

interface AchievementState {
  unlockedKeys: string[];
  loading: boolean;
  error: string | null;
  fetchAchievements: () => Promise<void>;
  checkAndUnlockAchievements: () => Promise<AchievementDefinition[]>;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  unlockedKeys: [],
  loading: false,
  error: null,

  fetchAchievements: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Guest mode - no online achievements

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_key');

      if (error) throw error;

      const keys = (data || []).map(row => row.achievement_key);
      set({ unlockedKeys: keys, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal memuat achievement', loading: false });
    }
  },

  checkAndUnlockAchievements: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return []; // Guest mode - no backend updates

    // Ensure we have fresh collection data
    const collectionCards = useCollectionStore.getState().cards;
    
    // Refresh unlocked keys from db to ensure accurate sync
    await get().fetchAchievements();
    const currentKeys = get().unlockedKeys;

    // Detect new unlocks
    const newUnlocks = checkAchievements(collectionCards, currentKeys);
    if (newUnlocks.length === 0) return [];

    const unlockedThisSession: AchievementDefinition[] = [];

    // Trigger RPC unlock for each new achievement
    for (const def of newUnlocks) {
      try {
        const { data: success, error } = await supabase.rpc('unlock_achievement', {
          p_achievement_key: def.key,
          p_reward_type: def.rewardType,
          p_reward_amount: def.rewardAmount,
          p_reward_card_id: def.rewardCardId || null
        });

        if (error) throw error;

        if (success) {
          unlockedThisSession.push(def);
        }
      } catch (err) {
        console.error(`Error unlocking achievement ${def.key}:`, err);
      }
    }

    if (unlockedThisSession.length > 0) {
      // Re-fetch achievements keys
      await get().fetchAchievements();
      // Instantly trigger mailbox refresh to show reward notification
      await useMailboxStore.getState().fetchMessages();
    }

    return unlockedThisSession;
  }
}));
