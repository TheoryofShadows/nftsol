
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

declare global {
  interface Window {
    authToken?: string;
  }
}

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const savedToken = localStorage.getItem('auth_token');
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('username');
    const savedRole = localStorage.getItem('userRole');
    const savedLoginState = localStorage.getItem('isLoggedIn');

    if (savedToken && savedUserId && savedUsername && savedLoginState === 'true') {
      setToken(savedToken);
      setUser({
        id: savedUserId,
        username: savedUsername,
        role: savedRole || 'user'
      });
      setIsAuthenticated(true);
      // Set global auth token
      window.authToken = savedToken;
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    
    // Store in localStorage
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('userId', newUser.id);
    localStorage.setItem('username', newUser.username);
    localStorage.setItem('userRole', newUser.role);
    localStorage.setItem('isLoggedIn', 'true');
    
    // Set global auth token
    window.authToken = newToken;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isLoggedIn');
    
    // Clear global auth token
    delete window.authToken;
    
    // Redirect to home
    setLocation('/');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        login,
        logout,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


