import { ALL_CARDS } from './cards';

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  category: 'collection_size' | 'element_set' | 'rarity_set' | 'special';
  rewardType: 'bp_points' | 'gacha_ticket' | 'card';
  rewardAmount: number;
  rewardCardId?: string;
  rewardLabel: string;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Tier 1 - Pemula
  {
    key: 'maba_first_card',
    name: 'Mahasiswa Baru',
    description: 'Koleksi 1 kartu pertama Anda.',
    category: 'collection_size',
    rewardType: 'bp_points',
    rewardAmount: 10,
    rewardLabel: '10 BP Points'
  },
  {
    key: 'kolektor_muda',
    name: 'Kolektor Muda',
    description: 'Koleksi 10 kartu unik yang berbeda.',
    category: 'collection_size',
    rewardType: 'bp_points',
    rewardAmount: 25,
    rewardLabel: '25 BP Points'
  },
  
  // Tier 2 - Kolektor
  {
    key: 'setengah_jalan',
    name: 'Setengah Jalan',
    description: 'Koleksi 25 kartu unik yang berbeda.',
    category: 'collection_size',
    rewardType: 'bp_points',
    rewardAmount: 50,
    rewardLabel: '50 BP Points'
  },
  {
    key: 'kolektor_serius',
    name: 'Kolektor Serius',
    description: 'Koleksi 50 kartu unik yang berbeda.',
    category: 'collection_size',
    rewardType: 'gacha_ticket',
    rewardAmount: 1,
    rewardLabel: '1 Gacha Ticket + 100 BP' // We will add 1 ticket and bonus BP in the store/RPC
  },
  {
    key: 'ambis_komplet',
    name: 'Ambis Komplet',
    description: 'Koleksi semua 26 kartu beratribut Ambis.',
    category: 'element_set',
    rewardType: 'bp_points',
    rewardAmount: 75,
    rewardLabel: '75 BP Points'
  },
  {
    key: 'santuy_komplet',
    name: 'Santuy Komplet',
    description: 'Koleksi semua 40 kartu beratribut Santuy.',
    category: 'element_set',
    rewardType: 'bp_points',
    rewardAmount: 100,
    rewardLabel: '100 BP Points'
  },
  {
    key: 'bucin_komplet',
    name: 'Bucin Komplet',
    description: 'Koleksi semua 23 kartu beratribut Bucin.',
    category: 'element_set',
    rewardType: 'bp_points',
    rewardAmount: 75,
    rewardLabel: '75 BP Points'
  },
  {
    key: 'event_hunter',
    name: 'Event Hunter',
    description: 'Koleksi semua 5 kartu beratribut Event.',
    category: 'element_set',
    rewardType: 'bp_points',
    rewardAmount: 50,
    rewardLabel: '50 BP Points'
  },
  {
    key: 'item_collector',
    name: 'Item Collector',
    description: 'Koleksi semua 5 kartu beratribut Item.',
    category: 'element_set',
    rewardType: 'bp_points',
    rewardAmount: 50,
    rewardLabel: '50 BP Points'
  },

  // Tier 3 - Elite
  {
    key: 'rare_enthusiast',
    name: 'Rare Enthusiast',
    description: 'Koleksi semua kartu bertingkat Rare (21 kartu).',
    category: 'rarity_set',
    rewardType: 'bp_points',
    rewardAmount: 150,
    rewardLabel: '150 BP Points'
  },
  {
    key: 'sr_master',
    name: 'Super Rare Master',
    description: 'Koleksi semua kartu bertingkat Super Rare (9 kartu).',
    category: 'rarity_set',
    rewardType: 'gacha_ticket',
    rewardAmount: 1,
    rewardLabel: '1 Gacha Ticket + 200 BP'
  },
  {
    key: 'ur_collector',
    name: 'Ultra Collector',
    description: 'Koleksi semua kartu bertingkat Ultra Rare (6 kartu).',
    category: 'rarity_set',
    rewardType: 'gacha_ticket',
    rewardAmount: 2,
    rewardLabel: '2 Gacha Ticket + 300 BP'
  },
  {
    key: 'ipk_hampir_sempurna',
    name: 'IPK Hampir Sempurna',
    description: 'Koleksi 80 kartu unik yang berbeda.',
    category: 'collection_size',
    rewardType: 'bp_points',
    rewardAmount: 250,
    rewardLabel: '250 BP Points'
  },

  // Tier 4 - Legendaris
  {
    key: 'first_legendary',
    name: 'Pertama Kali Legendary!',
    description: 'Koleksi 1 kartu Exclusive Legendary pertama Anda.',
    category: 'special',
    rewardType: 'bp_points',
    rewardAmount: 100,
    rewardLabel: '100 BP Points'
  },
  {
    key: 'dewa_kampus',
    name: 'Dewa Kampus',
    description: 'Koleksi semua kartu Exclusive Legendary (13 kartu).',
    category: 'rarity_set',
    rewardType: 'gacha_ticket',
    rewardAmount: 3,
    rewardLabel: '3 Gacha Ticket + 500 BP'
  },
  {
    key: 'mythical_encounter',
    name: 'Mythical Encounter',
    description: 'Koleksi 1 kartu Special Mythical pertama Anda.',
    category: 'special',
    rewardType: 'bp_points',
    rewardAmount: 200,
    rewardLabel: '200 BP Points'
  },
  {
    key: 'mahaguru',
    name: 'Mahaguru GoC',
    description: 'Koleksi seluruh 98 kartu unik yang tersedia di database.',
    category: 'collection_size',
    rewardType: 'gacha_ticket',
    rewardAmount: 5,
    rewardLabel: '5 Gacha Ticket + 1000 BP'
  }
];

/**
 * Checks which achievements should be unlocked based on collection.
 * Returns only those definitions that are newly unlocked and not already in unlockedKeys.
 */
export function checkAchievements(ownedCards: any[], unlockedKeys: string[]): AchievementDefinition[] {
  // Get list of unique card_ids owned
  const uniqueOwnedIds = new Set<string>();
  ownedCards.forEach(c => {
    if (c.card_id) {
      uniqueOwnedIds.add(c.card_id);
    } else if (c.id && !c.id.includes('-')) { // fallback check
      uniqueOwnedIds.add(c.id);
    }
  });

  const uniqueOwnedCount = uniqueOwnedIds.size;
  const newlyUnlocked: AchievementDefinition[] = [];

  // Pre-calculate sets of card IDs by element/rarity from ALL_CARDS
  const ambisCardIds = ALL_CARDS.filter(c => c.element === 'Ambis').map(c => c.id);
  const santuyCardIds = ALL_CARDS.filter(c => c.element === 'Santuy').map(c => c.id);
  const bucinCardIds = ALL_CARDS.filter(c => c.element === 'Bucin').map(c => c.id);
  const eventCardIds = ALL_CARDS.filter(c => c.element === 'Event').map(c => c.id);
  const itemCardIds = ALL_CARDS.filter(c => c.element === 'Item').map(c => c.id);

  const rareCardIds = ALL_CARDS.filter(c => c.rarity === 'Rare').map(c => c.id);
  const srCardIds = ALL_CARDS.filter(c => c.rarity === 'Super Rare').map(c => c.id);
  const urCardIds = ALL_CARDS.filter(c => c.rarity === 'Ultra Rare').map(c => c.id);
  const legendaryCardIds = ALL_CARDS.filter(c => c.rarity === 'Exclusive Legendary').map(c => c.id);
  const mythicalCardIds = ALL_CARDS.filter(c => c.rarity === 'Special Mythical').map(c => c.id);

  const hasAll = (requiredIds: string[]) => requiredIds.every(id => uniqueOwnedIds.has(id));
  const hasAny = (requiredIds: string[]) => requiredIds.some(id => uniqueOwnedIds.has(id));

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    // Skip if already unlocked
    if (unlockedKeys.includes(def.key)) continue;

    let isUnlocked = false;

    switch (def.key) {
      case 'maba_first_card':
        isUnlocked = uniqueOwnedCount >= 1;
        break;
      case 'kolektor_muda':
        isUnlocked = uniqueOwnedCount >= 10;
        break;
      case 'setengah_jalan':
        isUnlocked = uniqueOwnedCount >= 25;
        break;
      case 'kolektor_serius':
        isUnlocked = uniqueOwnedCount >= 50;
        break;
      case 'ipk_hampir_sempurna':
        isUnlocked = uniqueOwnedCount >= 80;
        break;
      case 'mahaguru':
        isUnlocked = uniqueOwnedCount >= ALL_CARDS.length;
        break;

      case 'ambis_komplet':
        isUnlocked = hasAll(ambisCardIds);
        break;
      case 'santuy_komplet':
        isUnlocked = hasAll(santuyCardIds);
        break;
      case 'bucin_komplet':
        isUnlocked = hasAll(bucinCardIds);
        break;
      case 'event_hunter':
        isUnlocked = hasAll(eventCardIds);
        break;
      case 'item_collector':
        isUnlocked = hasAll(itemCardIds);
        break;

      case 'rare_enthusiast':
        isUnlocked = hasAll(rareCardIds);
        break;
      case 'sr_master':
        isUnlocked = hasAll(srCardIds);
        break;
      case 'ur_collector':
        isUnlocked = hasAll(urCardIds);
        break;
      case 'dewa_kampus':
        isUnlocked = hasAll(legendaryCardIds);
        break;

      case 'first_legendary':
        isUnlocked = hasAny(legendaryCardIds);
        break;
      case 'mythical_encounter':
        isUnlocked = hasAny(mythicalCardIds);
        break;
    }

    if (isUnlocked) {
      newlyUnlocked.push(def);
    }
  }

  return newlyUnlocked;
}
