import { API_CONFIG } from '@/config/api';
import { http } from './httpClient';
import { Contributor } from '@/types/contributor';
import {
  SavedCardSet,
  saveCards as localSave,
  getSavedCardSets as localGetSets,
  getCardSetById as localGetById,
  deleteCardSet as localDelete,
  updateCardSet as localUpdate,
} from '@/utils/cardStorage';

/**
 * Service de gestion des jeux de cartes.
 * Bascule automatiquement entre localStorage (mock) et API Laravel.
 */
export const cardService = {
  async saveCards(userId: string, name: string, cards: Contributor[]): Promise<SavedCardSet> {
    if (API_CONFIG.USE_MOCK) {
      return localSave(userId, name, cards);
    }
    return http.post<SavedCardSet>('/card-sets', { name, cards });
  },

  async getCardSets(userId: string): Promise<SavedCardSet[]> {
    if (API_CONFIG.USE_MOCK) {
      return localGetSets(userId);
    }
    return http.get<SavedCardSet[]>('/card-sets');
  },

  async getCardSetById(setId: string): Promise<SavedCardSet | null> {
    if (API_CONFIG.USE_MOCK) {
      return localGetById(setId);
    }
    try {
      return await http.get<SavedCardSet>(`/card-sets/${setId}`);
    } catch {
      return null;
    }
  },

  async deleteCardSet(setId: string): Promise<void> {
    if (API_CONFIG.USE_MOCK) {
      localDelete(setId);
      return;
    }
    await http.delete(`/card-sets/${setId}`);
  },

  async updateCardSet(setId: string, updates: Partial<SavedCardSet>): Promise<void> {
    if (API_CONFIG.USE_MOCK) {
      localUpdate(setId, updates);
      return;
    }
    await http.patch(`/card-sets/${setId}`, updates);
  },
};
