import { Contributor } from '@/types/contributor';

const STORAGE_KEY = 'savedCards';

export interface SavedCardSet {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  cards: Contributor[];
}

/** Read all sets from localStorage (DRY helper). */
const readAllSets = (): SavedCardSet[] =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

/** Write all sets to localStorage (DRY helper). */
const writeAllSets = (sets: SavedCardSet[]): void =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));

export const saveCards = (userId: string, name: string, cards: Contributor[]): SavedCardSet => {
  const sets = readAllSets();
  const newSet: SavedCardSet = {
    id: `set_${Date.now()}`,
    name,
    userId,
    createdAt: new Date().toISOString(),
    cards,
  };
  sets.push(newSet);
  writeAllSets(sets);
  return newSet;
};

export const getSavedCardSets = (userId: string): SavedCardSet[] =>
  readAllSets().filter(set => set.userId === userId);

export const getCardSetById = (setId: string): SavedCardSet | null =>
  readAllSets().find(set => set.id === setId) || null;

export const deleteCardSet = (setId: string): void =>
  writeAllSets(readAllSets().filter(set => set.id !== setId));

export const updateCardSet = (setId: string, updates: Partial<SavedCardSet>): void => {
  const sets = readAllSets();
  const index = sets.findIndex(set => set.id === setId);
  if (index !== -1) {
    sets[index] = { ...sets[index], ...updates };
    writeAllSets(sets);
  }
};
