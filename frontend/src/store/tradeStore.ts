import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ALL_CARDS, type CardData } from '../data/cards';

export interface Friend {
  id: string; // friendship record ID
  friendProfileId: string; // friend's profile UUID
  username: string;
  email: string;
  friendCode: string;
  status: 'pending' | 'accepted';
  isSender: boolean; // did I send the request?
}

export interface TradeItem {
  id: string;
  ownedCardId: string;
  userId: string;
  card: CardData;
}

export interface Trade {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  items: TradeItem[];
}

interface TradeState {
  friends: Friend[];
  loading: boolean;
  error: string | null;
  trades: Trade[];
  friendCode: string | null;

  fetchFriendCode: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  sendFriendRequest: (code: string) => Promise<void>;
  respondFriendRequest: (friendshipId: string, accept: boolean) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  
  fetchTrades: () => Promise<void>;
  createTradeOffer: (receiverId: string, senderCardIds: string[], receiverCardIds: string[]) => Promise<void>;
  acceptTradeOffer: (tradeId: string) => Promise<boolean>;
  declineTradeOffer: (tradeId: string) => Promise<void>;
  cancelTradeOffer: (tradeId: string) => Promise<void>;
  fetchFriendCollection: (friendId: string) => Promise<any[]>;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  friends: [],
  loading: false,
  error: null,
  trades: [],
  friendCode: null,

  fetchFriendCode: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('friend_code')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      set({ friendCode: data?.friend_code || null });
    } catch (err: any) {
      console.error('Error fetching friend code:', err);
    }
  },

  fetchFriends: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ loading: true, error: null });
    try {
      // Get all friendships where user is sender or receiver
      const { data: rawFriends, error } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          senderProfile:profiles!friends_user_id_fkey(id, username, friend_code),
          receiverProfile:profiles!friends_friend_id_fkey(id, username, friend_code)
        `);

      if (error) throw error;

      const mappedFriends: Friend[] = (rawFriends || []).map((f: any) => {
        const isSender = f.user_id === user.id;
        const profile = isSender ? f.receiverProfile : f.senderProfile;

        return {
          id: f.id,
          friendProfileId: profile.id,
          username: profile.username || 'Mahasiswa',
          email: '',
          friendCode: profile.friend_code || '',
          status: f.status,
          isSender,
        };
      });

      set({ friends: mappedFriends, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal memuat teman', loading: false });
    }
  },

  sendFriendRequest: async (code: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const cleanCode = code.trim().toUpperCase();
    set({ error: null, loading: true });

    try {
      // 1. Fetch target profile
      const { data: targetProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, friend_code')
        .eq('friend_code', cleanCode)
        .single();

      if (profileErr || !targetProfile) {
        throw new Error('Kode teman tidak ditemukan');
      }

      if (targetProfile.id === user.id) {
        throw new Error('Kamu tidak bisa berteman dengan dirimu sendiri');
      }

      // 2. Insert into friends table
      const { error: insertErr } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: targetProfile.id,
          status: 'pending'
        });

      if (insertErr) {
        if (insertErr.code === '23505') {
          throw new Error('Permintaan pertemanan sudah dikirim atau sudah berteman');
        }
        throw insertErr;
      }

      // Refresh list
      await get().fetchFriends();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal mengirim permintaan', loading: false });
      throw err;
    }
  },

  respondFriendRequest: async (friendshipId: string, accept: boolean) => {
    set({ loading: true, error: null });
    try {
      if (accept) {
        const { error } = await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('id', friendshipId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('friends')
          .delete()
          .eq('id', friendshipId);
        if (error) throw error;
      }
      await get().fetchFriends();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal merespons permintaan', loading: false });
      throw err;
    }
  },

  removeFriend: async (friendshipId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);
      if (error) throw error;
      await get().fetchFriends();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal menghapus teman', loading: false });
      throw err;
    }
  },

  fetchTrades: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ loading: true, error: null });
    try {
      // Fetch trades
      const { data: rawTrades, error } = await supabase
        .from('trades')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          senderProfile:profiles!trades_sender_id_fkey(username),
          receiverProfile:profiles!trades_receiver_id_fkey(username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tradeList: Trade[] = [];

      for (const t of rawTrades || []) {
        // Fetch items in this trade
        const { data: rawItems, error: itemsErr } = await supabase
          .from('trade_items')
          .select(`
            id,
            owned_card_id,
            user_id
          `)
          .eq('trade_id', t.id);

        if (itemsErr) throw itemsErr;

        // Fetch card details for items by querying owned_cards or matching with ALL_CARDS
        const detailedItems: TradeItem[] = [];

        for (const item of rawItems || []) {
          // Since RLS allows viewing own + friends' cards, we can query owned_cards by id
          const { data: dbCard } = await supabase
            .from('owned_cards')
            .select('card_id')
            .eq('id', item.owned_card_id)
            .single();

          const cardId = dbCard?.card_id;
          const baseCard = ALL_CARDS.find((c) => c.id === cardId);

          if (baseCard) {
            detailedItems.push({
              id: item.id,
              ownedCardId: item.owned_card_id,
              userId: item.user_id,
              card: baseCard
            });
          }
        }

        tradeList.push({
          id: t.id,
          senderId: t.sender_id,
          receiverId: t.receiver_id,
          senderName: (Array.isArray(t.senderProfile) ? (t.senderProfile as any)[0]?.username : (t.senderProfile as any)?.username) || 'Mahasiswa',
          receiverName: (Array.isArray(t.receiverProfile) ? (t.receiverProfile as any)[0]?.username : (t.receiverProfile as any)?.username) || 'Mahasiswa',
          status: t.status,
          createdAt: t.created_at,
          items: detailedItems
        });
      }

      set({ trades: tradeList, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal memuat trade', loading: false });
    }
  },

  createTradeOffer: async (receiverId: string, senderCardIds: string[], receiverCardIds: string[]) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.rpc('send_trade_offer', {
        p_receiver_id: receiverId,
        p_sender_card_ids: senderCardIds,
        p_receiver_card_ids: receiverCardIds
      });

      if (error) throw error;
      await get().fetchTrades();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal mengirim penawaran', loading: false });
      throw err;
    }
  },

  acceptTradeOffer: async (tradeId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('accept_trade_offer', {
        p_trade_id: tradeId
      });

      if (error) throw error;
      
      // Sync local collections after swap
      const { useCollectionStore } = await import('./collectionStore');
      await useCollectionStore.getState().fetchCollection();
      
      await get().fetchTrades();
      set({ loading: false });
      return data === true;
    } catch (err: any) {
      set({ error: err.message || 'Gagal menerima trade', loading: false });
      throw err;
    }
  },

  declineTradeOffer: async (tradeId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('trades')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', tradeId);

      if (error) throw error;
      await get().fetchTrades();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal menolak trade', loading: false });
      throw err;
    }
  },

  cancelTradeOffer: async (tradeId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('trades')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', tradeId);

      if (error) throw error;
      await get().fetchTrades();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Gagal membatalkan trade', loading: false });
      throw err;
    }
  },

  fetchFriendCollection: async (friendId: string) => {
    try {
      const { data, error } = await supabase
        .from('owned_cards')
        .select('id, card_id, volume')
        .eq('user_id', friendId);

      if (error) throw error;

      return (data || []).map((dbCard) => {
        const baseCard = ALL_CARDS.find((c) => c.id === dbCard.card_id);
        return {
          ...(baseCard || {}),
          id: dbCard.id,
          card_id: dbCard.card_id,
          volume: dbCard.volume
        };
      }).filter(c => c.name !== undefined);
    } catch (err) {
      console.error('Error fetching friend collection:', err);
      return [];
    }
  }
}));
