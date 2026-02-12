import React, { useState, useEffect, useMemo } from 'react';
import { Save, FolderOpen, Trash2, Calendar, CreditCard, Edit2, Search, X, ArrowLeft, Download, Eye, ArrowUpDown, ChevronUp, ChevronDown, Filter } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Contributor } from '@/types/contributor';
import { saveCards, getSavedCardSets, deleteCardSet, updateCardSet, SavedCardSet } from '@/utils/cardStorage';
import { useToast } from '@/hooks/use-toast';

interface SavedCardsManagerProps {
  currentCards: Contributor[];
  onLoadCards: (cards: Contributor[]) => void;
  showSaveButton?: boolean;
}

type SortField = 'npc' | 'nom' | 'prenoms' | 'telephone' | 'residence' | 'proprietaire';
type SortDirection = 'asc' | 'desc';

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
  const [selectedSetId, setSelectedSetId] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewingCard, setViewingCard] = useState<Contributor | null>(null);
  const [editingCard, setEditingCard] = useState<Contributor | null>(null);
  const [editFormData, setEditFormData] = useState<Contributor | null>(null);

  useEffect(() => {
    if (user) {
      setSavedSets(getSavedCardSets(user.id));
    }
  }, [user]);

  useEffect(() => {
    if (loadDialogOpen && user) {
      const sets = getSavedCardSets(user.id);
      setSavedSets(sets);
      if (sets.length > 0 && selectedSetId === 'all') {
        setSelectedSetId(sets[0].id);
      }
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

  const handleLoadSet = () => {
    const set = savedSets.find(s => s.id === selectedSetId);
    if (!set) return;
    onLoadCards(set.cards);
    setLoadDialogOpen(false);
    toast({
      title: 'Cartes chargées',
      description: `${set.cards.length} carte(s) restaurée(s) depuis "${set.name}"`,
    });
  };

  const handleDeleteCard = (cardId: string) => {
    const set = savedSets.find(s => s.id === selectedSetId);
    if (!set) return;
    const updatedCards = set.cards.filter(c => c.id !== cardId);
    updateCardSet(set.id, { cards: updatedCards });
    setSavedSets(getSavedCardSets(user?.id || ''));
    toast({
      title: 'Carte supprimée',
      description: 'La carte a été retirée de la sauvegarde',
    });
  };

  const handleDeleteSet = () => {
    const set = savedSets.find(s => s.id === selectedSetId);
    if (!set) return;
    deleteCardSet(set.id);
    const newSets = getSavedCardSets(user?.id || '');
    setSavedSets(newSets);
    setSelectedSetId(newSets.length > 0 ? newSets[0].id : 'all');
    toast({
      title: 'Sauvegarde supprimée',
      description: `"${set.name}" a été supprimé`,
    });
  };

  const handleEditCard = (card: Contributor) => {
    setEditingCard(card);
    setEditFormData({ ...card });
  };

  const handleSaveEditCard = () => {
    if (!editFormData || !editingCard) return;
    const set = savedSets.find(s => s.id === selectedSetId);
    if (!set) return;
    const updatedCards = set.cards.map(c => c.id === editingCard.id ? editFormData : c);
    updateCardSet(set.id, { cards: updatedCards });
    setSavedSets(getSavedCardSets(user?.id || ''));
    setEditingCard(null);
    setEditFormData(null);
    toast({ title: 'Carte modifiée', description: 'Les modifications ont été enregistrées' });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1" />
      : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const selectedSet = savedSets.find(s => s.id === selectedSetId);

  const filteredAndSortedCards = useMemo(() => {
    if (!selectedSet) return [];
    let cards = selectedSet.cards;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      cards = cards.filter(c =>
        c.npc?.toLowerCase().includes(q) ||
        c.nom?.toLowerCase().includes(q) ||
        c.prenoms?.toLowerCase().includes(q) ||
        c.telephone?.toLowerCase().includes(q) ||
        c.proprietaire?.toLowerCase().includes(q) ||
        c.residence?.toLowerCase().includes(q)
      );
    }

    cards = [...cards].sort((a, b) => {
      const valA = (a[sortField] || '').toLowerCase();
      const valB = (b[sortField] || '').toLowerCase();
      const cmp = valA.localeCompare(valB, 'fr');
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return cards;
  }, [selectedSet, searchQuery, sortField, sortDirection]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (!user) return null;

  return (
    <div className="flex gap-2">
      {/* Bouton Enregistrer */}
      {showSaveButton && (
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={currentCards.length === 0}>
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
                <label className="text-sm font-medium">Nom de la sauvegarde</label>
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
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Annuler</Button>
                <Button className="btn-benin-primary" onClick={handleSave} disabled={!saveName.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bouton Mes sauvegardes */}
      <Dialog open={loadDialogOpen} onOpenChange={(open) => {
        setLoadDialogOpen(open);
        if (!open) { setViewingCard(null); setEditingCard(null); setEditFormData(null); }
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Mes sauvegardes
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] max-h-[90vh] w-full">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? 'Modifier la carte' : viewingCard ? 'Détail de la carte' : 'Mes sauvegardes'}
            </DialogTitle>
          </DialogHeader>

          <div className="pt-2">
            {/* Vue édition de carte */}
            {editingCard && editFormData ? (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => { setEditingCard(null); setEditFormData(null); }}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'npc', label: 'N° NPC' },
                    { key: 'nom', label: 'Nom' },
                    { key: 'prenoms', label: 'Prénoms' },
                    { key: 'telephone', label: 'Téléphone' },
                    { key: 'personneContact', label: 'Personne à contacter' },
                    { key: 'telephoneContact', label: 'Tél contact' },
                    { key: 'proprietaire', label: 'Propriétaire' },
                    { key: 'telephoneProprietaire', label: 'Tél propriétaire' },
                    { key: 'residence', label: 'Résidence' },
                    { key: 'caracteristiquesMoto', label: 'Caractéristiques Moto' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium">{label}</label>
                      <Input
                        value={(editFormData as any)[key] || ''}
                        onChange={(e) => setEditFormData(prev => prev ? { ...prev, [key]: e.target.value } : prev)}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setEditingCard(null); setEditFormData(null); }}>Annuler</Button>
                  <Button className="btn-benin-primary" onClick={handleSaveEditCard}>
                    <Save className="w-4 h-4 mr-2" /> Enregistrer
                  </Button>
                </div>
              </div>
            ) : viewingCard ? (
              /* Vue détail carte */
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setViewingCard(null)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                  {[
                    { label: 'N° NPC', value: viewingCard.npc },
                    { label: 'Nom', value: viewingCard.nom },
                    { label: 'Prénoms', value: viewingCard.prenoms },
                    { label: 'Téléphone', value: viewingCard.telephone },
                    { label: 'Personne à contacter', value: viewingCard.personneContact },
                    { label: 'Tél contact', value: viewingCard.telephoneContact },
                    { label: 'Propriétaire', value: viewingCard.proprietaire },
                    { label: 'Tél propriétaire', value: viewingCard.telephoneProprietaire },
                    { label: 'Résidence', value: viewingCard.residence },
                    { label: 'Caractéristiques Moto', value: viewingCard.caracteristiquesMoto },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground font-medium">{label}</p>
                      <p className="text-sm font-semibold">{value || '–'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Vue tableau principal */
              <>
                {savedSets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Aucune sauvegarde</p>
                    <p className="text-sm">Importez un fichier Excel et enregistrez vos cartes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Barre d'outils : sélecteur de sauvegarde + recherche + tri */}
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                          <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue placeholder="Sélectionner une sauvegarde" />
                          </SelectTrigger>
                          <SelectContent>
                            {savedSets.map(set => (
                              <SelectItem key={set.id} value={set.id}>
                                {set.name} ({set.cards.length})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedSet && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(selectedSet.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[150px]">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-8 h-9 w-full"
                          />
                          {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                          <SelectTrigger className="w-[130px] h-9">
                            <Filter className="w-3.5 h-3.5 mr-1" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="npc">Trier par NPC</SelectItem>
                            <SelectItem value="nom">Trier par Nom</SelectItem>
                            <SelectItem value="prenoms">Trier par Prénoms</SelectItem>
                            <SelectItem value="residence">Trier par Résidence</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}>
                          {sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Actions globales */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        {filteredAndSortedCards.length} carte(s) {searchQuery && `sur ${selectedSet?.cards.length || 0}`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="btn-benin-primary gap-1" onClick={handleLoadSet} disabled={!selectedSet || selectedSet.cards.length === 0}>
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Charger ces cartes</span>
                          <span className="sm:hidden">Charger</span>
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={handleDeleteSet} disabled={!selectedSet}>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Supprimer la sauvegarde</span>
                          <span className="sm:hidden">Supprimer</span>
                        </Button>
                      </div>
                    </div>

                    {/* Tableau */}
                    <div className="overflow-auto max-h-[55vh] border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('npc')}>
                              <span className="flex items-center">N° NPC <SortIcon field="npc" /></span>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('nom')}>
                              <span className="flex items-center">Nom <SortIcon field="nom" /></span>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('prenoms')}>
                              <span className="flex items-center">Prénoms <SortIcon field="prenoms" /></span>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('telephone')}>
                              <span className="flex items-center">Tél <SortIcon field="telephone" /></span>
                            </TableHead>
                            <TableHead className="whitespace-nowrap">Personne à contacter</TableHead>
                            <TableHead className="whitespace-nowrap">Tél contact</TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('proprietaire')}>
                              <span className="flex items-center">Propriétaire <SortIcon field="proprietaire" /></span>
                            </TableHead>
                            <TableHead className="whitespace-nowrap">Tél propriétaire</TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('residence')}>
                              <span className="flex items-center">Résidence <SortIcon field="residence" /></span>
                            </TableHead>
                            <TableHead className="whitespace-nowrap">Caractéristiques Moto</TableHead>
                            <TableHead className="whitespace-nowrap text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedCards.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                {searchQuery ? 'Aucun résultat pour cette recherche' : 'Aucune carte dans cette sauvegarde'}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredAndSortedCards.map((card) => (
                              <TableRow key={card.id} className="hover:bg-muted/30">
                                <TableCell className="whitespace-nowrap font-medium">{card.npc || '–'}</TableCell>
                                <TableCell className="whitespace-nowrap">{card.nom || '–'}</TableCell>
                                <TableCell className="whitespace-nowrap">{card.prenoms || '–'}</TableCell>
                                <TableCell className="whitespace-nowrap">{card.telephone || '–'}</TableCell>
                                <TableCell className="whitespace-nowrap">{card.personneContact || '–'}</TableCell>
                                <TableCell className="whitespace-nowrap">{card.telephoneContact || '–'}</TableCell>
                                <TableCell className="whitespace-nowrap">{card.proprietaire || '–'}</TableCell>
                                <TableCell className="whitespace-nowrap">{card.telephoneProprietaire || '–'}</TableCell>
                                <TableCell className="whitespace-nowrap">{card.residence || '–'}</TableCell>
                                <TableCell className="whitespace-nowrap max-w-[150px] truncate">{card.caracteristiquesMoto || '–'}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex items-center gap-1 justify-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" onClick={() => setViewingCard(card)} title="Voir">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700" onClick={() => handleEditCard(card)} title="Modifier">
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCard(card.id)} title="Supprimer">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
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
