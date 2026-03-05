import { lazy } from 'react';

/**
 * Déclaration centralisée de toutes les routes de l'application.
 * Chaque route définit son chemin, composant, et si elle nécessite l'authentification.
 */

const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const EditCard = lazy(() => import('@/pages/EditCard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export interface AppRoute {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType>;
  protected: boolean;
  label: string;
}

export const routes: AppRoute[] = [
  { path: '/', component: Index, protected: true, label: 'Accueil' },
  { path: '/edit/:cardId', component: EditCard, protected: true, label: 'Édition de carte' },
  { path: '/login', component: Login, protected: false, label: 'Connexion' },
  { path: '*', component: NotFound, protected: false, label: '404' },
];
