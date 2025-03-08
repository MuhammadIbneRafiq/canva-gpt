import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Auth API
export const authApi = {
  register: async (email: string, password: string, name?: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/user');
    return response.data;
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (message: string, chatHistory: ChatMessage[] = [], canvasContext: string = '') => {
    const response = await api.post('/chat', { message, chatHistory, canvasContext });
    return response.data;
  },
  
  getChatHistory: async (userId: string) => {
    const response = await api.get(`/chat/history/${userId}`);
    return response.data;
  },
};

export default {
  authApi,
  chatApi,
  supabase,
}; 