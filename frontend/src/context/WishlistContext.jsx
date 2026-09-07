import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    if (user) {
      userService.getWishlist()
        .then(res => setWishlistItems(res.data))
        .catch(() => setWishlistItems([]));
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const toggleWishlist = async (productId) => {
    if (!user) return false;
    try {
      const res = await userService.toggleWishlist(productId);
      setWishlistItems(res.data.wishlist);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => (item._id || item) === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
