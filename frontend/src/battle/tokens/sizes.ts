export const BATTLE_SIZES = {
  card: {
    active: { w: 100, h: 140 },
    bench: { w: 72, h: 100 },
    hand: { w: 86, h: 120 },
    opponentActive: { w: 80, h: 112 },
    opponentBench: { w: 58, h: 82 },
  },
  benchGap: 8,
} as const;

export type CardVariant =
  | 'active-player'
  | 'active-opponent'
  | 'bench-player'
  | 'bench-opponent'
  | 'hand';

export function getCardDimensions(variant: CardVariant) {
  switch (variant) {
    case 'active-player':
      return BATTLE_SIZES.card.active;
    case 'active-opponent':
      return BATTLE_SIZES.card.opponentActive;
    case 'bench-player':
      return BATTLE_SIZES.card.bench;
    case 'bench-opponent':
      return BATTLE_SIZES.card.opponentBench;
    case 'hand':
      return BATTLE_SIZES.card.hand;
  }
}
