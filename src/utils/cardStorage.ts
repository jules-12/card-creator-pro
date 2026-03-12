import { Contributor } from '@/types/contributor';

const STORAGE_KEY = 'savedCards';

export interface SavedCardSet {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  cards: Contributor[];
}

/** Read all saved card sets from localStorage. */
const readAllSets = (): SavedCardSet[] =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

/** Persist all sets back to localStorage. */
const writeAllSets = (sets: SavedCardSet[]): void =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));

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
  // Write all sets (not just user's) to avoid losing other users' data
  const allSets = readAllSets().filter(s => s.userId !== userId);
  writeAllSets([...allSets, ...existingSets]);
  return newSet;
};

export const getSavedCardSets = (userId: string): SavedCardSet[] =>
  readAllSets().filter(set => set.userId === userId);

export const getCardSetById = (setId: string): SavedCardSet | null =>
  readAllSets().find(set => set.id === setId) || null;

export const deleteCardSet = (setId: string): void => {
  writeAllSets(readAllSets().filter(set => set.id !== setId));
};

export const updateCardSet = (setId: string, updates: Partial<SavedCardSet>): void => {
  const allSets = readAllSets();
  const index = allSets.findIndex(set => set.id === setId);
  if (index !== -1) {
    allSets[index] = { ...allSets[index], ...updates };
    writeAllSets(allSets);
  }
};
