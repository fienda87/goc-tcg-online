import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useCollectionStore } from './collectionStore';
import { useEnergyStore } from './energyStore';

interface NewPlayerLoginState {
  newPlayerStreakDay: number;
  lastNewPlayerClaim: string | null;
  isNewPlayerEligible: boolean;
  loading: boolean;
  error: string | null;
  claimableToday: boolean;
  fetchNewPlayerStreak: () => Promise<void>;
  claimNewPlayerReward: (cardId?: string) => Promise<any>;
}

export const useNewPlayerLoginStore = create<NewPlayerLoginState>((set, get) => ({
  newPlayerStreakDay: 0,
  lastNewPlayerClaim: null,
  isNewPlayerEligible: false,
  loading: false,
  error: null,
  claimableToday: false,

  fetchNewPlayerStreak: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Guest mode - no daily rewards

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('new_player_streak_day, last_new_player_claim, is_new_player_eligible')
        .single();

      if (error) throw error;

      if (data) {
        const isEligible = data.is_new_player_eligible !== false; // defaults to true
        const todayStr = new Date().toISOString().split('T')[0];
        const lastClaimStr = data.last_new_player_claim ? new Date(data.last_new_player_claim).toISOString().split('T')[0] : null;
        
        // Claimable if eligible, and last claim was not today, and streak < 7
        const claimable = isEligible && (lastClaimStr !== todayStr) && ((data.new_player_streak_day ?? 0) < 7);

        set({
          newPlayerStreakDay: data.new_player_streak_day ?? 0,
          lastNewPlayerClaim: data.last_new_player_claim,
          isNewPlayerEligible: isEligible,
          claimableToday: claimable,
          loading: false
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'Gagal memuat login streak pemain baru', loading: false });
    }
  },

  claimNewPlayerReward: async (cardId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User tidak terautentikasi' };

    set({ loading: true, error: null });
    try {
      // 1. Fetch current profile data to calculate next reward safely
      const { data: profile, error: fetchErr } = await supabase
        .from('profiles')
        .select('new_player_streak_day, last_new_player_claim, is_new_player_eligible, gacha_count')
        .single();

      if (fetchErr) throw fetchErr;

      const isEligible = profile.is_new_player_eligible !== false;
      const todayStr = new Date().toISOString().split('T')[0];
      const lastClaimStr = profile.last_new_player_claim ? new Date(profile.last_new_player_claim).toISOString().split('T')[0] : null;

      if (!isEligible) {
        throw new Error('Anda sudah menyelesaikan atau tidak memenuhi syarat untuk login reward pemain baru');
      }

      if (lastClaimStr === todayStr) {
        throw new Error('Anda sudah mengklaim hadiah pemain baru hari ini');
      }

      const nextDay = (profile.new_player_streak_day ?? 0) + 1;
      if (nextDay > 7) {
        throw new Error('Batas 7 hari login reward pemain baru sudah tercapai');
      }

      let rewardType: 'bp_points' | 'gacha_ticket' | 'card' = 'bp_points';
      let rewardAmount = 0;
      let rewardCardId: string | undefined = undefined;

      // 2. Apply rewards based on nextDay
      if (nextDay === 1) {
        rewardType = 'bp_points';
        rewardAmount = 20;
        // Add BP atomically via RPC
        const { error: rpcErr } = await supabase.rpc('adjust_ip_points', { p_amount: 20 });
        if (rpcErr) throw rpcErr;
      } 
      else if (nextDay === 2) {
        rewardType = 'gacha_ticket';
        rewardAmount = 1;
        // Add gacha ticket to profiles
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ gacha_count: (profile.gacha_count ?? 0) + 1 })
          .eq('id', user.id);
        if (updateErr) throw updateErr;
      } 
      else if (nextDay === 3) {
        rewardType = 'bp_points';
        rewardAmount = 25;
        const { error: rpcErr } = await supabase.rpc('adjust_ip_points', { p_amount: 25 });
        if (rpcErr) throw rpcErr;
      } 
      else if (nextDay === 4) {
        rewardType = 'bp_points';
        rewardAmount = 30;
        const { error: rpcErr } = await supabase.rpc('adjust_ip_points', { p_amount: 30 });
        if (rpcErr) throw rpcErr;
      } 
      else if (nextDay === 5) {
        rewardType = 'gacha_ticket';
        rewardAmount = 2;
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ gacha_count: (profile.gacha_count ?? 0) + 2 })
          .eq('id', user.id);
        if (updateErr) throw updateErr;
      } 
      else if (nextDay === 6) {
        rewardType = 'bp_points';
        rewardAmount = 30;
        const { error: rpcErr } = await supabase.rpc('adjust_ip_points', { p_amount: 30 });
        if (rpcErr) throw rpcErr;
      } 
      else if (nextDay === 7) {
        rewardType = 'card';
        rewardAmount = 1;
        if (!cardId) {
          throw new Error('Silakan pilih kartu Legendary terlebih dahulu');
        }
        rewardCardId = cardId;

        // Insert card directly to owned_cards
        const { error: insertErr } = await supabase
          .from('owned_cards')
          .insert({
            user_id: user.id,
            card_id: cardId,
            volume: 3
          });
        if (insertErr) throw insertErr;
      }

      // 3. Update profiles claim status
      const { error: profileUpdateErr } = await supabase
        .from('profiles')
        .update({
          new_player_streak_day: nextDay,
          last_new_player_claim: todayStr,
          is_new_player_eligible: nextDay < 7 // Disabled after day 7 claim completes
        })
        .eq('id', user.id);

      if (profileUpdateErr) throw profileUpdateErr;

      // 4. Sync other stores
      await useCollectionStore.getState().fetchCollection();
      await useEnergyStore.getState().fetchEnergy();
      await get().fetchNewPlayerStreak();

      set({ loading: false });
      return {
        success: true,
        newStreak: nextDay,
        rewardType,
        rewardAmount,
        rewardCardId
      };
    } catch (err: any) {
      set({ error: err.message || 'Gagal mengklaim hadiah login pemain baru', loading: false });
      throw err;
    }
  }
}));
