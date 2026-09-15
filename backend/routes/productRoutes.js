import express from 'express';
import Product from '../models/Product.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all products with rich filtering, search, sorting & pagination
router.get('/', async (req, res) => {
  try {
    const {
      category,
      subCategory,
      search,
      brand,
      minPrice,
      maxPrice,
      dietary,
      sort,
      isDeal,
      isTrending,
      isBestSeller,
      isFreshArrival,
      page = 1,
      limit = 24
    } = req.query;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (subCategory) {
      const subCatArray = subCategory.split(',').map(s => s.trim()).filter(Boolean);
      query.subCategory = { $in: subCatArray.map(s => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')) };
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flexiblePattern = escaped.replace(/[\s-]+/g, '[\\s-]+');
      query.$or = [
        { name: { $regex: flexiblePattern, $options: 'i' } },
        { brand: { $regex: flexiblePattern, $options: 'i' } },
        { category: { $regex: flexiblePattern, $options: 'i' } },
        { subCategory: { $regex: flexiblePattern, $options: 'i' } },
        { description: { $regex: flexiblePattern, $options: 'i' } }
      ];
      if (search.toLowerCase().includes('coke')) {
        query.$or.push({ brand: { $regex: 'Coca-Cola', $options: 'i' } });
      }
      if (search.toLowerCase().includes('parle')) {
        query.$or.push({ brand: { $regex: 'Parle', $options: 'i' } });
      }
    }

    if (brand) {
      const brandArray = brand.split(',').map(b => b.trim()).filter(Boolean);
      query.brand = { $in: brandArray.map(b => new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[\s-]+/g, '[\\s-]+'), 'i')) };
    }

    if (dietary) {
      const tags = dietary.split(',');
      query.dietaryTags = { $in: tags };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (isDeal === 'true') query.isDeal = true;
    if (isTrending === 'true') query.isTrending = true;
    if (isBestSeller === 'true') query.isBestSeller = true;
    if (isFreshArrival === 'true') query.isFreshArrival = true;

    // Sorting
    let sortOptions = {};
    if (sort === 'price-low') sortOptions = { price: 1 };
    else if (sort === 'price-high') sortOptions = { price: -1 };
    else if (sort === 'rating') sortOptions = { rating: -1 };
    else if (sort === 'discount') sortOptions = { discountPercent: -1 };
    else if (sort === 'newest') sortOptions = { createdAt: -1 };
    else sortOptions = { isBestSeller: -1, rating: -1 }; // Popularity default

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortOptions).skip(skip).limit(Number(limit));

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      totalProducts: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Live Search Autocomplete Suggestions
router.get('/search-suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ suggestions: [], products: [], categories: [] });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flexiblePattern = escaped.replace(/[\s-]+/g, '[\\s-]+');
    const regex = new RegExp(flexiblePattern, 'i');

    const products = await Product.find({
      $or: [{ name: regex }, { brand: regex }, { category: regex }, { subCategory: regex }]
    }).limit(8).select('name brand category price originalPrice images weight rating stock sizes');

    const matchingCategories = await Product.distinct('category', { category: regex });
    const matchingBrands = await Product.distinct('brand', { brand: regex });

    res.json({
      products,
      categories: matchingCategories.slice(0, 4),
      brands: matchingBrands.slice(0, 4)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Post review for a product
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = {
      userName: req.user.name,
      rating: Number(rating),
      comment,
      date: new Date()
    };

    product.reviews.push(review);
    product.reviewCount = product.reviews.length;
    product.rating = Number(
      (product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length).toFixed(1)
    );

    await product.save();
    res.status(201).json({ message: 'Review added successfully', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
