import React from 'react';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert, Signal, HelpCircle, ArrowRight } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';

export const OfflineView = () => {
  const { 
    isOffline, 
    isCheckingConnection, 
    connectionError, 
    retryConnection 
  } = useNetwork();

  if (!isOffline) return null;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 text-center animate-fadeIn">
      {/* Top Warning Ribbon */}
      <div className="w-full max-w-2xl mb-8 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-left shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">BigBasket-Style Live Inventory Shield</p>
            <p className="text-xs text-amber-800">
              Live prices and products are concealed while offline to prevent ordering out-of-stock items.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200 shrink-0">
          OFFLINE
        </span>
      </div>

      {/* Main BigBasket-Style Offline Illustration & Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 flex flex-col items-center">
        {/* Animated Visual: Offline Wifi & Grocery Bag Graphic */}
        <div className="relative mb-6">
          {/* Pulsing ring */}
          <div className="w-28 h-28 rounded-full bg-red-50 flex items-center justify-center border-4 border-red-100 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-red-600" />
            </div>
          </div>
          {/* Grocery Cart Mini Badge */}
          <div className="absolute -bottom-2 -right-2 bg-gray-900 text-white p-2 rounded-full shadow-lg border-2 border-white">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Title & Brand Subhead */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Signal className="w-3.5 h-3.5" />
          No Internet Connection
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
          You are currently offline
        </h2>

        <p className="text-sm text-gray-600 leading-relaxed max-w-md mb-6">
          Big Market requires an active internet connection to load fresh groceries, verify real-time stock, and guarantee 10-minute express delivery.
        </p>

        {/* BigBasket Checklist */}
        <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-left">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
            Quick Troubleshooting
          </p>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
              <span>Check your Wi-Fi connection or mobile data network.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
              <span>Verify that Airplane Mode is turned off on your device.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
              <span>Click <strong>"Retry Connection"</strong> once your network is restored.</span>
            </li>
          </ul>
        </div>

        {/* Error Feedback Message if retry failed */}
        {connectionError && (
          <div className="w-full mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{connectionError}</span>
          </div>
        )}

        {/* Big Action Buttons */}
        <div className="w-full">
          <button
            onClick={retryConnection}
            disabled={isCheckingConnection}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isCheckingConnection ? 'animate-spin' : ''}`} />
            {isCheckingConnection ? 'Checking Connection...' : 'Retry Connection'}
          </button>
        </div>

        {/* Diagnostic footer */}
        <p className="text-[11px] text-gray-400 mt-5">
          Big Market Live Inventory Shield • Auto-reconnect enabled
        </p>
      </div>
    </div>
  );
};

export const NetworkBanner = () => {
  const { isOffline, retryConnection, isCheckingConnection } = useNetwork();

  if (!isOffline) return null;

  return (
    <div className="bg-red-600 text-white py-2 px-4 sticky top-0 z-50 shadow-md flex items-center justify-between text-xs sm:text-sm font-medium">
      <div className="flex items-center gap-2 mx-auto sm:mx-0">
        <WifiOff className="w-4 h-4 animate-bounce" />
        <span>
          <strong>No Internet Connection:</strong> Products, categories & prices are hidden while offline.
        </span>
      </div>

      <button
        onClick={retryConnection}
        disabled={isCheckingConnection}
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white text-red-700 font-bold text-xs hover:bg-red-50 transition-colors shadow-sm disabled:opacity-75"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection ? 'animate-spin' : ''}`} />
        {isCheckingConnection ? 'Checking...' : 'Retry'}
      </button>
    </div>
  );
};

export const ReconnectedToast = () => {
  const { showReconnectedToast } = useNetwork();

  if (!showReconnectedToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-slideUp">
      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs font-bold">Back Online!</p>
        <p className="text-[11px] text-emerald-100">Live grocery inventory & pricing restored.</p>
      </div>
    </div>
  );
};
