import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const router = express.Router();

// Get all categories with updated product counts
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    // Dynamically calculate counts if needed
    const updatedCategories = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat.name });
        return {
          ...cat.toObject(),
          itemCount: count
        };
      })
    );

    res.json(updatedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
