import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FileImportSection from '@/components/FileImportSection';
import CardGallery from '@/components/CardGallery';
import SavedCardsManager from '@/components/SavedCardsManager';
import { Contributor, CardType } from '@/types/contributor';
import { generateTestData, MAX_PROCESSING_TIME_S } from '@/utils/excelParser';

const Index: React.FC = () => {
  const location = useLocation();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [cardType, setCardType] = useState<CardType>('2_roues');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState<number>(MAX_PROCESSING_TIME_S);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer indépendant du parsing (le parsing bloque le thread)
  useEffect(() => {
    if (isAnalyzing) {
      setCountdown(MAX_PROCESSING_TIME_S);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAnalyzing]);

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
    setIsAnalyzing(true);

    // Laisser React rendre le spinner + compteur avant de lancer le parsing synchrone
    await new Promise((r) => setTimeout(r, 100));

    try {
      const result = await parseExcelFile(file);
      if (result.contributors.length === 0) {
        setError(result.errors?.[0] ?? 'Aucune donnée valide trouvée');
        setIsAnalyzing(false);
        return;
      }
      handleDataLoaded(result.contributors);
      if (result.errors?.length) {
        setError(result.errors.join(' | '));
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de lecture du fichier');
    } finally {
      setIsAnalyzing(false);
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

      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 animate-fade-in">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium text-center">
            Le fichier est en cours d'analyse, veuillez patienter…
          </p>
          {countdown !== null && (
            <p className="text-sm font-mono text-primary font-bold">
              Temps restant : {countdown}s
            </p>
          )}
        </div>
      ) : !hasLoaded ? (
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
