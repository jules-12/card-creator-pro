import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileDown, Archive, Loader2, Edit, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CardB2 from './CardB2';
import { Contributor, CardType } from '@/types/contributor';
import { exportSingleCardToPdf, exportAllCardsToPdf, exportAllCardsToZip } from '@/utils/pdfExporter';

type SortOption = 'default' | 'nom_asc' | 'nom_desc' | 'npc_asc' | 'npc_desc';

interface CardGalleryProps {
  contributors: Contributor[];
  cardType?: CardType;
}

const CardGallery: React.FC<CardGalleryProps> = ({ contributors, cardType = '2_roues' }) => {
  const navigate = useNavigate();
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [exportProgress, setExportProgress] = React.useState<number | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const sortedContributors = useMemo(() => {
    if (sortBy === 'default') return contributors;
    const sorted = [...contributors];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'nom_asc':
          return `${a.nom} ${a.prenoms}`.localeCompare(`${b.nom} ${b.prenoms}`, 'fr');
        case 'nom_desc':
          return `${b.nom} ${b.prenoms}`.localeCompare(`${a.nom} ${a.prenoms}`, 'fr');
        case 'npc_asc':
          return a.npc.localeCompare(b.npc, 'fr', { numeric: true });
        case 'npc_desc':
          return b.npc.localeCompare(a.npc, 'fr', { numeric: true });
        default:
          return 0;
      }
    });
    return sorted;
  }, [contributors, sortBy]);

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
        <div className="flex items-center gap-3">
          <span className="font-heading font-semibold text-foreground">
            {contributors.length} carte{contributors.length > 1 ? 's' : ''} générée{contributors.length > 1 ? 's' : ''}
          </span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[200px] h-9">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <SelectValue placeholder="Trier par…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Ordre d'import</SelectItem>
              <SelectItem value="nom_asc">Nom (A → Z)</SelectItem>
              <SelectItem value="nom_desc">Nom (Z → A)</SelectItem>
              <SelectItem value="npc_asc">NPC (croissant)</SelectItem>
              <SelectItem value="npc_desc">NPC (décroissant)</SelectItem>
            </SelectContent>
          </Select>
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
        {sortedContributors.map((contributor, index) => (
          <div
            key={contributor.id}
            className="animate-fade-in relative group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardB2
              ref={(el) => setCardRef(contributor.id, el)}
              contributor={contributor}
              cardType={cardType}
            />
            
            {/* Boutons d'action - toujours visibles */}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => handleEditCard(contributor)}
                className="bg-white hover:bg-accent text-secondary p-2 rounded-full shadow-lg border border-border"
                title="Modifier cette carte"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExportSingle(contributor)}
                disabled={isExporting}
                className="bg-white hover:bg-accent text-primary p-2 rounded-full shadow-lg border border-border"
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
