import * as XLSX from 'xlsx';
import { Contributor, ParsedExcelData } from '@/types/contributor';

// Normaliser les noms de colonnes pour être plus tolérant
const normalizeColumnName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]/g, ''); // Garder seulement lettres et chiffres
};

// Mapping des colonnes possibles
const columnMappings: Record<string, string[]> = {
  npc: ['nnpc', 'npc', 'numero', 'numeronpc', 'no', 'n'],
  nom: ['nom', 'name', 'lastname', 'nomdefamille'],
  prenoms: ['prenoms', 'prenom', 'firstname', 'firstnames', 'prénoms', 'prénom'],
  telephone: ['telephone', 'tel', 'phone', 'mobile', 'téléphone', 'tél'],
  arrondissement: ['arrondissement', 'district', 'quartier', 'zone', 'arr'],
};

const findColumnKey = (header: string): string | null => {
  const normalized = normalizeColumnName(header);
  
  for (const [key, variants] of Object.entries(columnMappings)) {
    if (variants.some(v => normalized.includes(v) || v.includes(normalized))) {
      return key;
    }
  }
  return null;
};

export const parseExcelFile = (file: File): Promise<ParsedExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Prendre la première feuille
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        if (jsonData.length < 2) {
          resolve({
            contributors: [],
            errors: ['Le fichier est vide ou ne contient pas de données'],
            totalRows: 0,
          });
          return;
        }

        // Trouver les indices des colonnes
        const headers = jsonData[0] as string[];
        const columnIndices: Record<string, number> = {};

        headers.forEach((header, index) => {
          if (header) {
            const key = findColumnKey(String(header));
            if (key && columnIndices[key] === undefined) {
              columnIndices[key] = index;
            }
          }
        });

        const contributors: Contributor[] = [];
        const errors: string[] = [];

        // Parser chaque ligne de données
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Ignorer les lignes complètement vides
          if (!row || row.every(cell => !cell)) {
            continue;
          }

          const getValue = (key: string): string => {
            const index = columnIndices[key];
            if (index !== undefined && row[index] !== undefined && row[index] !== null) {
              return String(row[index]).trim();
            }
            return '–';
          };

          const contributor: Contributor = {
            id: `contrib-${i}-${Date.now()}`,
            npc: getValue('npc'),
            nom: getValue('nom'),
            prenoms: getValue('prenoms'),
            telephone: getValue('telephone'),
            arrondissement: getValue('arrondissement'),
          };

          contributors.push(contributor);
        }

        resolve({
          contributors,
          errors,
          totalRows: jsonData.length - 1,
        });
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier Excel'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsBinaryString(file);
  });
};

// Données de test
export const generateTestData = (): Contributor[] => {
  return [
    {
      id: 'test-1',
      npc: 'NPC-2024-001',
      nom: 'AHOUANDJINOU',
      prenoms: 'Pierre Marie',
      telephone: '97 00 11 22',
      arrondissement: 'Akpakpa',
    },
    {
      id: 'test-2',
      npc: 'NPC-2024-002',
      nom: 'HOUNGBEDJI',
      prenoms: 'Jeanne',
      telephone: '96 33 44 55',
      arrondissement: 'Cadjèhoun',
    },
    {
      id: 'test-3',
      npc: 'NPC-2024-003',
      nom: 'ZINSOU',
      prenoms: 'Emmanuel',
      telephone: '95 66 77 88',
      arrondissement: 'Fidjrossè',
    },
    {
      id: 'test-4',
      npc: 'NPC-2024-004',
      nom: 'AGBANGLA',
      prenoms: 'Félicité',
      telephone: '94 99 00 11',
      arrondissement: 'Godomey',
    },
    {
      id: 'test-5',
      npc: 'NPC-2024-005',
      nom: 'SODJI',
      prenoms: 'André',
      telephone: '–',
      arrondissement: 'Agla',
    },
  ];
};
