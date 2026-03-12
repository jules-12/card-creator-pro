import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileDown, Archive, Loader2, Edit, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const { setCardRef, isExporting, exportProgress, exportSingle, exportAllPdf, exportZip } = useCardExport(contributors);

  const filteredContributors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contributors;
    return contributors.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.prenoms.toLowerCase().includes(q) ||
      c.npc.toLowerCase().includes(q)
    );
  }, [contributors, searchQuery]);

  // Store cards in sessionStorage for editing
  useEffect(() => {
    sessionStorage.setItem('currentCards', JSON.stringify(contributors));
  }, [contributors]);

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-xl shadow-sm border">
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-foreground">
            {filteredContributors.length}/{contributors.length} carte{contributors.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou NPC…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <ExportButton
            onClick={exportAllPdf}
            disabled={isExporting}
            progress={exportProgress}
            className="btn-benin-secondary"
            icon={<FileDown className="w-4 h-4 mr-2" />}
            label="PDF Global"
          />
          <ExportButton
            onClick={exportZip}
            disabled={isExporting}
            progress={exportProgress}
            className="btn-benin-primary"
            icon={<Archive className="w-4 h-4 mr-2" />}
            label="Télécharger ZIP"
          />
        </div>
      </div>

      {/* Progress bar */}
      {exportProgress !== null && (
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-secondary transition-all duration-300 ease-out"
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      )}

      {/* Card grid */}
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

/** Reusable export button with progress state */
const ExportButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  progress: number | null;
  className: string;
  icon: React.ReactNode;
  label: string;
}> = ({ onClick, disabled, progress, className, icon, label }) => (
  <Button onClick={onClick} disabled={disabled} className={className}>
    {disabled && progress !== null ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        {progress}%
      </>
    ) : (
      <>
        {icon}
        {label}
      </>
    )}
  </Button>
);

export default CardGallery;
