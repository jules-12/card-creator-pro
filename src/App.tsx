import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/PageLayout';

// ─── Lazy-loaded pages ───────────────────────────────────────
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const EditCard = lazy(() => import('@/pages/EditCard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// ─── Query client ────────────────────────────────────────────
const queryClient = new QueryClient();

// ─── Page loader ─────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Protected route guard ───────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ─── App layout for authenticated pages ──────────────────────
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <PageLayout>{children}</PageLayout>
  </ProtectedRoute>
);

// ─── Application routes ─────────────────────────────────────
const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Public routes ─────────────────────────────────── */}
      <Route path="/login" element={<Login />} />

      {/* ── Protected routes (with layout) ────────────────── */}
      <Route path="/" element={<AppLayout><Index /></AppLayout>} />
      <Route path="/edit/:cardId" element={<AppLayout><EditCard /></AppLayout>} />

      {/* ── Fallback ──────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

// ─── App ─────────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
