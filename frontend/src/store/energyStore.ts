import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface GachaState {
  gachaCount: number; // Max 2
  lastGachaTime: number | null; // Timestamp when the timer started
  isUnlimited: boolean;
  pityCount: number; // Retained for compatibility
  pityCountVol1: number;
  pityCountVol2: number;
  pityCountVol3: number;
  setGachaData: (data: Partial<GachaState>) => void;
  consumeGacha: () => Promise<void>;
  canOpenGacha: () => boolean;
  getSecondsUntilNextGacha: () => number;
  checkRefill: () => Promise<void>;
  incrementPity: (volume?: number) => Promise<void>;
  resetPity: (volume?: number) => Promise<void>;
  fetchEnergy: () => Promise<void>;
}

export const COOLDOWN_SECONDS = 1800; // 30 minutes
export const MAX_GACHA = 2;

export const useEnergyStore = create<GachaState>()(
  persist(
    (set, get) => ({
      gachaCount: MAX_GACHA,
      lastGachaTime: null,
      isUnlimited: false,
      pityCount: 0,
      pityCountVol1: 0,
      pityCountVol2: 0,
      pityCountVol3: 0,
      
      setGachaData: (data) => set((state) => ({ ...state, ...data })),

      fetchEnergy: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Guest mode - use persisted local storage

        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('gacha_count, last_refill_time, pity_count_vol1, pity_count_vol2, pity_count_vol3')
            .single();

          if (error && error.code !== 'PGRST116') throw error;

          if (profile) {
            set({
              gachaCount: profile.gacha_count ?? MAX_GACHA,
              lastGachaTime: profile.last_refill_time ? new Date(profile.last_refill_time).getTime() : null,
              pityCountVol1: profile.pity_count_vol1 ?? 0,
              pityCountVol2: profile.pity_count_vol2 ?? 0,
              pityCountVol3: profile.pity_count_vol3 ?? 0,
            });
          }
        } catch (err) {
          console.error('Error fetching energy from Supabase:', err);
        }
      },

      incrementPity: async (volume = 1) => {
        const { data: { user } } = await supabase.auth.getUser();
        const updatePayload: any = {};
        
        if (volume === 3) {
          const val = get().pityCountVol3 + 1;
          set({ pityCountVol3: val });
          updatePayload.pity_count_vol3 = val;
        } else if (volume === 2) {
          const val = get().pityCountVol2 + 1;
          set({ pityCountVol2: val });
          updatePayload.pity_count_vol2 = val;
        } else {
          const val = get().pityCountVol1 + 1;
          set({ pityCountVol1: val });
          updatePayload.pity_count_vol1 = val;
        }

        if (user) {
          try {
            await supabase.from('profiles').update(updatePayload).eq('id', user.id);
          } catch (e) {
            console.error('Error syncing pity increment to Supabase:', e);
          }
        } else {
          localStorage.setItem('goc-guest-dirty', 'true');
        }
      },

      resetPity: async (volume = 1) => {
        const { data: { user } } = await supabase.auth.getUser();
        const updatePayload: any = {};
        
        if (volume === 3) {
          set({ pityCountVol3: 0 });
          updatePayload.pity_count_vol3 = 0;
        } else if (volume === 2) {
          set({ pityCountVol2: 0 });
          updatePayload.pity_count_vol2 = 0;
        } else {
          set({ pityCountVol1: 0 });
          updatePayload.pity_count_vol1 = 0;
        }

        if (user) {
          try {
            await supabase.from('profiles').update(updatePayload).eq('id', user.id);
          } catch (e) {
            console.error('Error syncing pity reset to Supabase:', e);
          }
        } else {
          localStorage.setItem('goc-guest-dirty', 'true');
        }
      },

      checkRefill: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const state = get();
        
        if (state.gachaCount > MAX_GACHA) {
          set({ gachaCount: MAX_GACHA, lastGachaTime: null });
          if (user) {
            await supabase.from('profiles').update({ gacha_count: MAX_GACHA, last_refill_time: null }).eq('id', user.id);
          }
          return;
        }
        
        if (state.gachaCount >= MAX_GACHA || !state.lastGachaTime) return;
        
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - state.lastGachaTime) / 1000);
        const earned = Math.floor(elapsedSeconds / COOLDOWN_SECONDS);
        
        if (earned > 0) {
          let newCount = state.gachaCount + earned;
          let newTime: number | null = state.lastGachaTime + (earned * COOLDOWN_SECONDS * 1000);
          
          if (newCount >= MAX_GACHA) {
            newCount = MAX_GACHA;
            newTime = null;
          }
          
          set({ gachaCount: newCount, lastGachaTime: newTime });
          
          if (user) {
            try {
              await supabase.from('profiles').update({
                gacha_count: newCount,
                last_refill_time: newTime ? new Date(newTime).toISOString() : null
              }).eq('id', user.id);
            } catch (e) {
              console.error('Error syncing refill to Supabase:', e);
            }
          }
        }
      },

      consumeGacha: async () => {
        await get().checkRefill();
        const state = get();
        const { data: { user } } = await supabase.auth.getUser();

        if (!state.isUnlimited) {
          if (state.gachaCount > 0) {
            const newCount = state.gachaCount - 1;
            const newTime = state.gachaCount === MAX_GACHA ? Date.now() : state.lastGachaTime;
            
            set({ gachaCount: newCount, lastGachaTime: newTime });

            if (user) {
              try {
                await supabase.from('profiles').update({
                  gacha_count: newCount,
                  last_refill_time: newTime ? new Date(newTime).toISOString() : null
                }).eq('id', user.id);
              } catch (e) {
                console.error('Error syncing consume to Supabase:', e);
              }
            } else {
              localStorage.setItem('goc-guest-dirty', 'true');
            }
          }
        }
      },

      canOpenGacha: () => {
        const state = get();
        if (state.isUnlimited) return true;
        return state.gachaCount > 0;
      },

      getSecondsUntilNextGacha: () => {
        const state = get();
        if (state.isUnlimited || state.gachaCount >= MAX_GACHA || !state.lastGachaTime) return 0;
        
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - state.lastGachaTime) / 1000);
        const remaining = COOLDOWN_SECONDS - elapsedSeconds;
        return remaining > 0 ? remaining : 0;
      }
    }),
    {
      name: 'goc-gacha-timer',
    }
  )
);
