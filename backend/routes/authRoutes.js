import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { generateToken, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, location, role, storeName, gstNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Enforce exactly 9 digits password rule
    if (!/^\d{9}$/.test(password)) {
      return res.status(400).json({ message: 'Password must be exactly 9 digits (e.g. 123456789)' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const assignedRole = role === 'shopkeeper' ? 'shopkeeper' : 'customer';
    const startingCoins = assignedRole === 'shopkeeper' ? 500 : 250;

    // Insert user into Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        password_hash,
        phone: phone || '',
        role: assignedRole,
        status: 'active',
        store_name: storeName || (assignedRole === 'shopkeeper' ? `${name}'s Kirana Store` : ''),
        gst_number: gstNumber || '',
        business_type: 'Kirana & Retail Store',
        coins: startingCoins
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ message: insertError.message });
    }

    // Add initial address if location was provided
    let addresses = [];
    if (location && (location.city || location.area || location.locality)) {
      const { data: addrData } = await supabase
        .from('user_addresses')
        .insert({
          user_id: newUser.id,
          title: assignedRole === 'shopkeeper' ? 'Store' : 'Home',
          name,
          phone: phone || '',
          street: location.street || location.locality || 'Current Location',
          apartment: location.area || location.locality || '',
          city: location.city || 'Mumbai',
          state: location.state || 'Maharashtra',
          zip_code: location.zipCode || '400050',
          is_default: true
        })
        .select();

      addresses = addrData || [];
    }

    // Create welcome notification
    await supabase.from('notifications').insert({
      user_id: newUser.id,
      title: assignedRole === 'shopkeeper'
        ? 'Welcome Shopkeeper Partner! 🏪'
        : 'Welcome to Big Market 👌! 🛒',
      message: assignedRole === 'shopkeeper'
        ? 'Your Shopkeeper Wholesale account is active! Enjoy automatic ₹500 OFF above ₹2,999 and ₹1,599 OFF above ₹9,999.'
        : 'You have earned 250 welcome SuperCoins 🪙! Enjoy 15-minute grocery delivery.',
      type: 'reward'
    });

    res.status(201).json({
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      shopDetails: {
        storeName: newUser.store_name,
        gstNumber: newUser.gst_number,
        businessType: newUser.business_type
      },
      coins: newUser.coins,
      addresses,
      token: generateToken(newUser.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    // Fetch user addresses
    const { data: addresses } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopDetails: {
        storeName: user.store_name,
        gstNumber: user.gst_number,
        businessType: user.business_type
      },
      coins: user.coins,
      addresses: addresses || [],
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle / Upgrade account to Shopkeeper role
router.post('/toggle-shopkeeper', protect, async (req, res) => {
  try {
    const newRole = req.user.role === 'shopkeeper' ? 'customer' : 'shopkeeper';
    const storeName = req.body.storeName || (newRole === 'shopkeeper' ? `${req.user.name}'s Kirana Store` : '');
    const gstNumber = req.body.gstNumber || '';

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        role: newRole,
        store_name: storeName,
        gst_number: gstNumber,
        business_type: req.body.businessType || 'Kirana & Retail Store',
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ message: error.message });

    const { data: addresses } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', updatedUser.id);

    res.json({
      message: `Account role updated to ${newRole}`,
      user: {
        _id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        shopDetails: {
          storeName: updatedUser.store_name,
          gstNumber: updatedUser.gst_number,
          businessType: updatedUser.business_type
        },
        coins: updatedUser.coins,
        addresses: addresses || [],
        token: generateToken(updatedUser.id)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, status, coins, store_name, gst_number, business_type, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ message: 'User not found' });

    const { data: addresses } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id);

    res.json({
      _id: user.id,
      ...user,
      shopDetails: {
        storeName: user.store_name,
        gstNumber: user.gst_number,
        businessType: user.business_type
      },
      addresses: addresses || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
