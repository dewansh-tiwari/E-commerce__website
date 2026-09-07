import express from 'express';
import jwt from 'jsonwebtoken';
import { processChatMessage, getQuickActions } from '../services/aiChatService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'freshkart_secret_jwt_key_2026_production';

// Helper to optionally resolve user from token without throwing 401
const resolveOptionalUser = async (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.id;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// POST /api/ai-chat/message - Send message to AI assistant
router.post('/message', async (req, res) => {
  try {
    const { message, history, context } = req.body;
    const userId = await resolveOptionalUser(req);

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const response = await processChatMessage({
      message,
      history,
      context,
      userId
    });

    res.json(response);
  } catch (error) {
    console.error('Error in AI Chat Route:', error);
    res.status(500).json({
      reply: "I am having trouble connecting right now, but our support team is available 24/7 at +91 1800 200 8899.",
      intent: 'ERROR',
      suggestions: ['Track My Order 🚚', 'Browse Groceries 🛒', 'Call Support 📞']
    });
  }
});

// GET /api/ai-chat/quick-actions - Fetch context-aware action chips
router.get('/quick-actions', async (req, res) => {
  try {
    const userId = await resolveOptionalUser(req);
    const actions = await getQuickActions(userId);
    res.json({ actions });
  } catch (error) {
    console.error('Error fetching quick actions:', error);
    res.status(500).json({ actions: [] });
  }
});

export default router;
