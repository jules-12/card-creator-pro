import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utilisateurs fictifs de démonstration
const DEMO_USERS: { email: string; password: string; fullName: string }[] = [
  { email: 'admin@mairie-cotonou.bj', password: 'admin123', fullName: 'Administrateur' },
  { email: 'agent@mairie-cotonou.bj', password: 'agent123', fullName: 'Agent Municipal' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    // Vérifier les utilisateurs enregistrés localement
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const allUsers = [...DEMO_USERS, ...registeredUsers];

    const foundUser = allUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const loggedUser: User = {
        id: btoa(foundUser.email),
        email: foundUser.email,
        fullName: foundUser.fullName,
      };
      setUser(loggedUser);
      localStorage.setItem('currentUser', JSON.stringify(loggedUser));
      return true;
    }
    return false;
  };

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const allUsers = [...DEMO_USERS, ...registeredUsers];

    // Vérifier si l'email existe déjà
    if (allUsers.some(u => u.email === email)) {
      return false;
    }

    // Enregistrer le nouvel utilisateur
    registeredUsers.push({ email, password, fullName });
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

    // Connecter automatiquement
    const loggedUser: User = {
      id: btoa(email),
      email,
      fullName,
    };
    setUser(loggedUser);
    localStorage.setItem('currentUser', JSON.stringify(loggedUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
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
