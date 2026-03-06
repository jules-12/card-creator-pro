import { Contributor } from '@/types/contributor';

const STORAGE_KEY = 'savedCards';

export interface SavedCardSet {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  cards: Contributor[];
}

export const saveCards = (userId: string, name: string, cards: Contributor[]): SavedCardSet => {
  const existingSets = getSavedCardSets(userId);
  
  const newSet: SavedCardSet = {
    id: `set_${Date.now()}`,
    name,
    userId,
    createdAt: new Date().toISOString(),
    cards,
  };

  existingSets.push(newSet);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existingSets));
  
  return newSet;
};

export const getSavedCardSets = (userId: string): SavedCardSet[] => {
  const allSets: SavedCardSet[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return allSets.filter(set => set.userId === userId);
};

export const getCardSetById = (setId: string): SavedCardSet | null => {
  const allSets: SavedCardSet[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return allSets.find(set => set.id === setId) || null;
};

export const deleteCardSet = (setId: string): void => {
  const allSets: SavedCardSet[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const filtered = allSets.filter(set => set.id !== setId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const updateCardSet = (setId: string, updates: Partial<SavedCardSet>): void => {
  const allSets: SavedCardSet[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const index = allSets.findIndex(set => set.id === setId);
  if (index !== -1) {
    allSets[index] = { ...allSets[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSets));
  }
};
