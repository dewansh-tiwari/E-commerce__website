import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SuperCoinsProvider } from './context/SuperCoinsContext';
import { NetworkProvider, useNetwork } from './context/NetworkContext';

import { Navbar } from './components/Navbar';
import { CategoryNav } from './components/CategoryNav';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { SuperCoinsWidget } from './components/SuperCoinsWidget';
import { AIChatBot } from './components/AIChatBot';
import { BottomNav } from './components/BottomNav';
import { OfflineView, NetworkBanner, ReconnectedToast } from './components/OfflineView';

import { HomePage } from './pages/HomePage';
import { ProductListPage } from './pages/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { WishlistPage } from './pages/WishlistPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CartPage } from './pages/CartPage';

function MainAppLayout() {
  const { isOffline } = useNetwork();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Network Offline Banner */}
      <NetworkBanner />
      
      {/* Header Bar */}
      <Navbar />

      {/* Category Bar - Concealed while offline to prevent showing categories/products */}
      {!isOffline && <CategoryNav />}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {isOffline ? (
          /* When internet is cut, no products are displayed - BigBasket-style offline screen */
          <OfflineView />
        ) : (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/search" element={<ProductListPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/orders/track" element={<OrderTrackingPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Routes>
        )}
      </main>

      {/* Footer & Mobile Bottom Navigation */}
      <Footer />
      {!isOffline && <BottomNav />}

      {/* Global Modals & Drawers - Locked while offline */}
      {!isOffline && <CartDrawer />}
      <AuthModal />
      {!isOffline && <SuperCoinsWidget />}
      {!isOffline && <AIChatBot />}

      {/* Back Online Reconnection Toast */}
      <ReconnectedToast />
    </div>
  );
}

export function App() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <SuperCoinsProvider>
              <Router>
                <MainAppLayout />
              </Router>
            </SuperCoinsProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </NetworkProvider>
  );
}

export default App;
