import { useState } from 'react';
import { AlertCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import FileUploader from '@/components/FileUploader';
import CardGallery from '@/components/CardGallery';
import SavedCardsManager from '@/components/SavedCardsManager';
import BeninFlagStripe from '@/components/BeninFlagStripe';
import { Contributor } from '@/types/contributor';
import { generateTestData } from '@/utils/excelParser';

const Index: React.FC = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleDataLoaded = (data: Contributor[]) => {
    setContributors(data);
    setError(null);
    setHasLoaded(true);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleLoadTestData = () => {
    const testData = generateTestData();
    setContributors(testData);
    setError(null);
    setHasLoaded(true);
  };

  const handleReset = () => {
    setContributors([]);
    setError(null);
    setHasLoaded(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-destructive hover:text-destructive/80"
            >
              ✕
            </button>
          </div>
        )}

        {!hasLoaded ? (
          /* État initial - Zone d'import */
          <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                Importez vos données
              </h2>
              <p className="text-muted-foreground">
                Chargez un fichier Excel contenant les informations des contribuables
                pour générer automatiquement leurs cartes professionnelles.
              </p>
            </div>

            {/* Bouton pour accéder aux sauvegardes existantes */}
            <div className="flex justify-center">
              <SavedCardsManager
                currentCards={contributors}
                onLoadCards={handleDataLoaded}
                showSaveButton={false}
              />
            </div>

            <FileUploader onDataLoaded={handleDataLoaded} onError={handleError} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={handleLoadTestData}
                variant="outline"
                className="gap-2"
              >
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'N° NPC',
                  'Nom',
                  'Prénom(s)',
                  'Téléphone',
                  'Personne à contacter',
                  'Tél contact',
                  'Propriétaire',
                  'Tél propriétaire',
                  'Résidence',
                  'Caractéristiques Moto',
                  
                ].map((col) => (
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
        ) : (
          /* État avec données - Galerie des cartes */
          <div className="animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="font-heading text-xl font-bold text-foreground">
                Cartes générées
              </h2>
              <div className="flex flex-wrap gap-2">
                <SavedCardsManager
                  currentCards={contributors}
                  onLoadCards={handleDataLoaded}
                />
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Nouveau fichier
                </Button>
              </div>
            </div>

            <CardGallery contributors={contributors} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto">
        <div className="container py-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Mairie de Cotonou - Tous droits réservés</p>
        </div>
        <BeninFlagStripe height="4px" />
      </footer>
    </div>
  );
};

export default Index;
