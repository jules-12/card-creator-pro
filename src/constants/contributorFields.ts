import { Contributor } from '@/types/contributor';

/** Shared field definitions for Contributor forms, tables, and views */
export interface ContributorFieldDef {
  key: keyof Contributor;
  label: string;
  placeholder?: string;
}

export const CONTRIBUTOR_FIELDS: ContributorFieldDef[] = [
  { key: 'npc', label: 'N° NPC', placeholder: 'Numéro NPC' },
  { key: 'nom', label: 'Nom', placeholder: 'Nom du conducteur' },
  { key: 'prenoms', label: 'Prénom(s)', placeholder: 'Prénom(s) du conducteur' },
  { key: 'telephone', label: 'Téléphone', placeholder: 'Téléphone du conducteur' },
  { key: 'personneContact', label: 'Personne à contacter', placeholder: 'Nom de la personne à contacter' },
  { key: 'telephoneContact', label: 'Tél contact', placeholder: 'Téléphone de la personne à contacter' },
  { key: 'proprietaire', label: 'Propriétaire', placeholder: 'Nom du propriétaire' },
  { key: 'telephoneProprietaire', label: 'Tél propriétaire', placeholder: 'Téléphone du propriétaire' },
  { key: 'residence', label: 'Résidence', placeholder: 'Adresse de résidence' },
  { key: 'caracteristiquesMoto', label: 'Caractéristiques Moto', placeholder: 'Marque, modèle, plaque...' },
];

export const EMPTY_CONTRIBUTOR: Contributor = {
  id: '',
  npc: '',
  nom: '',
  prenoms: '',
  telephone: '',
  personneContact: '',
  telephoneContact: '',
  proprietaire: '',
  telephoneProprietaire: '',
  residence: '',
  caracteristiquesMoto: '',
  arrondissement: '',
};
