-- =====================================================================
-- Big Market 👌 — Supabase PostgreSQL Database Schema
-- Complete DDL, Triggers, Indexes & ACID Stored Procedures
-- =====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================================
-- 2. USERS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================================
-- 3. USER ADDRESSES TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_addresses (
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

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);

-- =====================================================================
-- 4. CATEGORIES TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS categories (
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

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- =====================================================================
-- 5. PRODUCTS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS products (
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

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(sub_category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_flags ON products(is_bestseller, is_trending, is_deal, is_fresh_arrival);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- Trigger: Automatically calculate discount percentage
CREATE OR REPLACE FUNCTION calculate_product_discount_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.original_price > NEW.price THEN
        NEW.discount_percent := ROUND(((NEW.original_price - NEW.price) / NEW.original_price) * 100);
    ELSE
        NEW.discount_percent := 0;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calc_product_discount ON products;
CREATE TRIGGER trg_calc_product_discount
BEFORE INSERT OR UPDATE OF price, original_price ON products
FOR EACH ROW EXECUTE FUNCTION calculate_product_discount_trigger();

-- =====================================================================
-- 6. PRODUCT REVIEWS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON product_reviews(product_id);

-- Trigger: Automatically update rating and review_count on products
CREATE OR REPLACE FUNCTION update_product_rating_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_prod_id UUID;
BEGIN
    v_prod_id := COALESCE(NEW.product_id, OLD.product_id);
    UPDATE products
    SET 
        review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = v_prod_id),
        rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM product_reviews WHERE product_id = v_prod_id), 4.5)
    WHERE id = v_prod_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_review_change ON product_reviews;
CREATE TRIGGER trg_after_review_change
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating_trigger();

-- =====================================================================
-- 7. USER WISHLIST TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_wishlist (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- =====================================================================
-- 8. COUPONS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS coupons (
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
-- 9. ORDERS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS orders (
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

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- =====================================================================
-- 10. ORDER ITEMS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS order_items (
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

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =====================================================================
-- 11. ORDER TIMELINE TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS order_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    note TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_order_timeline_order ON order_timeline(order_id);

-- =====================================================================
-- 12. NOTIFICATIONS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'order' CHECK (type IN ('order', 'promo', 'reward', 'system')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- =====================================================================
-- STORED PROCEDURE 1: ATOMIC ORDER CHECKOUT TRANSACTION
-- =====================================================================
CREATE OR REPLACE FUNCTION create_order_transaction(
    p_user_id UUID,
    p_items JSONB,
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

        UPDATE products SET stock = stock - v_qty WHERE id = v_product_id;
    END LOOP;

    -- 3. Shopkeeper wholesale discount rule
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

    -- 7. Insert timeline
    INSERT INTO order_timeline (order_id, status, timestamp, note)
    VALUES 
        (v_order_uuid, 'Order Placed', NOW(), 'Order successfully received'),
        (v_order_uuid, 'Confirmed', NOW() + INTERVAL '1 minute', 'Verified by Store Manager');

    -- 8. Deduct redeemed coins & calculate cashback
    v_cashback_rate := CASE WHEN v_user.role = 'shopkeeper' THEN 0.07 ELSE 0.05 END;
    v_earned_coins := FLOOR(p_total_amount * v_cashback_rate);
    v_new_coins := GREATEST(0, (v_user.coins - p_coins_redeemed) + v_earned_coins);

    UPDATE users SET coins = v_new_coins, updated_at = NOW() WHERE id = p_user_id;

    -- 9. Insert notification
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

-- =====================================================================
-- STORED PROCEDURE 2: DAILY SUPERCOINS CLAIM
-- =====================================================================
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

-- =====================================================================
-- STORED PROCEDURE 3: ADMIN DASHBOARD AGGREGATED METRICS
-- =====================================================================
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
    SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue
    FROM orders
    WHERE payment_status = 'completed' AND order_status <> 'Cancelled';
    
    SELECT COUNT(*) INTO v_total_orders FROM orders;
    SELECT COUNT(*) INTO v_pending_orders FROM orders WHERE order_status IN ('Order Placed', 'Confirmed', 'Preparing');
    SELECT COUNT(*) INTO v_customers FROM users WHERE role = 'customer';
    SELECT COUNT(*) INTO v_shopkeepers FROM users WHERE role = 'shopkeeper';
    SELECT COUNT(*) INTO v_total_products FROM products;
    
    SELECT jsonb_agg(p) INTO v_low_stock
    FROM (
        SELECT id, name, brand, category, stock, price, images
        FROM products
        WHERE stock <= 10
        LIMIT 10
    ) p;
    
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

-- =====================================================================
-- STORED PROCEDURE 4: AI CHAT INSTANT WALLET REFUND CREDIT
-- =====================================================================
CREATE OR REPLACE FUNCTION credit_user_wallet_refund(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_new_coins INTEGER;
BEGIN
    UPDATE users
    SET coins = coins + p_amount::INTEGER, updated_at = NOW()
    WHERE id = p_user_id
    RETURNING coins INTO v_new_coins;

    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
        p_user_id,
        'Wallet Refund Credited! 💰',
        '₹' || p_amount || ' (' || p_amount || ' SuperCoins) credited to your wallet for: ' || p_reason,
        'reward'
    );

    RETURN jsonb_build_object('success', true, 'newCoinsBalance', v_new_coins);
END;
$$ LANGUAGE plpgsql;
