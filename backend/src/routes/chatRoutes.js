import express from 'express';
import { handleChatMessage, getChatHistory } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat - Send a message to the chatbot
router.post('/', handleChatMessage);

// GET /api/chat/history/:user_id - Get chat history for a user
router.get('/history/:user_id', getChatHistory);

export default router; 