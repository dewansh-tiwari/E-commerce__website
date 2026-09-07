/**
 * Utility to extract and compute selectable product sizes / pack variants
 * along with dynamic, realistic quantity-based pricing.
 */

// Helper to parse unit and quantitative magnitude
const parseUnitAndValue = (str) => {
  if (!str) return null;
  const s = str.trim().toLowerCase();

  // Multi-pack indicators
  if (s.includes('pack of 2') || s.includes('double pack') || s.includes('twin saver') || s.includes('twin pack') || s.includes('(2-pack)') || s.includes('(2x)')) {
    return { type: 'pack', value: 2 };
  }
  if (s.includes('pack of 3') || s.includes('3-pack') || s.includes('triple pack') || s.includes('(3-pack)') || s.includes('(3x)')) {
    return { type: 'pack', value: 3 };
  }
  if (s.includes('pack of 4') || s.includes('family value') || s.includes('family saver') || s.includes('value pack') || s.includes('4-pack') || s.includes('(4-pack)') || s.includes('(4x)')) {
    return { type: 'pack', value: 4 };
  }
  const packMatch = s.match(/(?:pack of|pack|units)\s*(\d+)/i);
  if (packMatch) {
    return { type: 'pack', value: parseInt(packMatch[1], 10) };
  }

  // Volume: Litres / ml
  const lMatch = s.match(/([\d.]+)\s*l(?:itre|iter)?\b/i);
  if (lMatch) return { type: 'volume', ml: parseFloat(lMatch[1]) * 1000 };
  const mlMatch = s.match(/([\d.]+)\s*ml\b/i);
  if (mlMatch) return { type: 'volume', ml: parseFloat(mlMatch[1]) };

  // Weight: Kilograms / grams
  const kgMatch = s.match(/([\d.]+)\s*kg\b/i);
  if (kgMatch) return { type: 'weight', g: parseFloat(kgMatch[1]) * 1000 };
  const gMatch = s.match(/([\d.]+)\s*g(?:m|ram)?\b/i);
  if (gMatch) return { type: 'weight', g: parseFloat(gMatch[1]) };

  // Pieces / Count
  const pcsMatch = s.match(/([\d.]+)\s*(?:pcs|pieces|units|tray)\b/i);
  if (pcsMatch) return { type: 'pcs', count: parseFloat(pcsMatch[1]) };

  return null;
};

/**
 * Calculates accurate selling price, MRP, and discount for a selected pack size
 */
export const getProductPriceForSize = (product, targetSizeStr) => {
  if (!product) {
    return { price: 0, originalPrice: 0, discountPercent: 0, savings: 0 };
  }

  const basePrice = Number(product.price) || 0;
  const baseOriginalPrice = Number(product.originalPrice) || basePrice;
  const baseWeightStr = (product.weight || '').trim();

  // If size matches base product weight, return base pricing
  if (!targetSizeStr || targetSizeStr === baseWeightStr) {
    const savings = Math.max(0, baseOriginalPrice - basePrice);
    const discountPercent = baseOriginalPrice > basePrice 
      ? Math.round((savings / baseOriginalPrice) * 100) 
      : 0;
    return {
      price: basePrice,
      originalPrice: baseOriginalPrice,
      discountPercent,
      savings
    };
  }

  const baseParsed = parseUnitAndValue(baseWeightStr);
  const targetParsed = parseUnitAndValue(targetSizeStr);

  let multiplier = 1;
  let bulkDiscount = 1;

  if (targetParsed?.type === 'pack') {
    multiplier = targetParsed.value;
    // Bulk combo savings
    bulkDiscount = multiplier >= 4 ? 0.88 : multiplier === 3 ? 0.91 : 0.94;
  } else if (baseParsed && targetParsed && baseParsed.type === targetParsed.type) {
    if (baseParsed.type === 'volume') multiplier = targetParsed.ml / baseParsed.ml;
    else if (baseParsed.type === 'weight') multiplier = targetParsed.g / baseParsed.g;
    else if (baseParsed.type === 'pcs') multiplier = targetParsed.count / baseParsed.count;

    if (multiplier >= 3.5) bulkDiscount = 0.88;
    else if (multiplier >= 1.8) bulkDiscount = 0.93;
    else if (multiplier < 0.8) bulkDiscount = 1.10; // Packaging overhead for tiny pouches
  } else {
    // Descriptive naming heuristics
    const t = targetSizeStr.toLowerCase();
    if (t.includes('jumbo') || t.includes('large') || t.includes('saver')) multiplier = 2.2;
    else if (t.includes('medium')) multiplier = 1.4;
    else if (t.includes('small') || t.includes('mini')) multiplier = 0.7;
    else if (t.includes('xxl') || t.includes('36')) multiplier = 1.05; // Plus size apparel
    else multiplier = 1;
  }

  // Calculate final selling price
  const price = Math.max(5, Math.round(basePrice * multiplier * bulkDiscount));

  // Determine realistic retail MRP (original price)
  const baseDiscountRatio = baseOriginalPrice > basePrice 
    ? (baseOriginalPrice - basePrice) / baseOriginalPrice 
    : 0.10;

  // Larger packs get perceived higher discount value
  const effectiveDiscountRatio = Math.min(0.35, Math.max(baseDiscountRatio, multiplier >= 2 ? baseDiscountRatio + 0.05 : baseDiscountRatio));
  const rawOriginalPrice = Math.max(price + 2, Math.round(price / (1 - effectiveDiscountRatio)));
  // Round to nearest multiple of 5 for clean authentic retail presentation
  const originalPrice = Math.max(price + 1, Math.round(rawOriginalPrice / 5) * 5 || rawOriginalPrice);
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  return {
    price,
    originalPrice,
    discountPercent,
    savings: originalPrice - price
  };
};

/**
 * Returns array of size string labels for a given product
 */
export const getProductSizes = (product) => {
  if (!product) return [];

  // 1. If explicit sizes array is configured in product database
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    return product.sizes;
  }

  const category = (product.category || '').toLowerCase();
  const subCategory = (product.subCategory || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const baseWeight = (product.weight || '').trim();

  // 2. Footwear (Nike, Puma, Bata, Shoes, Sandals, Chappals, Loafers)
  if (
    category.includes('footwear') ||
    subCategory.includes('footwear') ||
    name.includes('shoes') ||
    name.includes('sneaker') ||
    name.includes('runner') ||
    name.includes('running') ||
    name.includes('loafers') ||
    name.includes('chappal') ||
    name.includes('sandals') ||
    name.includes('flats') ||
    name.includes('boots')
  ) {
    return ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'];
  }

  // 3. Fashion Bottomwear (Jeans, Trousers, Chinos, Cargo)
  if (
    subCategory.includes('bottomwear') ||
    name.includes('jeans') ||
    name.includes('trouser') ||
    name.includes('pants') ||
    name.includes('denim')
  ) {
    return ['28', '30', '32', '34', '36'];
  }

  // 4. Fashion Topwear / Clothing (T-Shirts, Hoodies, Shirts, Kurtis, Sweatshirts)
  if (
    category.includes('fashion') ||
    category.includes('apparel') ||
    subCategory.includes('topwear') ||
    name.includes('t-shirt') ||
    name.includes('tee') ||
    name.includes('hoodie') ||
    name.includes('shirt') ||
    name.includes('kurti') ||
    name.includes('sweatshirt') ||
    name.includes('jacket')
  ) {
    return ['S', 'M', 'L', 'XL', 'XXL'];
  }

  // 5. Beverages / Soft Drinks / Juices (Coca-Cola, Pepsi, Frooti, Real, etc.)
  if (
    category.includes('beverage') ||
    name.includes('coca-cola') ||
    name.includes('coke') ||
    name.includes('sprite') ||
    name.includes('thums up') ||
    name.includes('juice') ||
    name.includes('drink') ||
    name.includes('soda')
  ) {
    if (baseWeight && !['250 ml', '750 ml', '1.25 L', '2.25 L'].includes(baseWeight)) {
      return [baseWeight, '250 ml Can', '750 ml Pet', '1.25 L Bottle', '2.25 L Party Pack'];
    }
    return ['180 ml Can', '250 ml Bottle', '750 ml Bottle', '1.25 L Saver', '2.25 L Party Pack'];
  }

  // 6. Oral Care / Personal Care (Colgate, Toothpaste, Soaps, Shampoos)
  if (
    category.includes('personal') ||
    name.includes('colgate') ||
    name.includes('toothpaste') ||
    name.includes('shampoo') ||
    name.includes('soap') ||
    name.includes('lotion') ||
    name.includes('face wash')
  ) {
    if (baseWeight) {
      return [baseWeight, 'Twin Saver (2-Pack)', 'Family Value (4-Pack)'];
    }
    return ['100 g', '150 g', '200 g Saver Pack', 'Twin Pack (2 x 150g)'];
  }

  // 7. Snacks, Biscuits & Munchies (Parle-G, Bourbon, Monaco, Lay's, Haldiram)
  if (
    category.includes('snack') ||
    category.includes('munchies') ||
    category.includes('bakery') ||
    name.includes('parle') ||
    name.includes('biscuit') ||
    name.includes('chips') ||
    name.includes('rusk') ||
    name.includes('cookies')
  ) {
    if (baseWeight) {
      return [baseWeight, 'Pack of 2', 'Family Saver Box'];
    }
    return ['100 g', '250 g', '500 g Jumbo Pack'];
  }

  // 8. Rice, Atta, Dals & Pulses
  if (
    category.includes('rice') ||
    category.includes('atta') ||
    category.includes('pulse') ||
    category.includes('dal') ||
    name.includes('atta') ||
    name.includes('rice') ||
    name.includes('dal')
  ) {
    return ['1 kg', '2 kg', '5 kg Bag', '10 kg Saver'];
  }

  // 9. Dairy & Breakfast (Milk, Curd, Ghee, Butter, Paneer)
  if (category.includes('dairy') || name.includes('milk') || name.includes('curd') || name.includes('ghee') || name.includes('paneer')) {
    if (baseWeight) {
      return [baseWeight, 'Double Pack (2x)', 'Value Family Pack'];
    }
    return ['200 g', '500 g', '1 kg'];
  }

  // 10. Fruits & Vegetables
  if (category.includes('fruit') || category.includes('vegetable')) {
    return ['250 g', '500 g', '1 kg', '2 kg'];
  }

  // 11. Generic fallback based on weight
  if (baseWeight) {
    return [baseWeight, 'Double Pack (2x)', 'Value Pack (4x)'];
  }

  return ['Standard', 'Medium', 'Large'];
};

/**
 * Returns structured variants with size label and pre-computed pricing
 */
export const getProductVariants = (product) => {
  const sizes = getProductSizes(product);
  return sizes.map((size) => {
    const pricing = getProductPriceForSize(product, size);
    return {
      size,
      label: size,
      isDefault: size === (product.weight || sizes[0]),
      ...pricing
    };
  });
};

export const getProductDefaultSize = (product) => {
  if (!product) return 'Standard';
  const sizes = getProductSizes(product);
  if (product.weight && sizes.includes(product.weight)) {
    return product.weight;
  }
  if (sizes.includes('UK 8')) return 'UK 8';
  if (sizes.includes('UK 7')) return 'UK 7';
  if (sizes.includes('M')) return 'M';
  if (sizes.includes('32')) return '32';
  return sizes[0] || product.weight || 'Standard';
};
