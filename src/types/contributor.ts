// Types pour le générateur de cartes professionnelles

export interface Contributor {
  id: string;
  npc: string;
  nom: string;
  prenoms: string;
  telephone: string;
  arrondissement: string;
}

export interface ParsedExcelData {
  contributors: Contributor[];
  errors: string[];
  totalRows: number;
}
