import BeninFlagStripe from './BeninFlagStripe';
import UserMenu from './UserMenu';
import logoGauche from '@/assets/logo-gauche.png';
import logoDroit from '@/assets/logo-droit.png';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-card shadow-sm">
      <BeninFlagStripe height="4px" />
      <div className="container py-3 md:py-6 px-3 md:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={logoDroit}
                alt="République du Bénin"
                className="w-6 h-6 md:w-10 md:h-10 object-contain"
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-sm sm:text-lg md:text-2xl text-foreground truncate">
                Générateur de Cartes 
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                Mairie de Cotonou - Carte de Recensement Taxi-Moto
              </p>
            </div>
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={logoGauche}
                alt="Ville de Cotonou"
                className="w-6 h-6 md:w-10 md:h-10 object-contain"
                loading="lazy"
              />
            </div>
          </div>
          
          {user && <UserMenu />}
        </div>
      </div>
    </header>
  );
};

export default Header;
