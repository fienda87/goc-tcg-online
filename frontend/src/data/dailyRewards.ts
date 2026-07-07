export interface DailyReward {
  day: number;
  type: 'bp_points' | 'gacha_ticket' | 'card';
  amount: number;
  label: string;
  isMilestone: boolean;
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, type: 'bp_points', amount: 5, label: '5 BP', isMilestone: false },
  { day: 2, type: 'bp_points', amount: 5, label: '5 BP', isMilestone: false },
  { day: 3, type: 'bp_points', amount: 10, label: '10 BP', isMilestone: false },
  { day: 4, type: 'bp_points', amount: 5, label: '5 BP', isMilestone: false },
  { day: 5, type: 'bp_points', amount: 10, label: '10 BP', isMilestone: false },
  { day: 6, type: 'bp_points', amount: 10, label: '10 BP', isMilestone: false },
  { day: 7, type: 'gacha_ticket', amount: 1, label: '1 Tiket Gacha', isMilestone: true },
  
  { day: 8, type: 'bp_points', amount: 10, label: '10 BP', isMilestone: false },
  { day: 9, type: 'bp_points', amount: 10, label: '10 BP', isMilestone: false },
  { day: 10, type: 'bp_points', amount: 15, label: '15 BP', isMilestone: false },
  { day: 11, type: 'bp_points', amount: 10, label: '10 BP', isMilestone: false },
  { day: 12, type: 'bp_points', amount: 15, label: '15 BP', isMilestone: false },
  { day: 13, type: 'bp_points', amount: 15, label: '15 BP', isMilestone: false },
  { day: 14, type: 'gacha_ticket', amount: 2, label: '2 Tiket Gacha', isMilestone: true },

  { day: 15, type: 'bp_points', amount: 15, label: '15 BP', isMilestone: false },
  { day: 16, type: 'bp_points', amount: 20, label: '20 BP', isMilestone: false },
  { day: 17, type: 'bp_points', amount: 15, label: '15 BP', isMilestone: false },
  { day: 18, type: 'bp_points', amount: 20, label: '20 BP', isMilestone: false },
  { day: 19, type: 'bp_points', amount: 20, label: '20 BP', isMilestone: false },
  { day: 20, type: 'bp_points', amount: 25, label: '25 BP', isMilestone: false },
  { day: 21, type: 'gacha_ticket', amount: 3, label: '3 Tiket + 50 BP', isMilestone: true },

  { day: 22, type: 'bp_points', amount: 25, label: '25 BP', isMilestone: false },
  { day: 23, type: 'bp_points', amount: 25, label: '25 BP', isMilestone: false },
  { day: 24, type: 'bp_points', amount: 30, label: '30 BP', isMilestone: false },
  { day: 25, type: 'bp_points', amount: 30, label: '30 BP', isMilestone: false },
  { day: 26, type: 'bp_points', amount: 30, label: '30 BP', isMilestone: false },
  { day: 27, type: 'bp_points', amount: 35, label: '35 BP', isMilestone: false },
  { day: 28, type: 'gacha_ticket', amount: 3, label: '3 Tiket + 100 BP', isMilestone: true },

  { day: 29, type: 'bp_points', amount: 50, label: '50 BP', isMilestone: false },
  { day: 30, type: 'card', amount: 1, label: 'Pilih Legendary', isMilestone: true }
];
