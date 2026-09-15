import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { seedDatabase } from './utils/seedData.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import aiChatRoutes from './routes/aiChatRoutes.js';

import compression from 'compression';
import {
  trafficTracker,
  globalTrafficLimiter,
  authRateLimiter,
  orderRateLimiter,
  catalogCacheControl,
  getTrafficStats
} from './middleware/trafficManager.js';

dotenv.config();

const app = express();

// High-Traffic Optimizations: Response Compression & CORS
app.use(compression());
app.use(cors());
app.use(express.json());

// Real-time Traffic Tracking & Global Rate Limiting
app.use(trafficTracker);
app.use('/api', globalTrafficLimiter);

// Route-Specific Protection & Cache Controls
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/products', catalogCacheControl, productRoutes);
app.use('/api/categories', catalogCacheControl, categoryRoutes);
app.use('/api/orders', orderRateLimiter, orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/ai-chat', aiChatRoutes);

// Public Traffic Health & Status Check
app.get('/api/traffic/status', (req, res) => {
  res.json(getTrafficStats());
});

// Base Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', app: 'Big Market 👌 Grocery API', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Initialize Server & Seed DB
const startServer = async () => {
  await connectDB();
  await seedDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Big Market 👌 Backend Server running on http://localhost:${PORT}`);
  });
};

startServer();
