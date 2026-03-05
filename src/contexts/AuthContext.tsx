import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthUser } from '@/services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then(u => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const u = await authService.login(email, password);
    if (u) { setUser(u); return true; }
    return false;
  };

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    const u = await authService.register(email, password, fullName);
    if (u) { setUser(u); return true; }
    return false;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
