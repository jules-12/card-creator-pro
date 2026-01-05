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

// Mapping des colonnes possibles (normalisées via normalizeColumnName)
// Objectif: tolérance maximale aux variations: accents, ponctuation, "N°", pluriels, etc.
const columnMappings: Record<string, string[]> = {
  npc: [
    'npc',
    'nnpc',
    'numeronpc',
    'numnpc',
    'numcontribuable',
    'matricule',
    'idnpc',
  ],
  nom: ['nom', 'nomdefamille', 'familyname', 'lastname', 'surname'],
  prenoms: ['prenom', 'prenoms', 'firstname', 'givenname', 'given'],
  telephone: ['telephone', 'tel', 'phone', 'mobile', 'portable', 'gsm', 'numtel', 'phonenumber'],
  arrondissement: ['arrondissement', 'arrond', 'arr', 'quartier', 'district', 'zone', 'arrondisment'],
};

const findColumnKey = (header: string): string | null => {
  const normalizedHeader = normalizeColumnName(header);
  if (!normalizedHeader) return null;

  // 1) Priorité aux correspondances exactes (évite "nom" qui match "prenoms")
  for (const [key, variants] of Object.entries(columnMappings)) {
    for (const variant of variants) {
      const normalizedVariant = normalizeColumnName(variant);
      if (normalizedVariant && normalizedHeader === normalizedVariant) return key;
    }
  }

  // 2) Correspondances partielles (uniquement sur des variantes assez longues)
  for (const [key, variants] of Object.entries(columnMappings)) {
    for (const variant of variants) {
      const normalizedVariant = normalizeColumnName(variant);
      if (!normalizedVariant) continue;

      // Évite les collisions sur des mots trop courts (ex: "nom" dans "prenoms")
      if (normalizedVariant.length < 4 || normalizedHeader.length < 4) continue;

      if (normalizedHeader.includes(normalizedVariant)) return key;
      if (normalizedVariant.includes(normalizedHeader)) return key;
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
        if (!data) throw new Error('Aucune donnée à lire');

        // XLSX est plus stable avec Uint8Array
        const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array([]);
        const workbook = XLSX.read(bytes, { type: 'array' });

        // Choisir la feuille la plus "remplie" (certains fichiers ont la première feuille vide)
        const pickBestSheetName = (): string => {
          let best = workbook.SheetNames[0];
          let bestRows = -1;
          for (const name of workbook.SheetNames) {
            const ws = workbook.Sheets[name];
            const ref = ws?.['!ref'];
            if (!ref) continue;
            const range = XLSX.utils.decode_range(ref);
            const rows = range.e.r - range.s.r + 1;
            if (rows > bestRows) {
              bestRows = rows;
              best = name;
            }
          }
          return best;
        };

        const sheetName = pickBestSheetName();
        const worksheet = workbook.Sheets[sheetName];

        // Convertir en tableau (lignes/colonnes)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
        }) as unknown[][];
        
        if (jsonData.length < 2) {
          resolve({
            contributors: [],
            errors: ['Le fichier est vide ou ne contient pas de données'],
            totalRows: 0,
          });
          return;
        }

        // Détecter automatiquement la ligne d'en-tête (certains fichiers ont un titre en 1ère ligne)
        const maxScanRows = Math.min(10, jsonData.length);
        let headerRowIndex = 0;
        let bestScore = -1;

        for (let r = 0; r < maxScanRows; r++) {
          const row = jsonData[r];
          if (!row) continue;

          const keys = new Set<string>();
          for (const cell of row) {
            if (cell === undefined || cell === null) continue;

            const raw = String(cell).trim();
            if (!raw) continue;

            // Support d'entêtes "fusionnés" ou concaténés (ex: "N° NPC, email, Nom, Prénom, ...")
            const parts = /[,;|\t]/.test(raw)
              ? raw.split(/[,;|\t]+/).map((s) => s.trim()).filter(Boolean)
              : [raw];

            for (const part of parts) {
              const key = findColumnKey(part);
              if (key) keys.add(key);
            }
          }

          if (keys.size > bestScore) {
            bestScore = keys.size;
            headerRowIndex = r;
          }
        }

        // Trouver les indices des colonnes
        const rawHeaderRow = (jsonData[headerRowIndex] || []) as unknown[];
        const columnIndices: Record<string, number> = {};

        // Cas: en-têtes fusionnés dans une seule cellule (ex: "N° NPC, email, Nom, Prénom, ...")
        const nonEmptyHeaderCells = rawHeaderRow
          .map((c) => (c === undefined || c === null ? '' : String(c).trim()))
          .filter((s) => s.length > 0);

        if (
          nonEmptyHeaderCells.length === 1 &&
          /[,;|\t]/.test(nonEmptyHeaderCells[0])
        ) {
          const parts = nonEmptyHeaderCells[0]
            .split(/[,;|\t]+/)
            .map((s) => s.trim())
            .filter(Boolean);

          parts.forEach((part, index) => {
            const key = findColumnKey(part);
            if (key && columnIndices[key] === undefined) {
              columnIndices[key] = index;
            }
          });
        } else {
          rawHeaderRow.forEach((headerCell, index) => {
            if (headerCell === undefined || headerCell === null) return;

            const raw = String(headerCell).trim();
            if (!raw) return;

            // Support: plusieurs libellés dans la même cellule (ex: cellule fusionnée "Nom, Prénom")
            const parts = /[,;|\t]/.test(raw)
              ? raw.split(/[,;|\t]+/).map((s) => s.trim()).filter(Boolean)
              : [raw];

            parts.forEach((part, offset) => {
              const key = findColumnKey(part);
              if (key && columnIndices[key] === undefined) {
                columnIndices[key] = index + offset;
              }
            });
          });
        }

        // Fallback dédié pour "Prénom/Prénoms" (colonne souvent mal détectée à cause de collisions)
        if (columnIndices.prenoms === undefined) {
          for (let i = 0; i < rawHeaderRow.length; i++) {
            const cell = rawHeaderRow[i];
            if (cell === undefined || cell === null) continue;
            const normalized = normalizeColumnName(String(cell));
            if (normalized.includes('prenom')) {
              columnIndices.prenoms = i;
              break;
            }
          }
        }

        const contributors: Contributor[] = [];
        const errors: string[] = [];

        if (import.meta.env.DEV) {
          // Debug utile quand l'import ne reconnaît pas les entêtes
          // eslint-disable-next-line no-console
          console.log('[excelParser] sheet:', sheetName);
          // eslint-disable-next-line no-console
          console.log('[excelParser] headerRowIndex:', headerRowIndex, 'raw:', jsonData[headerRowIndex]);
          // eslint-disable-next-line no-console
          console.log('[excelParser] columnIndices:', columnIndices);
          // eslint-disable-next-line no-console
          console.log('[excelParser] firstDataRow:', jsonData[headerRowIndex + 1]);
        }

        // Informer si des colonnes attendues ne sont pas détectées (sans bloquer la génération)
        const requiredKeys = ['npc', 'nom', 'prenoms', 'telephone', 'arrondissement'] as const;
        const missing = requiredKeys.filter((k) => columnIndices[k] === undefined);
        if (missing.length > 0) {
          errors.push(
            `Colonnes non détectées: ${missing
              .map((k) => ({ npc: 'N° NPC', nom: 'Nom', prenoms: 'Prénom(s)', telephone: 'Téléphone', arrondissement: 'Arrondissement' }[k]))
              .join(', ')}`
          );
        }

        // Parser chaque ligne de données (après la ligne d'en-tête)
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];

          // Ignorer les lignes complètement vides
          if (!row || row.every((cell) => cell === undefined || cell === null || String(cell).trim() === '')) {
            continue;
          }

          const getValue = (key: string): string => {
            const index = columnIndices[key];
            if (index !== undefined) {
              const raw = row[index];
              if (raw === undefined || raw === null) return '–';
              const str = String(raw).trim();
              return str.length > 0 ? str : '–';
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
          totalRows: Math.max(0, jsonData.length - headerRowIndex - 1),
        });
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier Excel'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsArrayBuffer(file);
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
