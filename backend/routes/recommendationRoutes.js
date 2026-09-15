import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Get AI recommendations
router.get('/', async (req, res) => {
  try {
    const { category, productId } = req.query;

    let recommendedForYou = [];
    let frequentlyBoughtTogether = [];
    let similarProducts = [];

    // Recommended for you (High rating & best sellers)
    recommendedForYou = await Product.find({ isBestSeller: true }).limit(8);
    if (recommendedForYou.length < 8) {
      const extra = await Product.find({ rating: { $gte: 4.5 } }).limit(8 - recommendedForYou.length);
      recommendedForYou = [...recommendedForYou, ...extra];
    }

    if (category) {
      similarProducts = await Product.find({ category, _id: { $ne: productId } }).limit(6);
    }

    if (productId) {
      const currentProduct = await Product.findById(productId);
      if (currentProduct) {
        // AI rule: find complementary products in Dairy/Bakery/Snacks
        frequentlyBoughtTogether = await Product.find({
          _id: { $ne: productId },
          $or: [
            { category: currentProduct.category },
            { isDeal: true },
            { isBestSeller: true }
          ]
        }).limit(3);
      }
    } else {
      frequentlyBoughtTogether = await Product.find({ isDeal: true }).limit(4);
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
