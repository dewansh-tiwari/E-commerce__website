import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('freshkart_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [selectedLocation, setSelectedLocation] = useState({
    city: 'Mumbai',
    area: 'Bandra West, 400050',
    deliveryTime: '15-20 Mins'
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('freshkart_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('freshkart_user');
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    setUser(res.data);
    setIsAuthModalOpen(false);
    return res.data;
  };

  const register = async (name, email, password, phone, location, role, storeName, gstNumber) => {
    const res = await authService.register({ name, email, password, phone, location, role, storeName, gstNumber });
    setUser(res.data);
    if (location) {
      setSelectedLocation(location);
    }
    setIsAuthModalOpen(false);
    return res.data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('freshkart_user');
  };

  const toggleShopkeeperAccount = async (storeDetails = {}) => {
    if (!user) return;
    try {
      const res = await authService.toggleShopkeeper(storeDetails);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      console.error('Failed to toggle shopkeeper account:', err);
      throw err;
    }
  };

  const updateUserCoins = (newCoins) => {
    if (user) {
      const updated = { ...user, coins: newCoins };
      setUser(updated);
    }
  };

  const isShopkeeper = user?.role === 'shopkeeper';

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      isShopkeeper,
      login,
      register,
      logout,
      toggleShopkeeperAccount,
      isAuthModalOpen,
      setIsAuthModalOpen,
      authMode,
      setAuthMode,
      selectedLocation,
      setSelectedLocation,
      updateUserCoins
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
