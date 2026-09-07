import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

export const seedSupabase = async () => {
  console.log('🌱 Starting Supabase Seeding for Big Market 👌 ...');

  try {
    // 1. Seed Categories
    console.log('📦 Seeding Categories...');
    const categories = [
      { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', icon: '🥦', description: 'Farm fresh fruits and green vegetables delivered in 15 mins' },
      { name: 'Dairy & Breakfast', slug: 'dairy-breakfast', icon: '🥛', description: 'Fresh milk, curd, butter, paneer, and breakfast essentials' },
      { name: 'Snacks & Munchies', slug: 'snacks-munchies', icon: '🍿', description: 'Chips, namkeen, wafers, and evening snacks' },
      { name: 'Bakery & Biscuits', slug: 'bakery-biscuits', icon: '🍞', description: 'Artisan cakes, daily breads, cookies, and rusk' },
      { name: 'Beverages & Cold Drinks', slug: 'beverages-cold-drinks', icon: '🥤', description: 'Sodas, natural juices, energy drinks, and gourmet coffee' },
      { name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', icon: '🌾', description: 'Chakki fresh atta, basmati rice, pulses, and cooking oils' },
      { name: 'Masalas & Spices', slug: 'masalas-spices', icon: '🌶️', description: 'Whole & grounded spices, turmeric, and everyday condiments' },
      { name: 'Personal Care & Hygiene', slug: 'personal-care-hygiene', icon: '🧼', description: 'Soaps, shampoos, face wash, and oral hygiene' },
      { name: 'Cleaning & Household', slug: 'cleaning-household', icon: '🧹', description: 'Floor cleaners, detergents, dishwash, and toilet essentials' },
      { name: 'Baby Care & Wellness', slug: 'baby-care-wellness', icon: '👶', description: 'Diaper pants, gentle baby wipes, and baby nutrition' },
      { name: 'Pet Care & Food', slug: 'pet-care-food', icon: '🐾', description: 'Premium dog and cat food, chew treats, and pet grooming' },
      { name: 'Footwear & Fashion', slug: 'footwear-fashion', icon: '👟', description: 'Comfort casual shoes, daily flip-flops, and sports apparel' }
    ];

    for (const cat of categories) {
      await supabase.from('categories').upsert(cat, { onConflict: 'name' });
    }

    // 2. Seed Test Users
    console.log('👤 Seeding Test Users...');
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('987654321', salt);
    const userHash = await bcrypt.hash('123456789', salt);

    // Admin
    const { data: adminUser } = await supabase
      .from('users')
      .upsert({
        name: 'Big Market 👌 Admin',
        email: 'admin@bigmarket.com',
        password_hash: adminHash,
        phone: '+91 98765 00000',
        role: 'admin',
        status: 'active',
        coins: 1000
      }, { onConflict: 'email' })
      .select()
      .single();

    // Customer
    const { data: customerUser } = await supabase
      .from('users')
      .upsert({
        name: 'Rahul Sharma',
        email: 'customer@bigmarket.com',
        password_hash: userHash,
        phone: '+91 98123 45678',
        role: 'customer',
        status: 'active',
        coins: 450
      }, { onConflict: 'email' })
      .select()
      .single();

    if (customerUser) {
      await supabase.from('user_addresses').upsert({
        user_id: customerUser.id,
        title: 'Home',
        name: 'Rahul Sharma',
        phone: '+91 98123 45678',
        street: 'Flat 402, Green Meadows, Link Road',
        apartment: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip_code: '400050',
        is_default: true
      });
    }

    // Shopkeeper
    await supabase.from('users').upsert({
      name: 'Gupta Kirana & General Store',
      email: 'shopkeeper@bigmarket.com',
      password_hash: userHash,
      phone: '+91 98765 11223',
      role: 'shopkeeper',
      status: 'active',
      store_name: 'Gupta Kirana Store',
      gst_number: '27AABCG1234F1Z5',
      coins: 800
    }, { onConflict: 'email' });

    // 3. Seed Coupons
    console.log('🎟️ Seeding Active Coupons...');
    const coupons = [
      {
        code: 'WELCOME100',
        description: 'First 3 Orders Special: Flat ₹100 OFF on orders above ₹199 + Free Delivery',
        discount_type: 'flat',
        discount_value: 100,
        min_order_value: 199,
        is_active: true
      },
      {
        code: 'FRESH20',
        description: '20% OFF on Fruits & Fresh Vegetables (Max discount ₹100)',
        discount_type: 'percentage',
        discount_value: 20,
        min_order_value: 199,
        max_discount: 100,
        is_active: true
      },
      {
        code: 'BIGMEGA',
        description: 'Mega Wholesale Savings: Flat ₹150 OFF on orders above ₹799',
        discount_type: 'flat',
        discount_value: 150,
        min_order_value: 799,
        is_active: true
      },
      {
        code: 'SNACK10',
        description: '10% OFF on Snacks, Biscuits & Cold Drinks',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_value: 149,
        max_discount: 50,
        is_active: true
      }
    ];

    for (const coup of coupons) {
      await supabase.from('coupons').upsert(coup, { onConflict: 'code' });
    }

    // 4. Seed Essential Official Products
    console.log('🛒 Seeding Official Grocery Products...');
    const products = [
      {
        name: 'Amul Taaza Homogenised Toned Milk',
        brand: 'Amul',
        category: 'Dairy & Breakfast',
        sub_category: 'Milk',
        price: 27,
        original_price: 30,
        discount_percent: 10,
        stock: 120,
        weight: '500 ml',
        unit: 'pouch',
        rating: 4.8,
        review_count: 340,
        images: ['/products/official/amul-milk.jpg'],
        description: 'Fresh toned milk, rich in calcium and vitamins. Homogenised for smooth texture.',
        is_bestseller: true,
        is_trending: true,
        dietary_tags: ['Veg', 'Calcium-Rich']
      },
      {
        name: 'Amul Butter - Pasteurised',
        brand: 'Amul',
        category: 'Dairy & Breakfast',
        sub_category: 'Butter & Cheese',
        price: 56,
        original_price: 60,
        discount_percent: 7,
        stock: 85,
        weight: '100 g',
        unit: 'pack',
        rating: 4.9,
        review_count: 512,
        images: ['/products/official/amul-butter.jpg'],
        description: 'Utterly Butterly Delicious Amul Butter made from pure fresh cream.',
        is_bestseller: true,
        dietary_tags: ['Veg']
      },
      {
        name: 'Aashirvaad Shudh Chakki Atta',
        brand: 'Aashirvaad',
        category: 'Atta, Rice & Dal',
        sub_category: 'Atta & Flours',
        price: 245,
        original_price: 285,
        discount_percent: 14,
        stock: 75,
        weight: '5 kg',
        unit: 'bag',
        rating: 4.7,
        review_count: 420,
        images: ['/products/official/aashirvaad-atta.jpg'],
        description: '100% pure whole wheat grain atta ground in traditional stone chakki.',
        is_bestseller: true,
        dietary_tags: ['Veg', 'Fiber-Rich']
      },
      {
        name: "Lay's India's Magic Masala Chips",
        brand: "Lay's",
        category: 'Snacks & Munchies',
        sub_category: 'Chips & Crisps',
        price: 20,
        original_price: 20,
        discount_percent: 0,
        stock: 150,
        weight: '50 g',
        unit: 'pack',
        rating: 4.6,
        review_count: 189,
        images: ['/products/official/lays-magic-masala.jpg'],
        description: 'Crunchy ridged potato chips flavored with spicy aromatic Indian masalas.',
        is_trending: true,
        is_deal: true,
        dietary_tags: ['Veg']
      },
      {
        name: 'Coca-Cola Original Taste Can',
        brand: 'Coca-Cola',
        category: 'Beverages & Cold Drinks',
        sub_category: 'Soft Drinks',
        price: 40,
        original_price: 40,
        discount_percent: 0,
        stock: 110,
        weight: '300 ml',
        unit: 'can',
        rating: 4.7,
        review_count: 140,
        images: ['/products/quickcommerce/coca-cola-can-multipack.jpg'],
        description: 'Classic refreshing carbonated beverage best served ice cold.',
        is_trending: true,
        dietary_tags: ['Veg']
      },
      {
        name: 'Britannia Good Day Butter Cookies',
        brand: 'Britannia',
        category: 'Bakery & Biscuits',
        sub_category: 'Cookies',
        price: 30,
        original_price: 35,
        discount_percent: 14,
        stock: 95,
        weight: '200 g',
        unit: 'pack',
        rating: 4.5,
        review_count: 98,
        images: ['/products/official/britannia-good-day.jpg'],
        description: 'Rich buttery cookies with a signature smile design and delightful crunch.',
        is_deal: true,
        dietary_tags: ['Veg']
      },
      {
        name: 'Dettol Original Bathing Soap Bar',
        brand: 'Dettol',
        category: 'Personal Care & Hygiene',
        sub_category: 'Soaps',
        price: 48,
        original_price: 55,
        discount_percent: 13,
        stock: 100,
        weight: '125 g',
        unit: 'bar',
        rating: 4.8,
        review_count: 230,
        images: ['/products/official/dettol-soap.jpg'],
        description: 'Provides 100% better germ protection compared to ordinary soaps.',
        is_bestseller: true,
        dietary_tags: ['Antiseptic']
      }
    ];

    for (const prod of products) {
      await supabase.from('products').insert(prod);
    }

    console.log('✅ Supabase Seeding Completed Successfully!');
  } catch (err) {
    console.error('❌ Error during Supabase seeding:', err.message);
  }
};

// Direct script execution
if (process.argv[1]?.endsWith('seedSupabase.js')) {
  seedSupabase();
}
