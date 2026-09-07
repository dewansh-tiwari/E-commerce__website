import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Update Profile
router.put('/profile', protect, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;

    if (req.body.password) {
      if (!/^\d{9}$/.test(req.body.password)) {
        return res.status(400).json({ message: 'Password must be exactly 9 digits (e.g. 123456789)' });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(req.body.password, salt);
    }

    updates.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ message: error.message });

    const { data: addresses } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', updatedUser.id);

    res.json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      coins: updatedUser.coins,
      addresses: addresses || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add Address
router.post('/addresses', protect, async (req, res) => {
  try {
    const { title, name, phone, street, apartment, city, state, zipCode, isDefault } = req.body;

    if (isDefault) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', req.user.id);
    }

    const { error: insertErr } = await supabase
      .from('user_addresses')
      .insert({
        user_id: req.user.id,
        title: title || 'Home',
        name: name || req.user.name,
        phone: phone || req.user.phone,
        street: street || '',
        apartment: apartment || '',
        city: city || '',
        state: state || '',
        zip_code: zipCode || '',
        is_default: Boolean(isDefault)
      });

    if (insertErr) return res.status(500).json({ message: insertErr.message });

    const { data: addresses } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_default', { ascending: false });

    res.status(201).json(addresses || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Address
router.delete('/addresses/:addressId', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', req.params.addressId)
      .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ message: error.message });

    const { data: addresses } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', req.user.id);

    res.json(addresses || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Gamification: Daily SuperCoins Claim
router.post('/daily-claim', protect, async (req, res) => {
  try {
    // Try Supabase RPC first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('claim_daily_supercoins', {
      p_user_id: req.user.id
    });

    if (!rpcErr && rpcData) {
      if (!rpcData.success) {
        return res.status(400).json({ message: rpcData.message });
      }
      return res.json({ message: rpcData.message, coins: rpcData.coins });
    }

    // Fallback: Check and claim via direct query
    const { data: user } = await supabase
      .from('users')
      .select('coins, last_daily_claim')
      .eq('id', req.user.id)
      .single();

    const now = new Date();
    if (user.last_daily_claim) {
      const lastClaim = new Date(user.last_daily_claim);
      if (lastClaim.toDateString() === now.toDateString()) {
        return res.status(400).json({ message: "You have already claimed today's daily reward! Check back tomorrow." });
      }
    }

    const rewardCoins = 50;
    const newCoins = (user.coins || 0) + rewardCoins;

    await supabase
      .from('users')
      .update({ coins: newCoins, last_daily_claim: now.toISOString() })
      .eq('id', req.user.id);

    await supabase.from('notifications').insert({
      user_id: req.user.id,
      title: 'Daily Reward Claimed! 🪙',
      message: `You received +${rewardCoins} SuperCoins for logging in today! Total balance: ${newCoins} Coins.`,
      type: 'reward'
    });

    res.json({ message: `Successfully claimed +${rewardCoins} SuperCoins!`, coins: newCoins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Wishlist operations
router.get('/wishlist', protect, async (req, res) => {
  try {
    const { data: wishlistEntries, error } = await supabase
      .from('user_wishlist')
      .select('product_id, products(*)')
      .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ message: error.message });

    const products = (wishlistEntries || [])
      .map(entry => entry.products)
      .filter(Boolean)
      .map(p => ({
        ...p,
        _id: p.id,
        originalPrice: Number(p.original_price),
        discountPercent: p.discount_percent,
        reviewCount: p.review_count
      }));

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const productId = req.params.productId;

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('user_wishlist')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .single();

    let action = 'added';
    if (existing) {
      await supabase
        .from('user_wishlist')
        .delete()
        .eq('user_id', req.user.id)
        .eq('product_id', productId);
      action = 'removed';
    } else {
      await supabase
        .from('user_wishlist')
        .insert({
          user_id: req.user.id,
          product_id: productId
        });
    }

    // Return updated wishlist
    const { data: wishlistEntries } = await supabase
      .from('user_wishlist')
      .select('product_id, products(*)')
      .eq('user_id', req.user.id);

    const wishlist = (wishlistEntries || [])
      .map(entry => entry.products)
      .filter(Boolean)
      .map(p => ({
        ...p,
        _id: p.id,
        originalPrice: Number(p.original_price),
        discountPercent: p.discount_percent
      }));

    res.json({ action, wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return res.status(500).json({ message: error.message });

    const formatted = (notifications || []).map(n => ({
      ...n,
      _id: n.id,
      isRead: n.is_read,
      createdAt: n.created_at
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
