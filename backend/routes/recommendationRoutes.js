import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

const formatProduct = (p) => {
  if (!p) return null;
  return {
    ...p,
    _id: p.id,
    originalPrice: Number(p.original_price),
    discountPercent: p.discount_percent,
    reviewCount: p.review_count
  };
};

// Get AI recommendations
router.get('/', async (req, res) => {
  try {
    const { category, productId } = req.query;

    let recommendedForYou = [];
    let frequentlyBoughtTogether = [];
    let similarProducts = [];

    // 1. Recommended for you (Best sellers & top ratings)
    const { data: bestSellers } = await supabase
      .from('products')
      .select('*')
      .eq('is_bestseller', true)
      .limit(8);

    recommendedForYou = (bestSellers || []).map(formatProduct);

    if (recommendedForYou.length < 8) {
      const { data: topRated } = await supabase
        .from('products')
        .select('*')
        .gte('rating', 4.5)
        .limit(8 - recommendedForYou.length);

      const formattedTop = (topRated || []).map(formatProduct);
      recommendedForYou = [...recommendedForYou, ...formattedTop];
    }

    // 2. Similar products
    if (category) {
      let simQuery = supabase.from('products').select('*').eq('category', category);
      if (productId) {
        simQuery = simQuery.neq('id', productId);
      }
      const { data: similar } = await simQuery.limit(6);
      similarProducts = (similar || []).map(formatProduct);
    }

    // 3. Frequently bought together
    if (productId) {
      const { data: curr } = await supabase.from('products').select('category').eq('id', productId).single();
      if (curr) {
        const { data: comp } = await supabase
          .from('products')
          .select('*')
          .neq('id', productId)
          .or(`category.eq.${curr.category},is_deal.eq.true,is_bestseller.eq.true`)
          .limit(3);
        frequentlyBoughtTogether = (comp || []).map(formatProduct);
      }
    } else {
      const { data: deals } = await supabase.from('products').select('*').eq('is_deal', true).limit(4);
      frequentlyBoughtTogether = (deals || []).map(formatProduct);
    }

    res.json({
      recommendedForYou,
      frequentlyBoughtTogether,
      similarProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
