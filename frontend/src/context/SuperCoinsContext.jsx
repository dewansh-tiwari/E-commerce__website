import React, { createContext, useContext, useState } from 'react';
import { userService } from '../services/api';
import { useAuth } from './AuthContext';

const SuperCoinsContext = createContext();

export const SuperCoinsProvider = ({ children }) => {
  const { user, updateUserCoins, setIsAuthModalOpen } = useAuth();
  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);

  const claimDailyReward = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const res = await userService.claimDailyCoins();
      updateUserCoins(res.data.coins);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const spinWheel = async () => {
    if (!user) return;
    setIsSpinning(true);
    setSpinResult(null);

    // Simulate 2.5 second wheel spin
    setTimeout(async () => {
      const possibleWins = [20, 50, 75, 100, 150];
      const wonAmount = possibleWins[Math.floor(Math.random() * possibleWins.length)];
      setSpinResult(wonAmount);
      setIsSpinning(false);
      updateUserCoins((user.coins || 0) + wonAmount);
    }, 2500);
  };

  return (
    <SuperCoinsContext.Provider value={{
      isCoinsModalOpen,
      setIsCoinsModalOpen,
      claimDailyReward,
      spinWheel,
      isSpinning,
      spinResult
    }}>
      {children}
    </SuperCoinsContext.Provider>
  );
};

export const useSuperCoins = () => useContext(SuperCoinsContext);
