import React, { useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileDown, Archive, Loader2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CardB2 from './CardB2';
import { Contributor } from '@/types/contributor';
import { exportSingleCardToPdf, exportAllCardsToPdf, exportAllCardsToZip } from '@/utils/pdfExporter';

interface CardGalleryProps {
  contributors: Contributor[];
}

const CardGallery: React.FC<CardGalleryProps> = ({ contributors }) => {
  const navigate = useNavigate();
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [exportProgress, setExportProgress] = React.useState<number | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Stocker les cartes dans sessionStorage pour l'édition
  useEffect(() => {
    sessionStorage.setItem('currentCards', JSON.stringify(contributors));
  }, [contributors]);

  const handleEditCard = (contributor: Contributor) => {
    navigate(`/edit/${contributor.id}`);
  };

  const setCardRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(id, element);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  const handleExportSingle = async (contributor: Contributor) => {
    const cardElement = cardRefs.current.get(contributor.id);
    if (!cardElement) return;

    setIsExporting(true);
    try {
      await exportSingleCardToPdf(cardElement, contributor);
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllPdf = async () => {
    const elements = contributors
      .map(c => cardRefs.current.get(c.id))
      .filter((el): el is HTMLDivElement => el !== undefined);

    if (elements.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    try {
      await exportAllCardsToPdf(elements, setExportProgress);
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleExportZip = async () => {
    const elements = contributors
      .map(c => cardRefs.current.get(c.id))
      .filter((el): el is HTMLDivElement => el !== undefined);

    if (elements.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    try {
      await exportAllCardsToZip(elements, contributors, setExportProgress);
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-xl shadow-sm border">
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-foreground">
            {contributors.length} carte{contributors.length > 1 ? 's' : ''}  générée{contributors.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExportAllPdf}
            disabled={isExporting}
            className="btn-benin-secondary"
          >
            {isExporting && exportProgress !== null ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {exportProgress}%
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                PDF Global
              </>
            )}
          </Button>

          <Button
            onClick={handleExportZip}
            disabled={isExporting}
            className="btn-benin-primary"
          >
            {isExporting && exportProgress !== null ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {exportProgress}%
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-2" />
                Télécharger ZIP
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Indicateur de progression */}
      {exportProgress !== null && (
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-secondary transition-all duration-300 ease-out"
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      )}

      {/* Grille des cartes */}
      <div className="grid gap-6 justify-items-center">
        {contributors.map((contributor, index) => (
          <div
            key={contributor.id}
            className="animate-fade-in relative group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardB2
              ref={(el) => setCardRef(contributor.id, el)}
              contributor={contributor}
            />
            
            {/* Boutons d'action */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEditCard(contributor)}
                className="bg-white/90 hover:bg-white text-secondary p-2 rounded-full shadow-lg"
                title="Modifier cette carte"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExportSingle(contributor)}
                disabled={isExporting}
                className="bg-white/90 hover:bg-white text-primary p-2 rounded-full shadow-lg"
                title="Télécharger cette carte en PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardGallery;
