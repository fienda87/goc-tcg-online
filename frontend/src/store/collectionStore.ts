import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CollectionState {
  cards: any[];
  setCards: (cards: any[]) => void;
  ipPoints: number;
  addIpPoints: (amount: number) => void;
  deductIpPoints: (amount: number) => void;
  extractCard: (cardName: string, countToExtract: number, pointsPerCard: number) => void;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set) => ({
      cards: [],
      setCards: (cards) => set({ cards }),
      ipPoints: 0,
      addIpPoints: (amount) => set((state) => ({ ipPoints: state.ipPoints + amount })),
      deductIpPoints: (amount) => set((state) => ({ ipPoints: Math.max(0, state.ipPoints - amount) })),
      extractCard: (cardName, countToExtract, pointsPerCard) => set((state) => {
        let removedCount = 0;
        const newCards = state.cards.filter((card) => {
          if (card.name === cardName && removedCount < countToExtract) {
            removedCount++;
            return false;
          }
          return true;
        });
        const pointsAdded = countToExtract * pointsPerCard;
        return {
          cards: newCards,
          ipPoints: state.ipPoints + pointsAdded
        };
      }),
    }),
    {
      name: 'goc-collection', // name of the item in the storage (must be unique)
    }
  )
);
