/**
 * Configuration centralisée pour l'API backend.
 * Basculer USE_MOCK à false et définir BASE_URL pour connecter Laravel.
 */
export const API_CONFIG = {
  /** URL de base de l'API Laravel (ex: https://api.example.com/api) */
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',

  /** true = données locales (localStorage), false = appels API réels */
  USE_MOCK: true,

  /** Timeout des requêtes en ms */
  TIMEOUT: 15_000,
} as const;
