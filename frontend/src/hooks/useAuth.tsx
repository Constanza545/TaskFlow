import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('taskflow_token');
    const storedUser = localStorage.getItem('taskflow_user');
    if (!storedToken || !storedUser) {
      setLoading(false);
      return;
    }

    // Restaurar la sesión guardada de inmediato (un JSON corrupto la invalida)...
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      setLoading(false);
      return;
    }
    setToken(storedToken);
    connectSocket(storedToken);
    setLoading(false);

    // ...y refrescarla contra el backend: si cambió el rol (o el usuario ya no
    // existe / el token expiró, donde el interceptor 401 limpia todo), la UI
    // se entera sin esperar un re-login.
    api
      .get<User>('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('taskflow_user', JSON.stringify(res.data));
      })
      .catch(() => {
        // el interceptor de api.ts ya maneja el 401; otros errores (red) no
        // deben tirar la sesión local
      });
  }, []);

  function persistSession(newToken: string, newUser: User) {
    localStorage.setItem('taskflow_token', newToken);
    localStorage.setItem('taskflow_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    connectSocket(newToken);
  }

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    persistSession(res.data.token, res.data.user);
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post('/auth/register', { name, email, password });
    persistSession(res.data.token, res.data.user);
  }

  function logout() {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    disconnectSocket();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
