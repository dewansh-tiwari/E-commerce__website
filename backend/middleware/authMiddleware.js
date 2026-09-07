import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'freshkart_secret_jwt_key_2026_production';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      // Fetch user profile from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role, status, coins, store_name, gst_number, business_type, created_at')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        return res.status(401).json({ message: 'User not found or token invalid' });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({ message: 'Account has been blocked. Please contact support.' });
      }

      // Map id and _id for compatibility
      req.user = {
        ...user,
        _id: user.id
      };

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

export const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};
