import React, { useState } from 'react';
import { X, Coins, Sparkles, Trophy, Gift, ArrowRight } from 'lucide-react';
import { useSuperCoins } from '../context/SuperCoinsContext';
import { useAuth } from '../context/AuthContext';

export const SuperCoinsWidget = () => {
  const { user } = useAuth();
  const { isCoinsModalOpen, setIsCoinsModalOpen, claimDailyReward, spinWheel, isSpinning, spinResult } = useSuperCoins();
  const [claimStatus, setClaimStatus] = useState('');

  if (!isCoinsModalOpen) return null;

  const handleClaim = async () => {
    try {
      setClaimStatus('');
      const res = await claimDailyReward();
      setClaimStatus(res.message);
    } catch (err) {
      setClaimStatus(err.response?.data?.message || 'Daily reward already claimed today.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border-4 border-amber-300">
        
        <button
          onClick={() => setIsCoinsModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-amber-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-300/30 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner border border-amber-200/50">
            <Coins className="w-10 h-10 text-amber-200 fill-amber-300 animate-bounce" />
          </div>

          <span className="bg-black/20 text-amber-200 text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase mb-1">
            Big Market 👌 Rewards
          </span>
          <h3 className="text-2xl font-extrabold">SuperCoins Rewards 🪙</h3>
          <p className="text-xs text-amber-100 mt-1 max-w-xs">
            Earn coins on every grocery purchase & daily login. 100 Coins = ₹10 Order Discount!
          </p>

          <div className="bg-black/25 backdrop-blur-md px-6 py-3 rounded-2xl my-4 border border-amber-300/40">
            <span className="text-xs uppercase font-bold text-amber-200 block">Your Coin Balance</span>
            <span className="text-3xl font-black text-amber-200 tracking-tight">
              🪙 {user ? user.coins : 250} <span className="text-sm font-normal">Coins</span>
            </span>
          </div>

          {claimStatus && (
            <div className="bg-black/30 p-2.5 rounded-xl text-xs font-bold text-amber-100 my-2">
              {claimStatus}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full mt-2">
            <button
              onClick={handleClaim}
              className="bg-white text-amber-900 hover:bg-amber-100 font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Gift className="w-4 h-4 text-amber-600" />
              <span>Claim Daily +50</span>
            </button>

            <button
              onClick={spinWheel}
              disabled={isSpinning}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>{isSpinning ? 'Spinning...' : 'Spin Daily Wheel'}</span>
            </button>
          </div>

          {/* Spin Result Feedback */}
          {spinResult && (
            <div className="mt-3 bg-emerald-900/90 text-amber-200 font-extrabold text-xs p-2.5 rounded-xl animate-bounce">
              🎉 Congratulations! You won +{spinResult} SuperCoins!
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-amber-400/40 text-[11px] text-amber-100 font-medium">
            💡 Tip: Coins can be selected as payment discount during checkout!
          </div>

        </div>

      </div>
    </div>
  );
};
