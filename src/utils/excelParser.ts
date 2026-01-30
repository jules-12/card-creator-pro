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
const columnMappings: Record<string, string[]> = {
  npc: ['npc', 'nnpc', 'numeronpc', 'numnpc', 'numcontribuable', 'matricule', 'idnpc'],
  nom: ['nom', 'nomdefamille', 'familyname', 'lastname', 'surname'],
  prenoms: ['prenom', 'prenoms', 'prnoms', 'prnms', 'firstname', 'givenname', 'given', 'prenomsconducteur'],
  telephone: ['telephone', 'tel', 'phone', 'mobile', 'portable', 'gsm', 'numtel', 'phonenumber', 'telconducteur', 'telephoneconducteur'],
  personneContact: ['personneacontacter', 'personnecontact', 'contact', 'urgence', 'personneurgence'],
  telephoneContact: ['telcontact', 'telephonecontact', 'telurgence', 'telephonepersonneacontacter'],
  proprietaire: ['proprietaire', 'proprio', 'owner', 'possesseur'],
  telephoneProprietaire: ['telproprietaire', 'telephoneproprietaire', 'telproprio'],
  // NOTE: variantes courantes + fautes fréquentes (ex: "Résidance")
  residence: ['residence', 'residance', 'adresse', 'domicile', 'lieu', 'habitation', 'quartier'],
  caracteristiquesMoto: ['caracteristiquesmoto', 'caracteristique', 'moto', 'caracteristiques', 'vehicule', 'engin', 'immatriculation'],
  arrondissement: ['arrondissement', 'arrond', 'arr', 'district', 'zone', 'arrondisment'],
};

const findColumnKey = (header: string): string | null => {
  const normalizedHeader = normalizeColumnName(header);
  if (!normalizedHeader) return null;

  // Cas spéciaux pour "Prénom(s)" et encodages exotiques
  if (
    normalizedHeader.includes('prenom') ||
    normalizedHeader.includes('prnoms') ||
    normalizedHeader.includes('prnms')
  ) {
    return 'prenoms';
  }

  // 1) Priorité aux correspondances exactes
  for (const [key, variants] of Object.entries(columnMappings)) {
    for (const variant of variants) {
      const normalizedVariant = normalizeColumnName(variant);
      if (normalizedVariant && normalizedHeader === normalizedVariant) return key;
    }
  }

  // 2) Correspondances partielles
  for (const [key, variants] of Object.entries(columnMappings)) {
    for (const variant of variants) {
      const normalizedVariant = normalizeColumnName(variant);
      if (!normalizedVariant) continue;
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

        const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array([]);
        const workbook = XLSX.read(bytes, { type: 'array' });

        // Choisir la feuille la plus "remplie"
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

        // Détecter automatiquement la ligne d'en-tête
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

        // Garde en mémoire les clés déjà assignées par index pour appliquer des heuristiques
        // (ex: deux colonnes "Téléphone" : conducteur puis personne à contacter).
        const mappedKeyByIndex: Array<string | null> = new Array(rawHeaderRow.length).fill(null);

        const assignColumnIndex = (key: string, index: number) => {
          const prevKey = index > 0 ? mappedKeyByIndex[index - 1] : null;

          let finalKey = key;
          if (key === 'telephone') {
            // 1er "Téléphone" => téléphone conducteur
            if (columnIndices.telephone === undefined) {
              finalKey = 'telephone';
            } else {
              // Heuristiques basées sur la colonne précédente
              if (columnIndices.telephoneContact === undefined && prevKey === 'personneContact') {
                finalKey = 'telephoneContact';
              } else if (columnIndices.telephoneProprietaire === undefined && prevKey === 'proprietaire') {
                finalKey = 'telephoneProprietaire';
              } else if (columnIndices.telephoneContact === undefined) {
                // fallback : 2e "Téléphone" => contact
                finalKey = 'telephoneContact';
              } else if (columnIndices.telephoneProprietaire === undefined) {
                finalKey = 'telephoneProprietaire';
              }
            }
          }

          if (columnIndices[finalKey] === undefined) {
            columnIndices[finalKey] = index;
            mappedKeyByIndex[index] = finalKey;
          }
        };

        const nonEmptyHeaderCells = rawHeaderRow
          .map((c) => (c === undefined || c === null ? '' : String(c).trim()))
          .filter((s) => s.length > 0);

        if (nonEmptyHeaderCells.length === 1 && /[,;|\t]/.test(nonEmptyHeaderCells[0])) {
          const parts = nonEmptyHeaderCells[0]
            .split(/[,;|\t]+/)
            .map((s) => s.trim())
            .filter(Boolean);

          parts.forEach((part, index) => {
            const key = findColumnKey(part);
            if (key) assignColumnIndex(key, index);
          });
        } else {
          for (let index = 0; index < rawHeaderRow.length; index++) {
            const headerCell = rawHeaderRow[index];
            if (headerCell === undefined || headerCell === null) continue;

            const raw = String(headerCell).trim();
            if (!raw) continue;

            const parts = /[,;|\t]/.test(raw)
              ? raw
                  .split(/[,;|\t]+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [raw];

            parts.forEach((part, offset) => {
              const key = findColumnKey(part);
              if (!key) return;

              const actualIndex = index + offset;
              if (actualIndex < 0 || actualIndex >= rawHeaderRow.length) return;
              assignColumnIndex(key, actualIndex);
            });
          }
        }

        // Fallback dédié pour "Prénom/Prénoms"
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
          console.log('[excelParser] sheet:', sheetName);
          console.log('[excelParser] headerRowIndex:', headerRowIndex, 'raw:', jsonData[headerRowIndex]);
          console.log('[excelParser] columnIndices:', columnIndices);
          console.log('[excelParser] firstDataRow:', jsonData[headerRowIndex + 1]);
        }

        // Informer si des colonnes attendues ne sont pas détectées
        const requiredKeys = ['npc', 'nom', 'prenoms', 'telephone'] as const;
        const missing = requiredKeys.filter((k) => columnIndices[k] === undefined);
        if (missing.length > 0) {
          errors.push(
            `Colonnes non détectées: ${missing
              .map((k) => ({ npc: 'N° NPC', nom: 'Nom', prenoms: 'Prénom(s)', telephone: 'Téléphone' }[k]))
              .join(', ')}`
          );
        }

        // Parser chaque ligne de données
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];

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
            personneContact: getValue('personneContact'),
            telephoneContact: getValue('telephoneContact'),
            proprietaire: getValue('proprietaire'),
            telephoneProprietaire: getValue('telephoneProprietaire'),
            residence: getValue('residence'),
            caracteristiquesMoto: getValue('caracteristiquesMoto'),
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

// Données de test pour la carte B2
export const generateTestData = (): Contributor[] => {
  return [
    {
      id: 'test-1',
      npc: 'NPC-2024-001',
      nom: 'AHOUANDJINOU',
      prenoms: 'Pierre Marie',
      telephone: '97 00 11 22',
      personneContact: 'Marie AHOUANDJINOU',
      telephoneContact: '96 11 22 33',
      proprietaire: 'Jean AHOUANDJINOU',
      telephoneProprietaire: '95 44 55 66',
      residence: 'Akpakpa',
      caracteristiquesMoto: 'Honda CG 125',
      arrondissement: 'Akpakpa',
    },
    {
      id: 'test-2',
      npc: 'NPC-2024-002',
      nom: 'HOUNGBEDJI',
      prenoms: 'Jeanne',
      telephone: '96 33 44 55',
      personneContact: '–',
      telephoneContact: '–',
      proprietaire: 'Jeanne HOUNGBEDJI',
      telephoneProprietaire: '96 33 44 55',
      residence: 'Cadjèhoun',
      caracteristiquesMoto: 'Bajaj Boxer',
      arrondissement: 'Cadjèhoun',
    },
    {
      id: 'test-3',
      npc: 'NPC-2024-003',
      nom: 'ZINSOU',
      prenoms: 'Emmanuel',
      telephone: '95 66 77 88',
      personneContact: 'Paul ZINSOU',
      telephoneContact: '94 77 88 99',
      proprietaire: 'Emmanuel ZINSOU',
      telephoneProprietaire: '95 66 77 88',
      residence: 'Fidjrossè',
      caracteristiquesMoto: 'TVS Apache',
      arrondissement: 'Fidjrossè',
    },
  ];
};
