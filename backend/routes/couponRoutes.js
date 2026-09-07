import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get active coupons
router.get('/', async (req, res) => {
  try {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true);

    if (error) return res.status(500).json({ message: error.message });

    const formatted = (coupons || []).map(c => ({
      ...c,
      _id: c.id,
      discountType: c.discount_type,
      discountValue: Number(c.discount_value),
      minOrderValue: Number(c.min_order_value),
      maxDiscount: Number(c.max_discount),
      expiresAt: c.expires_at,
      isActive: c.is_active
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validate coupon code
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Coupon code required' });
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon code' });
    }

    if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    const orderSubtotal = Number(subtotal || 0);
    const minOrderVal = Number(coupon.min_order_value || 0);

    if (orderSubtotal < minOrderVal) {
      return res.status(400).json({
        message: `Minimum order value of ₹${minOrderVal} required for this coupon`
      });
    }

    let discount = 0;
    const discountVal = Number(coupon.discount_value);
    const maxDisc = Number(coupon.max_discount || 500);

    if (coupon.discount_type === 'percentage') {
      discount = Math.round((orderSubtotal * discountVal) / 100);
      if (maxDisc && discount > maxDisc) {
        discount = maxDisc;
      }
    } else {
      discount = discountVal;
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountAmount: discount,
      description: coupon.description
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
