import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get all categories with updated product counts
router.get('/', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ message: error.message });

    // Compute dynamic item counts from products table
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category', cat.name);

        return {
          ...cat,
          _id: cat.id,
          itemCount: count !== null ? count : (cat.item_count || 0)
        };
      })
    );

    res.json(categoriesWithCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
