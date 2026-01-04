import React from 'react';
import BeninFlagStripe from './BeninFlagStripe';

const Header: React.FC = () => {
  return (
    <header className="bg-card shadow-sm">
      <BeninFlagStripe height="4px" />
      <div className="container py-6">
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">🏛️</span>
          </div>
          <div className="text-center">
            <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground">
              Générateur de Cartes Professionnelles
            </h1>
            <p className="text-sm text-muted-foreground">
              Mairie de Cotonou - Secteur des Taxi-Urbain
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
            <span className="text-2xl">🌴</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
