import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('platos_token');
    const savedUser = localStorage.getItem('platos_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { /* ignore */ }
      API.get('/auth/me')
        .then(res => {
          const u = res.data.user || res.data;
          setUser(u);
          localStorage.setItem('platos_user', JSON.stringify(u));
        })
        .catch(() => {
          localStorage.removeItem('platos_token');
          localStorage.removeItem('platos_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token, user: u } = res.data;
    localStorage.setItem('platos_token', token);
    localStorage.setItem('platos_user', JSON.stringify(u));
    setUser(u);
    toast.success(`Welcome back, ${u.name}!`);
    return u;
  };

  const register = async (data) => {
    const res = await API.post('/auth/register', data);
    const { token, user: u } = res.data;
    localStorage.setItem('platos_token', token);
    localStorage.setItem('platos_user', JSON.stringify(u));
    setUser(u);
    toast.success('Account created successfully!');
    return u;
  };

  const logout = () => {
    localStorage.removeItem('platos_token');
    localStorage.removeItem('platos_user');
    setUser(null);
    toast.success('Logged out');
  };

  const updateProfile = async (data) => {
    const res = await API.put('/auth/me', data);
    const u = res.data.user || res.data;
    setUser(u);
    localStorage.setItem('platos_user', JSON.stringify(u));
    toast.success('Profile updated');
    return u;
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentUser: user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
