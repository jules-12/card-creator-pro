/** Return trimmed string or fallback '–' */
export const safe = (v: string | null | undefined): string => {
  const s = (v ?? '').toString().trim();
  return s.length > 0 ? s : '–';
};

/** Truncate to first N words (default 2) */
export const truncName = (v: string, maxWords = 2): string => {
  const words = v.split(/\s+/).filter(w => w.length > 0);
  return words.slice(0, maxWords).join(' ') || '–';
};

/** Truncate moto brand to first word, keep full chassis number.
 *  Input format: "Marque1 Marque2 / Chassis123" → "Marque1 / Chassis123" */
export const truncMotoDisplay = (v: string): string => {
  const sep = v.indexOf('/');
  if (sep === -1) return v;
  const brand = v.substring(0, sep).trim();
  const chassis = v.substring(sep + 1).trim();
  const firstWord = brand.split(/\s+/)[0] || brand;
  return `${firstWord} / ${chassis}`;
};

/** Format ISO date string to French locale */
export const formatDateFr = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
