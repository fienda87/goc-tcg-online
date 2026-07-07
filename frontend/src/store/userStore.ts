import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface UserState {
  user: any | null;
  loading: boolean;
  initialize: () => Promise<() => void>;
  setUser: (user: any) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    set({ loading: true });
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false });
    });

    return () => {
      subscription.unsubscribe();
    };
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });

    try {
      // Dynamic imports to prevent circular dependencies
      const { useCollectionStore } = await import('./collectionStore');
      const { useBinderStore } = await import('./binderStore');
      const { useEnergyStore, MAX_GACHA } = await import('./energyStore');

      // Reset all user states to defaults
      useCollectionStore.setState({ cards: [], ipPoints: 0 });
      useBinderStore.setState({ binders: [], currentBinder: null });
      useEnergyStore.setState({
        gachaCount: MAX_GACHA,
        lastGachaTime: null,
        pityCountVol1: 0,
        pityCountVol2: 0,
        pityCountVol3: 0,
        pityCount: 0
      });

      // Clear local storage keys to ensure clean guest state
      localStorage.removeItem('goc-collection');
      localStorage.removeItem('goc-binders');
      localStorage.removeItem('goc-gacha-timer');
      localStorage.removeItem('goc-guest-dirty');
    } catch (err) {
      console.error('Error resetting store states on logout:', err);
    }
  },
}));
