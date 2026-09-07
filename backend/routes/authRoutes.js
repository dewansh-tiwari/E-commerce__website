import express from 'express';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { generateToken, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Enforce exactly 9 digits password rule
    if (!/^\d{9}$/.test(password)) {
      return res.status(400).json({ message: 'Password must be exactly 9 digits (e.g. 123456789)' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const addresses = [];
    if (location && (location.city || location.area || location.locality)) {
      addresses.push({
        title: 'Home',
        name,
        phone: phone || '',
        street: location.street || location.locality || 'Current Location',
        apartment: location.area || location.locality || '',
        city: location.city || 'Mumbai',
        state: location.state || 'Maharashtra',
        zipCode: location.zipCode || '400050',
        isDefault: true
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      addresses,
      coins: 250 // Welcome bonus SuperCoins!
    });

    // Create welcome notification
    await Notification.create({
      user: user._id,
      title: 'Welcome to Big Market 👌! 🛒',
      message: 'You have earned 250 welcome SuperCoins 🪙! Enjoy 15-minute grocery delivery.',
      type: 'reward'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      coins: user.coins,
      addresses: user.addresses,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (user.status === 'blocked') {
        return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        coins: user.coins,
        addresses: user.addresses,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
