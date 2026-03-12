/**
 * Excel column name normalization and mapping logic.
 * Extracted from excelParser.ts for maintainability (SRP).
 */

/** Normalize a column header to a comparable key (lowercase, no accents, no special chars). */
export const normalizeColumnName = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

/** Maps internal field keys to possible column name variants (already normalized). */
export const COLUMN_MAPPINGS: Record<string, string[]> = {
  npc: ['npc', 'nnpc', 'numeronpc', 'numnpc', 'numcontribuable', 'matricule', 'idnpc'],
  nom: ['nom', 'nomdefamille', 'familyname', 'lastname', 'surname'],
  prenoms: ['prenom', 'prenoms', 'prnoms', 'prnms', 'firstname', 'givenname', 'given', 'prenomsconducteur'],
  telephone: ['telephone', 'tel', 'phone', 'mobile', 'portable', 'gsm', 'numtel', 'phonenumber', 'telconducteur', 'telephoneconducteur'],
  personneContact: ['personneacontacter', 'personnecontact', 'contact', 'urgence', 'personneurgence'],
  telephoneContact: ['telcontact', 'telephonecontact', 'telurgence', 'telephonepersonneacontacter', 'telpersonneacontacter'],
  proprietaire: ['proprietaire', 'proprio', 'owner', 'possesseur'],
  telephoneProprietaire: ['telproprietaire', 'telephoneproprietaire', 'telproprio'],
  residence: ['residence', 'residance', 'adresse', 'domicile', 'lieu', 'habitation', 'quartier'],
  caracteristiquesMoto: ['caracteristiquesmoto', 'caracteristique', 'moto', 'caracteristiques', 'vehicule', 'engin'],
  marqueEngin: ['marquelengin', 'marquedelengin', 'marque'],
  numeroChassis: ['numerochassis', 'chassis', 'numchassis', 'nochassis'],
  immatriculation: ['immatriculation', 'immatriculationanatt', 'anatt'],
  arrondissement: ['arrondissement', 'arrond', 'arr', 'district', 'zone', 'arrondisment'],
};

/**
 * Attempt to match a raw header string to an internal field key.
 * Returns the key or null if no match is found.
 */
export const findColumnKey = (header: string): string | null => {
  const normalizedHeader = normalizeColumnName(header);
  if (!normalizedHeader) return null;

  // Special case for "Prénom(s)" and exotic encodings
  if (
    normalizedHeader.includes('prenom') ||
    normalizedHeader.includes('prnoms') ||
    normalizedHeader.includes('prnms')
  ) {
    return 'prenoms';
  }

  // 1) Exact matches first
  for (const [key, variants] of Object.entries(COLUMN_MAPPINGS)) {
    for (const variant of variants) {
      const normalizedVariant = normalizeColumnName(variant);
      if (normalizedVariant && normalizedHeader === normalizedVariant) return key;
    }
  }

  // 2) Partial matches
  for (const [key, variants] of Object.entries(COLUMN_MAPPINGS)) {
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
