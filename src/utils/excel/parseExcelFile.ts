import * as XLSX from 'xlsx';
import { Contributor, ParsedExcelData } from '@/types/contributor';
import { normalizeBeninPhone } from '@/utils/textHelpers';
import { findColumnKey, normalizeColumnName } from './columnMappings';

export const MAX_ROWS = 10_000;
export const MAX_PROCESSING_TIME_S = 30;

/**
 * Parse an Excel file into an array of Contributor objects.
 * Handles auto-detection of header row, column mapping, deduplication and timeout.
 */
export const parseExcelFile = (
  file: File,
  onCountdown?: (remaining: number) => void,
): Promise<ParsedExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Aucune donnée à lire');

        const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array([]);
        const workbook = XLSX.read(bytes, { type: 'array' });

        const sheetName = pickBestSheet(workbook);
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
        }) as unknown[][];

        if (jsonData.length < 2) {
          resolve({ contributors: [], errors: ['Le fichier est vide ou ne contient pas de données'], totalRows: 0 });
          return;
        }

        const dataRowCount = jsonData.length - 1;
        if (dataRowCount > MAX_ROWS) {
          resolve({
            contributors: [],
            errors: [`Le nombre de lignes du fichier (${dataRowCount.toLocaleString('fr-FR')}) dépasse le nombre maximal autorisé (${MAX_ROWS.toLocaleString('fr-FR')}). Veuillez réduire ce nombre.`],
            totalRows: dataRowCount,
          });
          return;
        }

        // Countdown timer
        const startTime = Date.now();
        let countdownInterval: ReturnType<typeof setInterval> | null = null;
        if (onCountdown) {
          onCountdown(MAX_PROCESSING_TIME_S);
          countdownInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            onCountdown(Math.max(0, MAX_PROCESSING_TIME_S - elapsed));
          }, 1000);
        }

        const clearTimer = () => {
          if (countdownInterval) clearInterval(countdownInterval);
        };

        const checkTimeout = (): boolean => {
          if (Date.now() - startTime > MAX_PROCESSING_TIME_S * 1000) {
            clearTimer();
            resolve({
              contributors: [],
              errors: [`Le temps de traitement maximal (${MAX_PROCESSING_TIME_S}s) a été atteint. Veuillez réduire la taille du fichier.`],
              totalRows: dataRowCount,
            });
            return true;
          }
          return false;
        };

        // Detect header row
        const headerRowIndex = detectHeaderRow(jsonData);

        // Build column indices
        const rawHeaderRow = (jsonData[headerRowIndex] || []) as unknown[];
        const columnIndices = buildColumnIndices(rawHeaderRow);

        const errors: string[] = [];

        if (import.meta.env.DEV) {
          console.log('[excelParser] sheet:', sheetName);
          console.log('[excelParser] headerRowIndex:', headerRowIndex, 'raw:', jsonData[headerRowIndex]);
          console.log('[excelParser] columnIndices:', columnIndices);
          console.log('[excelParser] firstDataRow:', jsonData[headerRowIndex + 1]);
        }

        // Warn about missing required columns
        const requiredKeys = ['npc', 'nom', 'prenoms', 'telephone'] as const;
        const missing = requiredKeys.filter((k) => columnIndices[k] === undefined);
        if (missing.length > 0) {
          errors.push(
            `Colonnes non détectées: ${missing
              .map((k) => ({ npc: 'N° NPC', nom: 'Nom', prenoms: 'Prénom(s)', telephone: 'Téléphone' }[k]))
              .join(', ')}`,
          );
        }

        // Parse data rows
        const contributors: Contributor[] = [];
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          if ((i - headerRowIndex) % 500 === 0 && checkTimeout()) return;

          const row = jsonData[i];
          if (!row || row.every((cell) => cell === undefined || cell === null || String(cell).trim() === '')) continue;

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

          let caracMoto = getValue('caracteristiquesMoto');
          if (caracMoto === '–') {
            const marque = getValue('marqueEngin');
            const chassis = getValue('numeroChassis');
            if (marque !== '–' && chassis !== '–') caracMoto = `${marque} / ${chassis}`;
            else if (marque !== '–') caracMoto = marque;
            else if (chassis !== '–') caracMoto = chassis;
          }

          contributors.push({
            id: `contrib-${i}-${Date.now()}`,
            npc: getValue('npc'),
            nom: getValue('nom'),
            prenoms: getValue('prenoms'),
            telephone: normalizeBeninPhone(getValue('telephone')),
            personneContact: getValue('personneContact'),
            telephoneContact: normalizeBeninPhone(getValue('telephoneContact')),
            proprietaire: getValue('proprietaire'),
            telephoneProprietaire: normalizeBeninPhone(getValue('telephoneProprietaire')),
            residence: getValue('residence'),
            caracteristiquesMoto: caracMoto,
            arrondissement: getValue('arrondissement'),
          });
        }

        // Deduplicate by NPC
        const { unique, duplicateCount } = deduplicateByNpc(contributors);
        if (duplicateCount > 0) {
          errors.push(`${duplicateCount} doublon(s) de NPC détecté(s) et ignoré(s)`);
        }

        clearTimer();
        resolve({
          contributors: unique,
          errors,
          totalRows: Math.max(0, jsonData.length - headerRowIndex - 1),
        });
      } catch {
        reject(new Error('Erreur lors de la lecture du fichier Excel'));
      }
    };

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
};

// ─── Internal helpers ────────────────────────────────────────

function pickBestSheet(workbook: XLSX.WorkBook): string {
  let best = workbook.SheetNames[0];
  let bestRows = -1;
  for (const name of workbook.SheetNames) {
    const ref = workbook.Sheets[name]?.['!ref'];
    if (!ref) continue;
    const rows = XLSX.utils.decode_range(ref).e.r - XLSX.utils.decode_range(ref).s.r + 1;
    if (rows > bestRows) { bestRows = rows; best = name; }
  }
  return best;
}

function detectHeaderRow(jsonData: unknown[][]): number {
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
      const parts = /[,;|\t]/.test(raw) ? raw.split(/[,;|\t]+/).map(s => s.trim()).filter(Boolean) : [raw];
      for (const part of parts) {
        const key = findColumnKey(part);
        if (key) keys.add(key);
      }
    }

    if (keys.size > bestScore) { bestScore = keys.size; headerRowIndex = r; }
  }
  return headerRowIndex;
}

function buildColumnIndices(rawHeaderRow: unknown[]): Record<string, number> {
  const columnIndices: Record<string, number> = {};
  const mappedKeyByIndex: Array<string | null> = new Array(rawHeaderRow.length).fill(null);

  const assignColumnIndex = (key: string, index: number) => {
    const prevKey = index > 0 ? mappedKeyByIndex[index - 1] : null;

    let finalKey = key;
    if (key === 'telephone') {
      if (columnIndices.telephone === undefined) {
        finalKey = 'telephone';
      } else if (columnIndices.telephoneContact === undefined && prevKey === 'personneContact') {
        finalKey = 'telephoneContact';
      } else if (columnIndices.telephoneProprietaire === undefined && prevKey === 'proprietaire') {
        finalKey = 'telephoneProprietaire';
      } else if (columnIndices.telephoneContact === undefined) {
        finalKey = 'telephoneContact';
      } else if (columnIndices.telephoneProprietaire === undefined) {
        finalKey = 'telephoneProprietaire';
      }
    }

    if (columnIndices[finalKey] === undefined) {
      columnIndices[finalKey] = index;
      mappedKeyByIndex[index] = finalKey;
    }
  };

  const nonEmptyHeaderCells = rawHeaderRow
    .map(c => (c === undefined || c === null ? '' : String(c).trim()))
    .filter(s => s.length > 0);

  if (nonEmptyHeaderCells.length === 1 && /[,;|\t]/.test(nonEmptyHeaderCells[0])) {
    nonEmptyHeaderCells[0].split(/[,;|\t]+/).map(s => s.trim()).filter(Boolean)
      .forEach((part, index) => {
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
        ? raw.split(/[,;|\t]+/).map(s => s.trim()).filter(Boolean)
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

  // Fallback for "Prénom/Prénoms"
  if (columnIndices.prenoms === undefined) {
    for (let i = 0; i < rawHeaderRow.length; i++) {
      const cell = rawHeaderRow[i];
      if (cell === undefined || cell === null) continue;
      if (normalizeColumnName(String(cell)).includes('prenom')) {
        columnIndices.prenoms = i;
        break;
      }
    }
  }

  return columnIndices;
}

function deduplicateByNpc(contributors: Contributor[]): { unique: Contributor[]; duplicateCount: number } {
  const seenNpcs = new Set<string>();
  const unique: Contributor[] = [];
  let duplicateCount = 0;

  for (const c of contributors) {
    const npcKey = c.npc.trim().toLowerCase();
    if (npcKey && npcKey !== '–' && seenNpcs.has(npcKey)) {
      duplicateCount++;
      continue;
    }
    if (npcKey && npcKey !== '–') seenNpcs.add(npcKey);
    unique.push(c);
  }

  return { unique, duplicateCount };
}
