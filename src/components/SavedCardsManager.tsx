import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Calendar, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Contributor } from '@/types/contributor';
import { saveCards, getSavedCardSets, deleteCardSet, SavedCardSet } from '@/utils/cardStorage';
import { useToast } from '@/hooks/use-toast';

interface SavedCardsManagerProps {
  currentCards: Contributor[];
  onLoadCards: (cards: Contributor[]) => void;
}

const SavedCardsManager: React.FC<SavedCardsManagerProps> = ({
  currentCards,
  onLoadCards,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedSets, setSavedSets] = useState<SavedCardSet[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    if (user) {
      setSavedSets(getSavedCardSets(user.id));
    }
  }, [user]);

  const handleSave = () => {
    if (!user || !saveName.trim()) return;

    saveCards(user.id, saveName.trim(), currentCards);
    setSavedSets(getSavedCardSets(user.id));
    setSaveName('');
    setSaveDialogOpen(false);

    toast({
      title: 'Cartes enregistrées',
      description: `${currentCards.length} carte(s) sauvegardée(s) sous "${saveName}"`,
    });
  };

  const handleLoad = (set: SavedCardSet) => {
    onLoadCards(set.cards);
    setLoadDialogOpen(false);

    toast({
      title: 'Cartes chargées',
      description: `${set.cards.length} carte(s) restaurée(s) depuis "${set.name}"`,
    });
  };

  const handleDelete = (setId: string, setName: string) => {
    deleteCardSet(setId);
    setSavedSets(getSavedCardSets(user?.id || ''));

    toast({
      title: 'Supprimé',
      description: `"${setName}" a été supprimé`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <div className="flex gap-2">
      {/* Bouton Enregistrer */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="gap-2"
            disabled={currentCards.length === 0}
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer les cartes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nom de la sauvegarde
              </label>
              <Input
                placeholder="Ex: Import du 15 janvier"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {currentCards.length} carte(s) seront enregistrée(s)
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                className="btn-benin-primary"
                onClick={handleSave}
                disabled={!saveName.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bouton Charger */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Mes sauvegardes
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sauvegardes enregistrées</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {savedSets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune sauvegarde</p>
                <p className="text-sm">
                  Importez un fichier Excel et enregistrez vos cartes
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {savedSets.map((set) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <button
                      onClick={() => handleLoad(set)}
                      className="flex-1 text-left"
                    >
                      <p className="font-medium text-foreground">{set.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {set.cards.length} carte(s)
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(set.createdAt)}
                        </span>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(set.id, set.name);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedCardsManager;
