import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileDown, Archive, Loader2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchInput from './SearchInput';
import CardB2 from './CardB2';
import { Contributor, CardType } from '@/types/contributor';
import { useCardExport } from '@/hooks/useCardExport';

interface CardGalleryProps {
  contributors: Contributor[];
  cardType?: CardType;
}

const CardGallery: React.FC<CardGalleryProps> = ({ contributors, cardType = '2_roues' }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { setCardRef, isExporting, exportProgress, exportSingle, exportAllPdf, exportZip } = useCardExport();

  const filteredContributors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contributors;
    return contributors.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.prenoms.toLowerCase().includes(q) ||
      c.npc.toLowerCase().includes(q)
    );
  }, [contributors, searchQuery]);

  // Stocker les cartes dans sessionStorage pour l'édition
  useEffect(() => {
    sessionStorage.setItem('currentCards', JSON.stringify(contributors));
  }, [contributors]);

  const ExportButton: React.FC<{
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
    className: string;
  }> = ({ onClick, label, icon, className }) => (
    <Button onClick={onClick} disabled={isExporting} className={className}>
      {isExporting && exportProgress !== null ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {exportProgress}%
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-xl shadow-sm border">
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-foreground">
            {filteredContributors.length}/{contributors.length} carte{contributors.length > 1 ? 's' : ''}
          </span>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher par nom ou NPC…"
          className="w-full sm:w-64"
        />

        <div className="flex flex-wrap gap-3">
          <ExportButton
            onClick={() => exportAllPdf(contributors)}
            label="PDF Global"
            icon={<FileDown className="w-4 h-4 mr-2" />}
            className="btn-benin-secondary"
          />
          <ExportButton
            onClick={() => exportZip(contributors)}
            label="Télécharger ZIP"
            icon={<Archive className="w-4 h-4 mr-2" />}
            className="btn-benin-primary"
          />
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
        {filteredContributors.map((contributor, index) => (
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
                onClick={() => navigate(`/edit/${contributor.id}`)}
                className="bg-white hover:bg-accent text-secondary p-2 rounded-full shadow-lg border border-border"
                title="Modifier cette carte"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => exportSingle(contributor)}
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
