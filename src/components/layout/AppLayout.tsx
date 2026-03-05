import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import BeninFlagStripe from '@/components/BeninFlagStripe';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-4 md:py-8 px-3 md:px-4">
        <Outlet />
      </main>

      <footer className="mt-auto">
        <div className="container py-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Mairie de Cotonou - Tous droits réservés</p>
        </div>
        <BeninFlagStripe height="4px" />
      </footer>
    </div>
  );
};

export default AppLayout;
