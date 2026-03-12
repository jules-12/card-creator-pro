import React from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Contributor } from '@/types/contributor';
import { CONTRIBUTOR_FIELDS } from '@/constants/contributorFields';

interface CardEditViewProps {
  editFormData: Contributor;
  onFieldChange: (key: keyof Contributor, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

const CardEditView: React.FC<CardEditViewProps> = ({ editFormData, onFieldChange, onCancel, onSave }) => (
  <div className="space-y-4">
    <Button variant="ghost" size="sm" onClick={onCancel}>
      <ArrowLeft className="w-4 h-4 mr-1" /> Retour
    </Button>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {CONTRIBUTOR_FIELDS.map(({ key, label }) => (
        <div key={key} className="space-y-1">
          <label className="text-sm font-medium">{label}</label>
          <Input
            value={editFormData[key] || ''}
            onChange={(e) => onFieldChange(key, e.target.value)}
          />
        </div>
      ))}
    </div>
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="outline" onClick={onCancel}>Annuler</Button>
      <Button className="btn-benin-primary" onClick={onSave}>
        <Save className="w-4 h-4 mr-2" /> Enregistrer
      </Button>
    </div>
  </div>
);

export default CardEditView;
