import express from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', register);

// POST /api/auth/login - Login a user
router.post('/login', login);

// POST /api/auth/logout - Logout a user
router.post('/logout', logout);

// GET /api/auth/user - Get the current user
router.get('/user', getCurrentUser);

export default router; 