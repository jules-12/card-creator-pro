import React, { useState, useEffect } from 'react';
import Spinner from '@/components/ui/spinner';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CardB2 from '@/components/CardB2';
import { Contributor } from '@/types/contributor';
import { CONTRIBUTOR_FIELDS, EMPTY_CONTRIBUTOR } from '@/constants/contributorFields';
import { useToast } from '@/hooks/use-toast';

const EditCard: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [card, setCard] = useState<Contributor | null>(null);
  const [formData, setFormData] = useState<Contributor>(EMPTY_CONTRIBUTOR);

  useEffect(() => {
    const storedCards = sessionStorage.getItem('currentCards');
    if (storedCards && cardId) {
      const cards: Contributor[] = JSON.parse(storedCards);
      const foundCard = cards.find(c => c.id === cardId);
      if (foundCard) {
        setCard(foundCard);
        setFormData(foundCard);
      } else {
        toast({
          title: 'Carte introuvable',
          description: 'La carte demandée n\'existe pas.',
          variant: 'destructive',
        });
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [cardId, navigate, toast]);

  const handleChange = (field: keyof Contributor, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const storedCards = sessionStorage.getItem('currentCards');
    if (storedCards) {
      const cards: Contributor[] = JSON.parse(storedCards);
      const updatedCards = cards.map(c => c.id === cardId ? formData : c);
      sessionStorage.setItem('currentCards', JSON.stringify(updatedCards));
      
      toast({
        title: 'Carte mise à jour',
        description: 'Les modifications ont été enregistrées.',
      });
      
      navigate('/', { state: { updatedCards } });
    }
  };

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Modifier la carte
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <h2 className="font-heading font-semibold text-lg mb-4">
              Informations du contribuable
            </h2>
            
            <div className="space-y-4">
              {CONTRIBUTOR_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    value={formData[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleSave} className="flex-1 btn-benin-primary">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-lg">
              Aperçu en temps réel
            </h2>
            <div className="flex justify-center">
              <CardB2 contributor={formData} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Les modifications s'affichent en temps réel sur la carte
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditCard;
