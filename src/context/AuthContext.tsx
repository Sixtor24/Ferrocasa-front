import { createContext, useContext, useState, type ReactNode } from 'react';
import { users } from '../data/users';

export interface User {
  id: number;
  username: string;
  email: string;
  nombre: string;
  rol: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ferrocasa_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (username: string, password: string): boolean => {
    const found = users.find(
      (u) =>
        (u.username === username || u.email === username) &&
        u.password === password
    );
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      localStorage.setItem('ferrocasa_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ferrocasa_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
