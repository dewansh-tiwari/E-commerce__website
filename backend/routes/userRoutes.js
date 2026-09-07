import express from 'express';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Update Profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;

    if (req.body.password) {
      if (!/^\d{9}$/.test(req.body.password)) {
        return res.status(400).json({ message: 'Password must be exactly 9 digits (e.g. 123456789)' });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      coins: updatedUser.coins,
      addresses: updatedUser.addresses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add Address
router.post('/addresses', protect, async (req, res) => {
  try {
    const { title, name, phone, street, apartment, city, state, zipCode, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    const newAddress = {
      title: title || 'Home',
      name: name || user.name,
      phone: phone || user.phone,
      street,
      apartment: apartment || '',
      city,
      state,
      zipCode,
      isDefault: isDefault || user.addresses.length === 0
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Address
router.delete('/addresses/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.addressId);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Gamification: Daily SuperCoins Claim
router.post('/daily-claim', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();

    if (user.lastDailyClaim) {
      const lastClaim = new Date(user.lastDailyClaim);
      const isSameDay = lastClaim.toDateString() === now.toDateString();
      if (isSameDay) {
        return res.status(400).json({ message: 'You have already claimed today\'s daily reward! Check back tomorrow.' });
      }
    }

    const rewardCoins = 50;
    user.coins += rewardCoins;
    user.lastDailyClaim = now;
    await user.save();

    await Notification.create({
      user: user._id,
      title: 'Daily Reward Claimed! 🪙',
      message: `You received +${rewardCoins} SuperCoins for logging in today! Total balance: ${user.coins} Coins.`,
      type: 'reward'
    });

    res.json({ message: `Successfully claimed +${rewardCoins} SuperCoins!`, coins: user.coins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Wishlist operations
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    const index = user.wishlist.indexOf(productId);
    let action = 'added';
    if (index > -1) {
      user.wishlist.splice(index, 1);
      action = 'removed';
    } else {
      user.wishlist.push(productId);
    }

    await user.save();
    const updatedUser = await User.findById(req.user._id).populate('wishlist');
    res.json({ action, wishlist: updatedUser.wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
