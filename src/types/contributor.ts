// Types pour le générateur de cartes professionnelles B2

export interface Contributor {
  id: string;
  npc: string;
  nom: string;
  prenoms: string;
  telephone: string;
  // Nouveaux champs pour la carte B2
  personneContact: string;
  telephoneContact: string;
  proprietaire: string;
  telephoneProprietaire: string;
  residence: string;
  caracteristiquesMoto: string;
  // Ancien champ conservé pour compatibilité
  arrondissement: string;
}

export interface ParsedExcelData {
  contributors: Contributor[];
  errors: string[];
  totalRows: number;
}
