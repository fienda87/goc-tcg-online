import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useCollectionStore } from './collectionStore';
import { useEnergyStore } from './energyStore';
import { ALL_CARDS, type CardData } from '../data/cards';

export interface MailboxMessage {
  id: string;
  userId: string;
  title: string;
  body: string;
  rewardType: 'none' | 'bp_points' | 'gacha_ticket' | 'card';
  rewardAmount: number;
  rewardCardId: string | null;
  isClaimed: boolean;
  createdAt: string;
  expiresAt: string;
  cardDetail?: CardData | null;
}

interface MailboxState {
  messages: MailboxMessage[];
  loading: boolean;
  error: string | null;
  fetchMessages: () => Promise<void>;
  claimReward: (messageId: string) => Promise<boolean>;
  claimAllRewards: () => Promise<{ successCount: number; failedCount: number }>;
  getUnreadCount: () => number;
}

export const useMailboxStore = create<MailboxState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,

  fetchMessages: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Guest mode - no mailbox

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('mailbox')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: MailboxMessage[] = (data || []).map(m => {
        const cardDetail = m.reward_card_id ? ALL_CARDS.find(c => c.id === m.reward_card_id) : null;
        return {
          id: m.id,
          userId: m.user_id,
          title: m.title,
          body: m.body,
          rewardType: m.reward_type,
          rewardAmount: m.reward_amount,
          rewardCardId: m.reward_card_id,
          isClaimed: m.is_claimed,
          createdAt: m.created_at,
          expiresAt: m.expires_at,
          cardDetail
        };
      });

      set({ messages: formatted, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal memuat pesan', loading: false });
    }
  },

  claimReward: async (messageId: string) => {
    const msg = get().messages.find(m => m.id === messageId);
    if (!msg || msg.isClaimed) return false;

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('claim_mailbox_reward', {
        p_message_id: messageId
      });

      if (error) throw error;

      // Update local stores based on claim success
      if (data && data[0]?.success) {
        // Reload collection and energy state
        await useCollectionStore.getState().fetchCollection();
        await useEnergyStore.getState().fetchEnergy();

        // Refresh current store messages
        await get().fetchMessages();
        set({ loading: false });
        return true;
      }
      
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Gagal mengklaim hadiah', loading: false });
      return false;
    }
  },

  claimAllRewards: async () => {
    const unclaimed = get().messages.filter(m => !m.isClaimed && m.rewardType !== 'none');
    if (unclaimed.length === 0) return { successCount: 0, failedCount: 0 };

    set({ loading: true, error: null });
    let successCount = 0;
    let failedCount = 0;

    for (const msg of unclaimed) {
      try {
        const { data, error } = await supabase.rpc('claim_mailbox_reward', {
          p_message_id: msg.id
        });
        if (error || !data || !data[0]?.success) {
          failedCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        failedCount++;
      }
    }

    // Refresh states after batch claim
    await useCollectionStore.getState().fetchCollection();
    await useEnergyStore.getState().fetchEnergy();
    await get().fetchMessages();

    set({ loading: false });
    return { successCount, failedCount };
  },

  getUnreadCount: () => {
    return get().messages.filter(m => !m.isClaimed).length;
  }
}));
