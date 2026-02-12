import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Calendar, CreditCard, Edit2, Search, X, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { Contributor } from '@/types/contributor';
import { saveCards, getSavedCardSets, deleteCardSet, updateCardSet, SavedCardSet } from '@/utils/cardStorage';
import { useToast } from '@/hooks/use-toast';

interface SavedCardsManagerProps {
  currentCards: Contributor[];
  onLoadCards: (cards: Contributor[]) => void;
  showSaveButton?: boolean;
}

const SavedCardsManager: React.FC<SavedCardsManagerProps> = ({
  currentCards,
  onLoadCards,
  showSaveButton = true,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedSets, setSavedSets] = useState<SavedCardSet[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSet, setEditingSet] = useState<SavedCardSet | null>(null);
  const [editName, setEditName] = useState('');
  const [viewingSet, setViewingSet] = useState<SavedCardSet | null>(null);

  useEffect(() => {
    if (user) {
      setSavedSets(getSavedCardSets(user.id));
    }
  }, [user]);

  // Rafraîchir les sauvegardes quand le dialog s'ouvre
  useEffect(() => {
    if (loadDialogOpen && user) {
      setSavedSets(getSavedCardSets(user.id));
    }
  }, [loadDialogOpen, user]);

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
    setViewingSet(set);
  };

  const handleConfirmLoad = () => {
    if (!viewingSet) return;
    onLoadCards(viewingSet.cards);
    setViewingSet(null);
    setLoadDialogOpen(false);

    toast({
      title: 'Cartes chargées',
      description: `${viewingSet.cards.length} carte(s) restaurée(s) depuis "${viewingSet.name}"`,
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

  const handleStartEdit = (set: SavedCardSet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSet(set);
    setEditName(set.name);
  };

  const handleSaveEdit = () => {
    if (!editingSet || !editName.trim()) return;

    updateCardSet(editingSet.id, { name: editName.trim() });
    setSavedSets(getSavedCardSets(user?.id || ''));
    setEditingSet(null);
    setEditName('');

    toast({
      title: 'Modifié',
      description: `Sauvegarde renommée en "${editName.trim()}"`,
    });
  };

  const handleUpdateCards = (set: SavedCardSet, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentCards.length === 0) {
      toast({
        title: 'Aucune carte',
        description: 'Importez des cartes avant de mettre à jour une sauvegarde',
        variant: 'destructive',
      });
      return;
    }

    updateCardSet(set.id, { cards: currentCards });
    setSavedSets(getSavedCardSets(user?.id || ''));

    toast({
      title: 'Mis à jour',
      description: `"${set.name}" contient maintenant ${currentCards.length} carte(s)`,
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

  // Filtrer les sauvegardes selon la recherche
  const filteredSets = savedSets.filter(set =>
    set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    set.cards.some(card => 
      card.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.prenoms?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.npc?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (!user) return null;

  return (
    <div className="flex gap-2">
      {/* Bouton Enregistrer */}
      {showSaveButton && (
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
      )}

      {/* Bouton Charger */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Mes sauvegardes
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingSet && (
                <Button variant="ghost" size="icon" onClick={() => setViewingSet(null)} className="mr-1">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              {viewingSet ? viewingSet.name : 'Sauvegardes enregistrées'}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {viewingSet ? (
              /* Vue tableau détaillé */
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-muted-foreground">{viewingSet.cards.length} carte(s)</p>
                  <Button className="btn-benin-primary gap-2" onClick={handleConfirmLoad}>
                    <Download className="w-4 h-4" />
                    Charger ces cartes
                  </Button>
                </div>
                <div className="overflow-auto max-h-[60vh] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">N° NPC</TableHead>
                        <TableHead className="whitespace-nowrap">Nom</TableHead>
                        <TableHead className="whitespace-nowrap">Prénoms</TableHead>
                        <TableHead className="whitespace-nowrap">Tél</TableHead>
                        <TableHead className="whitespace-nowrap">Personne à contacter</TableHead>
                        <TableHead className="whitespace-nowrap">Tél contact</TableHead>
                        <TableHead className="whitespace-nowrap">Propriétaire</TableHead>
                        <TableHead className="whitespace-nowrap">Tél propriétaire</TableHead>
                        <TableHead className="whitespace-nowrap">Résidence</TableHead>
                        <TableHead className="whitespace-nowrap">Caractéristiques Moto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingSet.cards.map((card) => (
                        <TableRow key={card.id}>
                          <TableCell className="whitespace-nowrap">{card.npc || '–'}</TableCell>
                          <TableCell className="whitespace-nowrap">{card.nom || '–'}</TableCell>
                          <TableCell className="whitespace-nowrap">{card.prenoms || '–'}</TableCell>
                          <TableCell className="whitespace-nowrap">{card.telephone || '–'}</TableCell>
                          <TableCell className="whitespace-nowrap">{card.personneContact || '–'}</TableCell>
                          <TableCell className="whitespace-nowrap">{card.telephoneContact || '–'}</TableCell>
                          <TableCell className="whitespace-nowrap">{card.proprietaire || '–'}</TableCell>
                          <TableCell className="whitespace-nowrap">{card.telephoneProprietaire || '–'}</TableCell>
                          <TableCell className="whitespace-nowrap">{card.residence || '–'}</TableCell>
                          <TableCell className="whitespace-nowrap">{card.caracteristiquesMoto || '–'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              /* Vue liste des sauvegardes */
              <>
                {/* Barre de recherche */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, NPC..."
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

                {savedSets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune sauvegarde</p>
                    <p className="text-sm">Importez un fichier Excel et enregistrez vos cartes</p>
                  </div>
                ) : filteredSets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun résultat</p>
                    <p className="text-sm">Essayez un autre terme de recherche</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredSets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        {editingSet?.id === set.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSaveEdit}>OK</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingSet(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => handleLoad(set)} className="flex-1 text-left">
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
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={(e) => handleStartEdit(set, e)} title="Renommer">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              {showSaveButton && currentCards.length > 0 && (
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => handleUpdateCards(set, e)} title="Mettre à jour avec les cartes actuelles">
                                  <Save className="w-4 h-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(set.id, set.name); }} title="Supprimer">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedCardsManager;
