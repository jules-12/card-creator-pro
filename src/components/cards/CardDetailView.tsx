import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Contributor } from '@/types/contributor';
import { CONTRIBUTOR_FIELDS } from '@/constants/contributorFields';

interface CardDetailViewProps {
  card: Contributor;
  onBack: () => void;
}

const CardDetailView: React.FC<CardDetailViewProps> = ({ card, onBack }) => (
  <div className="space-y-4">
    <Button variant="ghost" size="sm" onClick={onBack}>
      <ArrowLeft className="w-4 h-4 mr-1" /> Retour
    </Button>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
      {CONTRIBUTOR_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-sm font-semibold">{card[key] || '–'}</p>
        </div>
      ))}
    </div>
  </div>
);

export default CardDetailView;
