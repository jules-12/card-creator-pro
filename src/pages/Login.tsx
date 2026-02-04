import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import BeninFlagStripe from '@/components/BeninFlagStripe';
import logoGauche from '@/assets/logo-gauche.png';
import logoDroit from '@/assets/logo-droit.png';

const Login: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginMode) {
        const success = await login(email, password);
        if (success) {
          navigate('/');
        } else {
          setError('Email ou mot de passe incorrect');
        }
      } else {
        if (!fullName.trim()) {
          setError('Veuillez entrer votre nom complet');
          setIsLoading(false);
          return;
        }
        const success = await register(email, password, fullName);
        if (success) {
          navigate('/');
        } else {
          setError('Cet email est déjà utilisé');
        }
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BeninFlagStripe height="6px" />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header avec logos */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src={logoGauche} alt="Logo Bénin" className="h-16 object-contain" />
            <div className="text-center">
              <h1 className="font-heading text-xl font-bold text-foreground">
                MAIRIE DE COTONOU
              </h1>
              <p className="text-sm text-muted-foreground">
                Générateur de Cartes B2
              </p>
            </div>
            <img src={logoDroit} alt="Logo Mairie" className="h-16 object-contain" />
          </div>

          {/* Formulaire */}
          <div className="bg-card border rounded-xl p-6 shadow-lg">
            <h2 className="font-heading text-xl font-bold text-foreground mb-6 text-center">
              {isLoginMode ? 'Connexion' : 'Créer un compte'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLoginMode}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-benin-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isLoginMode ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Créer le compte
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError(null);
                }}
                className="text-sm text-primary hover:underline"
              >
                {isLoginMode
                  ? "Pas encore de compte ? S'inscrire"
                  : 'Déjà un compte ? Se connecter'}
              </button>
            </div>

            {/* Comptes de démonstration */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Comptes de démonstration :
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>📧 admin@mairie-cotonou.bj / admin123</p>
                <p>📧 agent@mairie-cotonou.bj / agent123</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BeninFlagStripe height="4px" />
    </div>
  );
};

export default Login;
