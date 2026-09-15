import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true }, // e.g. "Fruits & Vegetables", "Dairy & Breakfast"
  subCategory: { type: String, default: 'General' },
  price: { type: Number, required: true }, // Current selling price in ₹
  originalPrice: { type: Number, required: true }, // MRP before discount
  discountPercent: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 50 },
  weight: { type: String, required: true }, // e.g. "500 g", "1 L", "1 kg", "6 pcs"
  sizes: [{ type: String }], // e.g. ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'] or ['S', 'M', 'L', 'XL'] or ['250 ml', '750 ml', '1.25 L']
  unit: { type: String, default: 'pack' },
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 28 },
  images: [{ type: String, required: true }],
  description: { type: String, required: true },
  keyFeatures: [{ type: String }],
  ingredients: { type: String, default: '100% Pure & Natural' },
  nutrition: {
    calories: { type: String, default: 'N/A' },
    protein: { type: String, default: 'N/A' },
    carbs: { type: String, default: 'N/A' },
    fat: { type: String, default: 'N/A' }
  },
  storageInfo: { type: String, default: 'Store in a cool, dry place. Refrigerate after opening if applicable.' },
  isOrganic: { type: Boolean, default: false },
  isVeg: { type: Boolean, default: true },
  dietaryTags: [{ type: String }], // Veg, Organic, Sugar-Free, Gluten-Free, Low-Fat
  isBestSeller: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isDeal: { type: Boolean, default: false },
  isFreshArrival: { type: Boolean, default: false },
  reviews: [reviewSchema]
}, { timestamps: true });

// Auto calculate discount percentage if not provided
productSchema.pre('save', function (next) {
  if (this.originalPrice > this.price) {
    this.discountPercent = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  } else {
    this.discountPercent = 0;
  }
  next();
});

export default mongoose.model('Product', productSchema);
