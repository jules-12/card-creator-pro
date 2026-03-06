import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SavedCardsManager from './SavedCardsManager';
import { Contributor, CardType } from '@/types/contributor';
import { EXPECTED_COLUMN_LABELS } from '@/constants/contributorFields';

interface FileImportSectionProps {
  onFileImport: (file: File, cardType: CardType) => void;
  onLoadTestData: () => void;
  onLoadCards: (cards: Contributor[]) => void;
  contributors: Contributor[];
}

const FileImportSection: React.FC<FileImportSectionProps> = ({
  onFileImport,
  onLoadTestData,
  onLoadCards,
  contributors,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, cardType: CardType) => {
    if (e.target.files?.[0]) {
      onFileImport(e.target.files[0], cardType);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
          Importez vos données
        </h2>
        <p className="text-muted-foreground">
          Choisissez le type de recensement puis chargez votre fichier Excel.
        </p>
      </div>

      <div className="flex justify-center">
        <SavedCardsManager
          currentCards={contributors}
          onLoadCards={onLoadCards}
          showSaveButton={false}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ImportCard
          label="Taxi-Moto 2 ROUES"
          sublabel="Importer le fichier des 2 roues"
          inputId="file-input-2roues"
          colorClass="primary"
          onChange={(e) => handleFileChange(e, '2_roues')}
        />
        <ImportCard
          label="Taxi-Moto 3 ROUES"
          sublabel="Importer le fichier des 3 roues"
          inputId="file-input-3roues"
          colorClass="secondary"
          onChange={(e) => handleFileChange(e, '3_roues')}
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      <div className="text-center">
        <Button onClick={onLoadTestData} variant="outline" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Charger des données de test
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 rounded-xl p-6 mt-8">
        <h3 className="font-heading font-semibold text-foreground mb-4">
          Format du fichier Excel
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Votre fichier Excel peut contenir les colonnes suivantes :
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {EXPECTED_COLUMN_LABELS.map((col) => (
            <div
              key={col}
              className="bg-card px-3 py-2 rounded-lg text-center text-sm font-medium text-foreground border"
            >
              {col}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          💡 Colonnes reconnues automatiquement avec flexibilité (accents, variantes).
          Les champs manquants seront remplacés par « – ».
        </p>
      </div>
    </div>
  );
};

/** Single import card button */
const ImportCard: React.FC<{
  label: string;
  sublabel: string;
  inputId: string;
  colorClass: 'primary' | 'secondary';
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, sublabel, inputId, colorClass, onChange }) => (
  <div
    className="drop-zone cursor-pointer flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
    onClick={() => document.getElementById(inputId)?.click()}
  >
    <div className={`w-14 h-14 rounded-full bg-${colorClass}/10 flex items-center justify-center`}>
      <FileSpreadsheet className={`w-7 h-7 text-${colorClass}`} />
    </div>
    <div className="text-center">
      <p className="font-heading font-semibold text-foreground mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
    </div>
    <input
      id={inputId}
      type="file"
      accept=".xls,.xlsx"
      className="hidden"
      onChange={onChange}
    />
  </div>
);

export default FileImportSection;
