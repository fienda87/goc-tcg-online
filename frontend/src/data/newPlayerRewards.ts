export interface NewPlayerReward {
  day: number;
  type: 'bp_points' | 'gacha_ticket' | 'card';
  amount: number;
  label: string;
  description: string;
  volumeInfo?: number; // e.g. 3 for Vol 3, or undefined for general/multiple
}

export const NEW_PLAYER_REWARDS: NewPlayerReward[] = [
  { 
    day: 1, 
    type: 'bp_points', 
    amount: 20, 
    label: '20 BP Points', 
    description: 'BP tambahan untuk modal awal belanja kartu.' 
  },
  { 
    day: 2, 
    type: 'gacha_ticket', 
    amount: 1, 
    label: '1 Tiket Gacha (Vol 3)', 
    description: 'Tiket gratis untuk membuka Booster Pack Volume 3.',
    volumeInfo: 3
  },
  { 
    day: 3, 
    type: 'bp_points', 
    amount: 25, 
    label: '25 BP Points', 
    description: 'BP ekstra untuk tabungan koleksi Anda.' 
  },
  { 
    day: 4, 
    type: 'bp_points', 
    amount: 30, 
    label: '30 BP Points', 
    description: 'Saldo BP terus bertambah untuk memperkuat deck.' 
  },
  { 
    day: 5, 
    type: 'gacha_ticket', 
    amount: 2, 
    label: '2 Tiket Gacha (Vol 1 & 2)', 
    description: 'Tiket gratis untuk Booster Pack Volume 1 & Volume 2.'
  },
  { 
    day: 6, 
    type: 'bp_points', 
    amount: 30, 
    label: '30 BP Points', 
    description: 'Persiapan akhir BP sebelum bonus puncak legendaris.' 
  },
  { 
    day: 7, 
    type: 'card', 
    amount: 1, 
    label: 'Pilih Kartu Legendary', 
    description: 'Hadiah utama! Pilih 1 kartu Exclusive Legendary favorit Anda.' 
  }
];
