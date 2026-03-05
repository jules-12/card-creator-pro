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
