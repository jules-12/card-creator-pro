import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/PageLayout';
import FileImportSection from '@/components/FileImportSection';
import CardGallery from '@/components/CardGallery';
import SavedCardsManager from '@/components/SavedCardsManager';
import { Contributor, CardType } from '@/types/contributor';
import { generateTestData } from '@/utils/excelParser';

const Index: React.FC = () => {
  const location = useLocation();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [cardType, setCardType] = useState<CardType>('2_roues');

  useEffect(() => {
    if (location.state?.updatedCards) {
      setContributors(location.state.updatedCards);
      setHasLoaded(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleDataLoaded = (data: Contributor[]) => {
    setContributors(data);
    setError(null);
    setHasLoaded(true);
  };

  const handleFileImport = async (file: File, type: CardType) => {
    const { parseExcelFile } = await import('@/utils/excelParser');
    setError(null);
    setCardType(type);
    try {
      const result = await parseExcelFile(file);
      if (result.contributors.length === 0) {
        setError(result.errors?.[0] ?? 'Aucune donnée valide trouvée');
        return;
      }
      handleDataLoaded(result.contributors);
      if (result.errors?.length) {
        setError(result.errors.join(' | '));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de lecture du fichier');
    }
  };

  const handleLoadTestData = () => {
    setContributors(generateTestData());
    setError(null);
    setHasLoaded(true);
  };

  const handleReset = () => {
    setContributors([]);
    setError(null);
    setHasLoaded(false);
  };

  return (
    <>
      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-destructive text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-destructive/80">
            ✕
          </button>
        </div>
      )}

      {!hasLoaded ? (
        <FileImportSection
          onFileImport={handleFileImport}
          onLoadTestData={handleLoadTestData}
          onLoadCards={handleDataLoaded}
          contributors={contributors}
        />
      ) : (
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h2 className="font-heading text-xl font-bold text-foreground">
              Cartes générées
            </h2>
            <div className="flex flex-wrap gap-2">
              <SavedCardsManager currentCards={contributors} onLoadCards={handleDataLoaded} />
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Nouveau fichier
              </Button>
            </div>
          </div>

          <CardGallery contributors={contributors} cardType={cardType} />
        </div>
      )}
    </>
  );
};

export default Index;
