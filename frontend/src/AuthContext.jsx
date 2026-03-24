import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ngo_token');
    if (token) {
      api.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('ngo_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('ngo_token', data.access_token);
    const me = await api.me();
    setUser(me);
    return me;
  };

  const logout = () => {
    localStorage.removeItem('ngo_token');
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
