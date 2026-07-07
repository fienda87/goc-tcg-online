import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useCollectionStore } from './collectionStore';
import { useEnergyStore } from './energyStore';

interface DailyLoginState {
  loginStreakDay: number;
  lastLoginClaim: string | null;
  loading: boolean;
  error: string | null;
  claimableToday: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  fetchStreak: () => Promise<void>;
  claimDailyReward: (cardId?: string) => Promise<any>;
}

export const useDailyLoginStore = create<DailyLoginState>((set, get) => ({
  loginStreakDay: 0,
  lastLoginClaim: null,
  loading: false,
  error: null,
  claimableToday: false,
  isOpen: false,

  setIsOpen: (isOpen) => set({ isOpen }),

  fetchStreak: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Guest mode - no daily rewards

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('login_streak_day, last_login_claim')
        .single();

      if (error) throw error;

      if (data) {
        const todayStr = new Date().toISOString().split('T')[0];
        const lastClaimStr = data.last_login_claim ? new Date(data.last_login_claim).toISOString().split('T')[0] : null;
        
        // Claimable if last claim was not today
        const claimable = lastClaimStr !== todayStr;

        set({
          loginStreakDay: data.login_streak_day ?? 0,
          lastLoginClaim: data.last_login_claim,
          claimableToday: claimable,
          isOpen: claimable, // open automatically if claimable
          loading: false
        });
      }
    } catch (err: any) {
      console.error('Error fetching daily login streak:', err);
      set({ error: err.message || 'Gagal memuat streak', loading: false });
    }
  },

  claimDailyReward: async (cardId?: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('claim_daily_reward', {
        p_card_id: cardId || null
      });

      if (error) throw error;

      if (data && data[0]?.success) {
        // Sync collection, points, and gacha energy
        await useCollectionStore.getState().fetchCollection();
        await useEnergyStore.getState().fetchEnergy();

        // Refresh daily status
        await get().fetchStreak();
        
        set({ loading: false });
        return {
          success: true,
          newStreak: data[0].new_streak,
          rewardType: data[0].reward_type,
          rewardAmount: data[0].reward_amount,
          rewardCardId: data[0].reward_card_id
        };
      }

      set({ loading: false });
      return { success: false };
    } catch (err: any) {
      console.error('Error claiming daily reward:', err);
      set({ error: err.message || 'Gagal klaim hadiah harian', loading: false });
      throw err;
    }
  }
}));
