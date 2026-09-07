# Big Market 👌 — Backend Architecture, Workflow, Pipeline & Supabase Migration Specification

This document provides a comprehensive, function-by-function analysis of the entire **Big Market 👌** backend system, including all database models, business workflows, aggregation pipelines, security middlewares, and the complete migration blueprint from **MongoDB / Mongoose** to **Supabase (PostgreSQL + Supabase JS / RPC)**.

---

## Table of Contents
1. [System Overview & Tech Stack](#1-system-overview--tech-stack)
2. [Current Architecture & File Map](#2-current-architecture--file-map)
3. [MongoDB Models vs. Supabase Relational Schema (DDL)](#3-mongodb-models-vs-supabase-relational-schema-ddl)
4. [Complete Backend Workflows & Logic Pipelines](#4-complete-backend-workflows--logic-pipelines)
   - [Workflow 1: Order Checkout & Atomic Stock Allocation](#workflow-1-order-checkout--atomic-stock-allocation)
   - [Workflow 2: First-3-Orders Welcome Offer Verification](#workflow-2-first-3-orders-welcome-offer-verification)
   - [Workflow 3: Product Search, Multi-Filter, Faceting & Aggregation](#workflow-3-product-search-multi-filter-faceting--aggregation)
   - [Workflow 4: Product Reviews & Dynamic Rating Recalculation](#workflow-4-product-reviews--dynamic-rating-recalculation)
   - [Workflow 5: User Gamification & Daily SuperCoins Claim](#workflow-5-user-gamification--daily-supercoins-claim)
   - [Workflow 6: Wishlist Toggle & Lookup](#workflow-6-wishlist-toggle--lookup)
   - [Workflow 7: Coupon Validation Engine](#workflow-7-coupon-validation-engine)
   - [Workflow 8: Admin Dashboard Metrics & Financial Aggregations](#workflow-8-admin-dashboard-metrics--financial-aggregations)
   - [Workflow 9: AI Assistant Multi-Intent Engine & Instant Wallet Refund](#workflow-9-ai-assistant-multi-intent-engine--instant-wallet-refund)
   - [Workflow 10: High-Traffic Surge & Rate Limiting System](#workflow-10-high-traffic-surge--rate-limiting-system)
5. [Supabase SQL Functions & Stored Procedures (RPCs)](#5-supabase-sql-functions--stored-procedures-rpcs)
6. [Mongoose Query to Supabase JS Client Mapping Table](#6-mongoose-query-to-supabase-js-client-mapping-table)
7. [Step-by-Step Supabase Migration Plan](#7-step-by-step-supabase-migration-plan)

---

## 1. System Overview & Tech Stack

- **Platform**: Big Market 👌 (Quick-Commerce 15-Minute Online Grocery Platform)
- **Current Runtime**: Node.js (ES Modules), Express.js 4.19
- **Current Database**: MongoDB (Mongoose 8.3) with in-memory fallback (`mongodb-memory-server`)
- **Authentication**: Custom JWT (HMAC-SHA256, 30-day expiry), 9-digit numeric PIN constraint
- **Target Database**: Supabase (Managed PostgreSQL 15+) with Row Level Security (RLS) & RPC Functions

---

## 2. Current Architecture & File Map

```
backend/
├── server.js                   # Application entry point, router mountings, DB connect & seed
├── config/
│   └── db.js                   # MongoDB connection logic + MongoMemoryServer fallback
├── middleware/
│   ├── authMiddleware.js       # JWT verify (protect), role check (admin), token generator
│   └── trafficManager.js       # In-memory token bucket rate limiters, metrics, cache-control
├── models/
│   ├── User.js                 # User profile, embedded addresses, shopDetails, coins, wishlist
│   ├── Product.js              # Catalog items, nutritional details, dietary tags, reviews
│   ├── Order.js                # Orders, item snapshots, delivery slot, driver info, timeline
│   ├── Category.js             # Product categories & item counts
│   ├── Coupon.js               # Promo codes, discounts, validity
│   └── Notification.js         # User notifications & transactional alerts
├── routes/
│   ├── authRoutes.js           # Register, login, toggle-shopkeeper, /me
│   ├── productRoutes.js        # Catalog search, filter, autocomplete, reviews
│   ├── orderRoutes.js          # Create order, get user orders, welcome-offer status, order tracking
│   ├── categoryRoutes.js       # Categories listing + dynamic counts
│   ├── couponRoutes.js         # Active coupons & code validation
│   ├── userRoutes.js           # Update profile, address CRUD, daily claim, wishlist, notifications
│   ├── adminRoutes.js          # Admin dashboard metrics, inventory CRUD, orders & user statuses
│   ├── locationRoutes.js       # Serviceable Indian pincodes & dark store hubs
│   ├── recommendationRoutes.js # AI-driven product recommendations & complementary items
│   └── aiChatRoutes.js         # AI Customer Support & automated resolution endpoints
├── services/
│   └── aiChatService.js        # Intent classification, order tracking, instant refund logic
└── utils/
    └── seedData.js             # Initial database seed (official brand catalog, test users, coupons)
```

---

## 3. MongoDB Models vs. Supabase Relational Schema (DDL)

In MongoDB, document nesting (like embedded `addresses`, `items`, `reviews`, `timeline`) was used. In Supabase (PostgreSQL), we normalize these into dedicated relational tables with foreign keys, primary keys, and indexes.

### Complete Supabase PostgreSQL DDL

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. USERS TABLE
-- =====================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'shopkeeper', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    store_name VARCHAR(255) DEFAULT '',
    gst_number VARCHAR(50) DEFAULT '',
    business_type VARCHAR(100) DEFAULT 'Kirana & Retail Store',
    coins INTEGER NOT NULL DEFAULT 250,
    last_daily_claim TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================================
-- 2. USER ADDRESSES TABLE (Normalized from User.addresses)
-- =====================================================================
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(50) DEFAULT 'Home',
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    street TEXT NOT NULL,
    apartment TEXT DEFAULT '',
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_addresses_user ON user_addresses(user_id);

-- =====================================================================
-- 3. CATEGORIES TABLE
-- =====================================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    icon VARCHAR(50) DEFAULT '🛒',
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    item_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 4. PRODUCTS TABLE
-- =====================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(150) NOT NULL,
    category VARCHAR(150) NOT NULL,
    sub_category VARCHAR(150) DEFAULT 'General',
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    discount_percent INTEGER DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 50 CHECK (stock >= 0),
    weight VARCHAR(50) NOT NULL,
    sizes TEXT[] DEFAULT '{}',
    unit VARCHAR(50) DEFAULT 'pack',
    rating NUMERIC(2, 1) DEFAULT 4.5,
    review_count INTEGER DEFAULT 0,
    images TEXT[] NOT NULL DEFAULT '{}',
    description TEXT NOT NULL,
    key_features TEXT[] DEFAULT '{}',
    ingredients TEXT DEFAULT '100% Pure & Natural',
    nutrition JSONB DEFAULT '{"calories": "N/A", "protein": "N/A", "carbs": "N/A", "fat": "N/A"}'::jsonb,
    storage_info TEXT DEFAULT 'Store in a cool, dry place. Refrigerate after opening if applicable.',
    is_organic BOOLEAN DEFAULT false,
    is_veg BOOLEAN DEFAULT true,
    dietary_tags TEXT[] DEFAULT '{}',
    is_bestseller BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    is_deal BOOLEAN DEFAULT false,
    is_fresh_arrival BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search and filtering indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sub_category ON products(sub_category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_flags ON products(is_bestseller, is_trending, is_deal, is_fresh_arrival);
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- =====================================================================
-- 5. PRODUCT REVIEWS TABLE (Normalized from Product.reviews)
-- =====================================================================
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product_id ON product_reviews(product_id);

-- =====================================================================
-- 6. USER WISHLIST TABLE (Normalized Many-to-Many)
-- =====================================================================
CREATE TABLE user_wishlist (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- =====================================================================
-- 7. COUPONS TABLE
-- =====================================================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'flat' CHECK (discount_type IN ('flat', 'percentage')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2) DEFAULT 0,
    max_discount NUMERIC(10, 2) DEFAULT 500,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 8. ORDERS TABLE
-- =====================================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    shipping_address JSONB NOT NULL,
    delivery_slot JSONB NOT NULL DEFAULT '{"type": "express", "timeSlot": "15-25 Minutes"}'::jsonb,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('upi', 'card', 'netbanking', 'wallet', 'cod')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    order_status VARCHAR(50) NOT NULL DEFAULT 'Order Placed' CHECK (order_status IN ('Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')),
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    shopkeeper_discount NUMERIC(10, 2) DEFAULT 0,
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    taxes NUMERIC(10, 2) DEFAULT 0,
    coins_redeemed INTEGER DEFAULT 0,
    coins_discount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    estimated_delivery_time VARCHAR(50) DEFAULT '20-30 minutes',
    driver_info JSONB DEFAULT '{"name": "Ramesh Kumar", "phone": "+91 98765 43210", "vehicleNumber": "MH 02 EV 4092"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- =====================================================================
-- 9. ORDER ITEMS TABLE (Normalized from Order.items)
-- =====================================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(150) DEFAULT '',
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    weight VARCHAR(50) DEFAULT '',
    size VARCHAR(50) DEFAULT '',
    selected_size VARCHAR(50) DEFAULT '',
    image TEXT DEFAULT ''
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- =====================================================================
-- 10. ORDER TIMELINE TABLE (Normalized from Order.timeline)
-- =====================================================================
CREATE TABLE order_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    note TEXT DEFAULT ''
);

CREATE INDEX idx_order_timeline_order ON order_timeline(order_id);

-- =====================================================================
-- 11. NOTIFICATIONS TABLE
-- =====================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'order' CHECK (type IN ('order', 'promo', 'reward', 'system')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

---

## 4. Complete Backend Workflows & Logic Pipelines

### Workflow 1: Order Checkout & Atomic Stock Allocation

#### Current MongoDB Flow (`orderRoutes.js: L11-L132`):
1. **Cart Item Validation**: Check `items.length > 0`.
2. **Stock Verification Loop**: Iterate over items, execute `Product.findById(item.product)`, check `product.stock < item.quantity`.
3. **Stock Decrement**: Execute `Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })`.
4. **Shopkeeper Wholesale Tier Discounts**:
   - Condition: `req.user.role === 'shopkeeper' || req.body.isShopkeeperOrder`
   - If `subtotal > 9999` => Automatic Flat ₹1,599 OFF
   - If `subtotal > 2999` => Automatic Flat ₹500 OFF
   - Calculate `effectiveShopkeeperDiscount = Math.max(autoShopkeeperDiscount, clientShopkeeperDiscount)`
5. **Generate Order ID**: Prefix `B2B` (for shopkeeper) or `ORD` (for customer) + random 6 digits.
6. **Save Order**: Create document with `orderStatus: 'Confirmed'`, initial timeline entries (`Order Placed`, `Confirmed`).
7. **Gamification Coins Update**:
   - Deduct `coinsRedeemed`.
   - Calculate cashback coins: `isShopkeeper ? 7% : 5%` of `effectiveTotalAmount`.
   - Update `user.coins = Math.max(0, user.coins - coinsRedeemed + earnedCoins)`.
8. **Notification Creation**: Create welcome/confirmation notification.

#### Supabase/Postgres Replacement:
*In MongoDB, steps 2, 3, 6, 7, and 8 were performed across separate non-atomic queries.*
In Supabase, we execute this inside **one single atomic ACID transaction via a PostgreSQL RPC function** (`create_order_transaction`). If any product goes out of stock mid-checkout, the entire order rolls back safely!

---

### Workflow 2: First-3-Orders Welcome Offer Verification

#### Current MongoDB Flow (`orderRoutes.js: L145-L165`):
```javascript
const ordersCount = await Order.countDocuments({
  user: req.user._id,
  orderStatus: { $ne: 'Cancelled' }
});
const isEligible = ordersCount < 3;
```

#### Supabase JS Pipeline:
```javascript
const { count, error } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .neq('order_status', 'Cancelled');

const isEligible = count < 3;
return {
  ordersPlaced: count,
  isEligible,
  currentOrderNumber: Math.min(3, count + 1),
  ordersRemaining: Math.max(0, 3 - count),
  discountAmount: 100,
  minOrderValue: 199,
  freeDelivery: true,
  freeHandling: true
};
```

---

### Workflow 3: Product Search, Multi-Filter, Faceting & Aggregation

#### Current MongoDB Flow (`productRoutes.js: L8-L99`):
- Category equality matching.
- Subcategory array `$in` regex.
- Search term flexible regex across `name`, `brand`, `category`, `subCategory`, `description` with brand synonyms (`coke` -> `Coca-Cola`, `parle` -> `Parle`).
- Price range (`$gte`, `$lte`).
- Dietary tags array `$in`.
- Feature flags (`isDeal`, `isTrending`, `isBestSeller`, `isFreshArrival`).
- Dynamic sorting:
  - `price-low` -> `price: 1`
  - `price-high` -> `price: -1`
  - `rating` -> `rating: -1`
  - `discount` -> `discountPercent: -1`
  - `newest` -> `createdAt: -1`
  - default -> `isBestSeller: -1, rating: -1`
- Pagination: `skip`, `limit`, `countDocuments`.

#### Supabase JS Pipeline:
```javascript
let query = supabase.from('products').select('*', { count: 'exact' });

if (category && category !== 'All') {
  query = query.eq('category', category);
}

if (subCategory) {
  const subCats = subCategory.split(',').map(s => s.trim());
  query = query.in('sub_category', subCats);
}

if (search) {
  // PostgreSQL Full-Text Search / ILIKE
  query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,category.ilike.%${search}%,description.ilike.%${search}%`);
}

if (brand) {
  const brands = brand.split(',').map(b => b.trim());
  query = query.in('brand', brands);
}

if (dietary) {
  const tags = dietary.split(',').map(t => t.trim());
  query = query.overlaps('dietary_tags', tags);
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

const from = (page - 1) * limit;
const to = from + limit - 1;
query = query.range(from, to);

const { data: products, count, error } = await query;
```

---

### Workflow 4: Product Reviews & Dynamic Rating Recalculation

#### Current MongoDB Flow (`productRoutes.js: L144-L171`):
1. Find product by `_id`.
2. Push `{ userName, rating, comment, date }` to `product.reviews`.
3. Recalculate:
   - `product.reviewCount = product.reviews.length`
   - `product.rating = (sum of ratings / length).toFixed(1)`
4. Save product.

#### Supabase Database Trigger (Automatic in Postgres!):
Instead of doing this in application code, a PostgreSQL trigger on `product_reviews` automatically recalculates `products.rating` and `products.review_count`:

```sql
CREATE OR REPLACE FUNCTION update_product_rating_trigger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET 
        review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = NEW.product_id),
        rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM product_reviews WHERE product_id = NEW.product_id), 4.5)
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_review_insert
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating_trigger();
```

---

### Workflow 5: User Gamification & Daily SuperCoins Claim

#### Current MongoDB Flow (`userRoutes.js: L82-L112`):
1. Retrieve user by `req.user._id`.
2. Compare `user.lastDailyClaim` with current date:
   `isSameDay = lastClaim.toDateString() === now.toDateString()`.
3. If already claimed today => return HTTP 400.
4. Else:
   - `user.coins += 50`
   - `user.lastDailyClaim = now`
   - Save user.
   - Insert notification (`type: 'reward'`).

#### Supabase RPC Procedure:
```sql
CREATE OR REPLACE FUNCTION claim_daily_supercoins(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user users%ROWTYPE;
    v_reward INTEGER := 50;
BEGIN
    SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
    
    IF v_user.id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    IF v_user.last_daily_claim IS NOT NULL AND 
       DATE(v_user.last_daily_claim AT TIME ZONE 'Asia/Kolkata') = DATE(NOW() AT TIME ZONE 'Asia/Kolkata') THEN
        RETURN jsonb_build_object('success', false, 'message', 'You have already claimed today''s daily reward! Check back tomorrow.');
    END IF;
    
    UPDATE users 
    SET 
        coins = coins + v_reward,
        last_daily_claim = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
        p_user_id,
        'Daily Reward Claimed! 🪙',
        'You received +' || v_reward || ' SuperCoins for logging in today! Total balance: ' || (v_user.coins + v_reward) || ' Coins.',
        'reward'
    );
    
    RETURN jsonb_build_object('success', true, 'coins', v_user.coins + v_reward, 'message', 'Successfully claimed +50 SuperCoins!');
END;
$$ LANGUAGE plpgsql;
```

---

### Workflow 6: Wishlist Toggle & Lookup

#### Current MongoDB Flow (`userRoutes.js: L114-L144`):
- `User.wishlist` is an array of `ObjectId` refs.
- Index lookup: `user.wishlist.indexOf(productId)`.
- If exists: remove via `splice`.
- If not: `user.wishlist.push(productId)`.
- Re-query with `.populate('wishlist')`.

#### Supabase Relational Pattern:
In Supabase, this is a clean query on `user_wishlist`:
```javascript
// Toggle Wishlist
const { data: existing } = await supabase
  .from('user_wishlist')
  .select('*')
  .eq('user_id', userId)
  .eq('product_id', productId)
  .single();

if (existing) {
  await supabase.from('user_wishlist').delete().eq('user_id', userId).eq('product_id', productId);
} else {
  await supabase.from('user_wishlist').insert({ user_id: userId, product_id: productId });
}

// Fetch user wishlist with product join
const { data: wishlist } = await supabase
  .from('user_wishlist')
  .select('product_id, products(*)')
  .eq('user_id', userId);
```

---

### Workflow 7: Coupon Validation Engine

#### Current MongoDB Flow (`couponRoutes.js: L17-L58`):
1. Query `Coupon.findOne({ code: code.toUpperCase(), isActive: true })`.
2. Check `coupon.expiresAt && now > coupon.expiresAt`.
3. Check `subtotal < coupon.minOrderValue`.
4. Calculate discount:
   - If `percentage`: `Math.min(coupon.maxDiscount, Math.round((subtotal * coupon.discountValue) / 100))`.
   - If `flat`: `coupon.discountValue`.
5. Return validity and calculated discount.

#### Supabase JS Pipeline:
```javascript
const { data: coupon, error } = await supabase
  .from('coupons')
  .select('*')
  .eq('code', code.toUpperCase())
  .eq('is_active', true)
  .single();

if (!coupon) return res.status(404).json({ message: 'Invalid or expired coupon code' });

if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
  return res.status(400).json({ message: 'This coupon has expired' });
}

if (subtotal < coupon.min_order_value) {
  return res.status(400).json({ message: `Minimum order value of ₹${coupon.min_order_value} required for this coupon` });
}

let discount = 0;
if (coupon.discount_type === 'percentage') {
  discount = Math.round((subtotal * coupon.discount_value) / 100);
  if (coupon.max_discount && discount > coupon.max_discount) {
    discount = coupon.max_discount;
  }
} else {
  discount = coupon.discount_value;
}
```

---

### Workflow 8: Admin Dashboard Metrics & Financial Aggregations

#### Current MongoDB Flow (`adminRoutes.js: L21-L64`):
```javascript
const totalSalesRevenue = await Order.aggregate([
  { $match: { paymentStatus: 'completed', orderStatus: { $ne: 'Cancelled' } } },
  { $group: { _id: null, total: { $sum: '$totalAmount' } } }
]);

const totalOrders = await Order.countDocuments();
const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['Order Placed', 'Confirmed', 'Preparing'] } });
const totalCustomers = await User.countDocuments({ role: 'customer' });
const totalShopkeepers = await User.countDocuments({ role: 'shopkeeper' });
const totalProducts = await Product.countDocuments();
const lowStockProducts = await Product.find({ stock: { $lte: 10 } });
const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(6).populate('user');
```

#### Supabase SQL Function (One single ultra-fast query):
```sql
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
    v_revenue NUMERIC;
    v_total_orders INTEGER;
    v_pending_orders INTEGER;
    v_customers INTEGER;
    v_shopkeepers INTEGER;
    v_total_products INTEGER;
    v_low_stock JSONB;
    v_recent_orders JSONB;
BEGIN
    -- 1. Total Revenue
    SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue
    FROM orders
    WHERE payment_status = 'completed' AND order_status <> 'Cancelled';
    
    -- 2. Counts
    SELECT COUNT(*) INTO v_total_orders FROM orders;
    SELECT COUNT(*) INTO v_pending_orders FROM orders WHERE order_status IN ('Order Placed', 'Confirmed', 'Preparing');
    SELECT COUNT(*) INTO v_customers FROM users WHERE role = 'customer';
    SELECT COUNT(*) INTO v_shopkeepers FROM users WHERE role = 'shopkeeper';
    SELECT COUNT(*) INTO v_total_products FROM products;
    
    -- 3. Low stock products (<= 10)
    SELECT jsonb_agg(p) INTO v_low_stock
    FROM (
        SELECT id, name, brand, category, stock, price, images
        FROM products
        WHERE stock <= 10
        LIMIT 10
    ) p;
    
    -- 4. Recent orders with user details
    SELECT jsonb_agg(o) INTO v_recent_orders
    FROM (
        SELECT ord.id, ord.order_id, ord.total_amount, ord.order_status, ord.created_at,
               jsonb_build_object('name', u.name, 'email', u.email, 'role', u.role) as user
        FROM orders ord
        JOIN users u ON ord.user_id = u.id
        ORDER BY ord.created_at DESC
        LIMIT 6
    ) o;

    RETURN jsonb_build_object(
        'revenue', v_revenue,
        'totalOrders', v_total_orders,
        'pendingOrders', v_pending_orders,
        'totalCustomers', v_customers,
        'totalShopkeepers', v_shopkeepers,
        'totalProducts', v_total_products,
        'lowStockProducts', COALESCE(v_low_stock, '[]'::jsonb),
        'recentOrders', COALESCE(v_recent_orders, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;
```

---

### Workflow 9: AI Assistant Multi-Intent Engine & Instant Wallet Refund

#### Current Architecture (`aiChatService.js: L5-L281`):
1. **Context Loading**:
   - Resolve JWT Bearer token optionally.
   - Fetch authenticated user orders (`Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5)`).
2. **Intent Classification RegEx**:
   - `INTENT A: TRACK_ORDER`: Identifies order ID (`ORD\w+`, `BM-\w+`) or retrieves latest order, responds with driver info, vehicle number, and ETA.
   - `INTENT B: DELIVERY_ISSUE`: Responds with delivery partner contact, records delivery instructions, promises 50 SuperCoins on-time guarantee.
   - `INTENT C: REFUND_ISSUE` (Instant No-Questions-Asked Resolution):
     - Calculates affected item refund value.
     - Generates `refundReference` (`REF-XXXXXX`).
     - **Mutates User Record**: Credits `refundAmount` directly to `user.coins` (wallet balance).
     - Returns instant resolution card.
   - `INTENT D: COUPONS_OFFERS`: Retrieves current live offers, user's coin balance, promo codes (`FRESH20`, `BIGMEGA`).
   - `INTENT E: HUMAN_ESCALATION`: Escalates to 24/7 priority support queue (+91 1800 200 8899).
   - `INTENT F: PRODUCT_INQUIRY`: Parses natural language queries (e.g., "fresh milk", "chips"), performs live database search, returns product cards with `+ Add to Cart` CTA.
   - `INTENT G: GREETINGS & DEFAULT`: Contextual greetings with customer's first name and quick action chips.

#### Supabase Integration:
- In Supabase, the AI Chat Service remains in Node.js (or Supabase Edge Functions) using the Supabase client to fetch orders and execute instant wallet credits:
```javascript
// Instant refund wallet credit in Supabase
await supabase.rpc('credit_user_wallet_refund', {
  p_user_id: userId,
  p_amount: refundAmount,
  p_reason: `Damaged item refund for #${orderId}`
});
```

---

### Workflow 10: High-Traffic Surge & Rate Limiting System

#### Current System (`trafficManager.js: L1-L195`):
- In-memory sliding window rate limiters:
  - Global API: 600 requests / 15 minutes.
  - Auth: 30 attempts / 15 minutes.
  - Checkout / Orders: 50 requests / 15 minutes.
- Traffic Tracker: Computes live Requests Per Second (RPS), active connections, status code breakdown, peak concurrency, and latency.
- HTTP Cache Control (`catalogCacheControl`): Sets `Cache-Control: public, max-age=30, stale-while-revalidate=60` for catalog endpoints.

#### Supabase Migration Note:
- The rate limiter and traffic manager operate in Express middleware / reverse proxy layer (Cloudflare / Vercel Edge / Node.js) and can remain in Express or be handled by Supabase Kong API Gateway rate limits.

---

## 5. Supabase SQL Functions & Stored Procedures (RPCs)

Here is the primary transactional procedure for atomic checkout:

```sql
CREATE OR REPLACE FUNCTION create_order_transaction(
    p_user_id UUID,
    p_items JSONB, -- Array of objects: [{product_id, quantity, price, name, brand, weight, size, image}]
    p_shipping_address JSONB,
    p_delivery_slot JSONB,
    p_payment_method VARCHAR,
    p_subtotal NUMERIC,
    p_discount_amount NUMERIC,
    p_delivery_fee NUMERIC,
    p_taxes NUMERIC,
    p_coins_redeemed INTEGER,
    p_coins_discount NUMERIC,
    p_total_amount NUMERIC,
    p_is_shopkeeper_order BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_user users%ROWTYPE;
    v_item JSONB;
    v_product_id UUID;
    v_qty INTEGER;
    v_stock INTEGER;
    v_order_uuid UUID;
    v_order_id VARCHAR;
    v_auto_shopkeeper_discount NUMERIC := 0;
    v_effective_shopkeeper_discount NUMERIC := 0;
    v_total_discount NUMERIC := 0;
    v_cashback_rate NUMERIC;
    v_earned_coins INTEGER;
    v_new_coins INTEGER;
BEGIN
    -- 1. Lock user row
    SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
    IF v_user.id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- 2. Verify stock and decrement atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;

        SELECT stock INTO v_stock FROM products WHERE id = v_product_id FOR UPDATE;

        IF v_stock IS NULL THEN
            RAISE EXCEPTION 'Product with ID % no longer exists', v_product_id;
        END IF;

        IF v_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock. Only % units available', v_stock;
        END IF;

        -- Decrement stock
        UPDATE products SET stock = stock - v_qty WHERE id = v_product_id;
    END LOOP;

    -- 3. Shopkeeper wholesale discount calculation
    IF v_user.role = 'shopkeeper' OR p_is_shopkeeper_order = true THEN
        IF p_subtotal > 9999 THEN
            v_auto_shopkeeper_discount := 1599;
        ELSIF p_subtotal > 2999 THEN
            v_auto_shopkeeper_discount := 500;
        END IF;
    END IF;

    v_effective_shopkeeper_discount := v_auto_shopkeeper_discount;
    v_total_discount := GREATEST(p_discount_amount, v_effective_shopkeeper_discount);

    -- 4. Generate unique Order ID
    v_order_id := (CASE WHEN v_user.role = 'shopkeeper' THEN 'B2B' ELSE 'ORD' END) || 
                  FLOOR(100000 + RANDOM() * 900000)::TEXT;

    -- 5. Insert order
    INSERT INTO orders (
        order_id, user_id, shipping_address, delivery_slot,
        payment_method, payment_status, order_status,
        subtotal, discount_amount, shopkeeper_discount,
        delivery_fee, taxes, coins_redeemed, coins_discount,
        total_amount, estimated_delivery_time
    ) VALUES (
        v_order_id, p_user_id, p_shipping_address, p_delivery_slot,
        p_payment_method, 'completed', 'Confirmed',
        p_subtotal, v_total_discount, v_effective_shopkeeper_discount,
        p_delivery_fee, p_taxes, p_coins_redeemed, p_coins_discount,
        p_total_amount, '20-30 minutes'
    ) RETURNING id INTO v_order_uuid;

    -- 6. Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id, product_id, name, brand, price, quantity, weight, size, selected_size, image
        ) VALUES (
            v_order_uuid,
            (v_item->>'product_id')::UUID,
            v_item->>'name',
            COALESCE(v_item->>'brand', ''),
            (v_item->>'price')::NUMERIC,
            (v_item->>'quantity')::INTEGER,
            COALESCE(v_item->>'weight', ''),
            COALESCE(v_item->>'size', ''),
            COALESCE(v_item->>'selectedSize', ''),
            COALESCE(v_item->>'image', '')
        );
    END LOOP;

    -- 7. Insert initial timeline entries
    INSERT INTO order_timeline (order_id, status, timestamp, note)
    VALUES 
        (v_order_uuid, 'Order Placed', NOW(), 'Order successfully received'),
        (v_order_uuid, 'Confirmed', NOW() + INTERVAL '1 minute', 'Verified by Store Manager');

    -- 8. Deduct redeemed coins & calculate cashback
    v_cashback_rate := CASE WHEN v_user.role = 'shopkeeper' THEN 0.07 ELSE 0.05 END;
    v_earned_coins := FLOOR(p_total_amount * v_cashback_rate);
    v_new_coins := GREATEST(0, (v_user.coins - p_coins_redeemed) + v_earned_coins);

    UPDATE users SET coins = v_new_coins, updated_at = NOW() WHERE id = p_user_id;

    -- 9. Insert confirmation notification
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
        p_user_id,
        'Order #' || v_order_id || ' Confirmed! 🎉',
        'Your order of ₹' || p_total_amount || ' is confirmed! You earned ' || v_earned_coins || ' SuperCoins.',
        'order'
    );

    RETURN jsonb_build_object(
        'success', true,
        'orderUuid', v_order_uuid,
        'orderId', v_order_id,
        'totalAmount', p_total_amount,
        'earnedCoins', v_earned_coins,
        'newCoinsBalance', v_new_coins
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Mongoose Query to Supabase JS Client Mapping Table

| Mongoose Operation | Equivalent Supabase JS Client Query |
| :--- | :--- |
| `User.findOne({ email })` | `supabase.from('users').select('*').eq('email', email).single()` |
| `User.findById(id).select('-password')` | `supabase.from('users').select('id, name, email, phone, role, status, coins, shop_details, created_at').eq('id', id).single()` |
| `User.create(userData)` | `supabase.from('users').insert(userData).select().single()` |
| `Product.find(query).sort({ price: 1 }).skip(skip).limit(limit)` | `supabase.from('products').select('*').order('price', { ascending: true }).range(skip, skip + limit - 1)` |
| `Product.countDocuments(query)` | `supabase.from('products').select('*', { count: 'exact', head: true })` |
| `Product.distinct('category')` | `supabase.rpc('get_distinct_categories')` or `supabase.from('products').select('category')` |
| `Product.findByIdAndUpdate(id, { $inc: { stock: -qty } })` | `supabase.rpc('decrement_product_stock', { p_id: id, p_qty: qty })` |
| `Order.find({ user: userId }).sort({ createdAt: -1 })` | `supabase.from('orders').select('*, order_items(*), order_timeline(*)').eq('user_id', userId).order('created_at', { ascending: false })` |
| `Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }])` | `supabase.rpc('get_total_sales_revenue')` |
| `user.addresses.push(addr); await user.save();` | `supabase.from('user_addresses').insert({ user_id: userId, ...addr })` |
| `user.addresses.filter(a => a._id !== id);` | `supabase.from('user_addresses').delete().eq('id', addressId).eq('user_id', userId)` |
| `Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(20)` | `supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)` |

---

## 7. Step-by-Step Supabase Migration Plan

### Step 1: Initialize Supabase Project
1. Create a free project at [database.new](https://database.new).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run the complete SQL DDL schema and RPC functions from Section 3 & 5 above.

### Step 2: Install Supabase Client in Backend
```bash
cd backend
npm install @supabase/supabase-js
```

### Step 3: Configure Environment Variables
In `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=freshkart_secret_jwt_key_2026_production
PORT=5000
```

### Step 4: Create Supabase Client Config (`backend/config/supabase.js`)
```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

### Step 5: Replace Models with Supabase Query Repositories
- Replace Mongoose `User.js`, `Product.js`, `Order.js` calls in `routes/` with corresponding Supabase queries or call the created stored procedures (`create_order_transaction`, `claim_daily_supercoins`, etc.).
- Benefit: ACID transaction safety on checkout, native PostgreSQL foreign keys, and instant dashboard aggregates without in-memory calculation!
