import express from 'express';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to normalize product object for frontend compatibility (_id)
const formatProduct = (p) => {
  if (!p) return null;
  return {
    ...p,
    _id: p.id,
    originalPrice: Number(p.original_price),
    discountPercent: p.discount_percent,
    subCategory: p.sub_category,
    keyFeatures: p.key_features,
    dietaryTags: p.dietary_tags,
    storageInfo: p.storage_info,
    isOrganic: p.is_organic,
    isVeg: p.is_veg,
    isBestSeller: p.is_bestseller,
    isTrending: p.is_trending,
    isDeal: p.is_deal,
    isFreshArrival: p.is_fresh_arrival,
    reviewCount: p.review_count
  };
};

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

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (subCategory) {
      const subCatArray = subCategory.split(',').map(s => s.trim()).filter(Boolean);
      if (subCatArray.length > 0) {
        query = query.in('sub_category', subCatArray);
      }
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      let searchFilter = `name.ilike.%${cleanSearch}%,brand.ilike.%${cleanSearch}%,category.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%`;
      if (cleanSearch.toLowerCase().includes('coke')) {
        searchFilter += `,brand.ilike.%Coca-Cola%`;
      }
      if (cleanSearch.toLowerCase().includes('parle')) {
        searchFilter += `,brand.ilike.%Parle%`;
      }
      query = query.or(searchFilter);
    }

    if (brand) {
      const brandArray = brand.split(',').map(b => b.trim()).filter(Boolean);
      if (brandArray.length > 0) {
        query = query.in('brand', brandArray);
      }
    }

    if (dietary) {
      const tags = dietary.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        query = query.overlaps('dietary_tags', tags);
      }
    }

    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));

    if (isDeal === 'true') query = query.eq('is_deal', true);
    if (isTrending === 'true') query = query.eq('is_trending', true);
    if (isBestSeller === 'true') query = query.eq('is_bestseller', true);
    if (isFreshArrival === 'true') query = query.eq('is_fresh_arrival', true);

    // Sorting
    if (sort === 'price-low') query = query.order('price', { ascending: true });
    else if (sort === 'price-high') query = query.order('price', { ascending: false });
    else if (sort === 'rating') query = query.order('rating', { ascending: false });
    else if (sort === 'discount') query = query.order('discount_percent', { ascending: false });
    else if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else query = query.order('is_bestseller', { ascending: false }).order('rating', { ascending: false });

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    const { data: rawProducts, count, error } = await query;

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    const products = (rawProducts || []).map(formatProduct);
    const total = count || 0;

    res.json({
      products,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
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

    const cleanQ = q.trim();
    const searchFilter = `name.ilike.%${cleanQ}%,brand.ilike.%${cleanQ}%,category.ilike.%${cleanQ}%,sub_category.ilike.%${cleanQ}%`;

    const { data: matchedProducts } = await supabase
      .from('products')
      .select('id, name, brand, category, price, original_price, images, weight, rating, stock, sizes')
      .or(searchFilter)
      .limit(8);

    const products = (matchedProducts || []).map(formatProduct);

    // Categories and brands
    const categoriesSet = new Set(products.map(p => p.category).filter(Boolean));
    const brandsSet = new Set(products.map(p => p.brand).filter(Boolean));

    res.json({
      products,
      categories: Array.from(categoriesSet).slice(0, 4),
      brands: Array.from(brandsSet).slice(0, 4)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product by ID (including reviews)
router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch reviews for this product
    const { data: reviews } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', req.params.id)
      .order('created_at', { ascending: false });

    const formattedReviews = (reviews || []).map(r => ({
      userName: r.user_name,
      rating: r.rating,
      comment: r.comment,
      date: r.created_at
    }));

    res.json({
      ...formatProduct(product),
      reviews: formattedReviews
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Post review for a product
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    // Insert review
    const { error: insertError } = await supabase
      .from('product_reviews')
      .insert({
        product_id: req.params.id,
        user_id: req.user.id,
        user_name: req.user.name,
        rating: Number(rating),
        comment
      });

    if (insertError) {
      return res.status(500).json({ message: insertError.message });
    }

    // Fetch updated product
    const { data: updatedProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    const { data: reviews } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', req.params.id)
      .order('created_at', { ascending: false });

    res.status(201).json({
      message: 'Review added successfully',
      product: {
        ...formatProduct(updatedProduct),
        reviews: (reviews || []).map(r => ({
          userName: r.user_name,
          rating: r.rating,
          comment: r.comment,
          date: r.created_at
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
