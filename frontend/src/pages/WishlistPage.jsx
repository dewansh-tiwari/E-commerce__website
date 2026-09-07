import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';

export const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlistItems } = useWishlist();

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" />
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">Your Saved Wishlist ({wishlistItems.length})</h1>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-3">
          <Heart className="w-12 h-12 text-gray-300 mx-auto" />
          <h2 className="text-base font-bold text-gray-900">Your wishlist is empty</h2>
          <p className="text-xs text-gray-500">Tap the heart icon on any product to save it for later.</p>
          <button onClick={() => navigate('/products')} className="bg-emerald-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl">
            Explore Groceries
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlistItems.map(item => (
            <ProductCard key={item._id || item} product={item} />
          ))}
        </div>
      )}
    </div>
  );
};
