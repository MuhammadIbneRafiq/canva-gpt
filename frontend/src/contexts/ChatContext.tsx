import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { chatApi, ChatMessage } from '../services/api';
import { useAuth } from './AuthContext';
import { useCanvas } from './CanvasContext';

interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  canvasContext: string;
  sendMessage: (message: string) => Promise<void>;
  setCanvasContext: (context: string) => void;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasContext, setCanvasContext] = useState('');
  const { user } = useAuth();
  const { accessToken, setAccessToken } = useCanvas();

  // Load chat history from localStorage when component mounts
  useEffect(() => {
    if (user) {
      const savedMessages = localStorage.getItem(`chat_history_${user.id}`);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (error) {
          console.error('Error parsing saved messages:', error);
        }
      }
    }
  }, [user]);

  // Save chat history to localStorage when it changes
  useEffect(() => {
    if (user && messages.length > 0) {
      localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Extract Canvas token from message if present
  const extractCanvasToken = (message: string): string | null => {
    const tokenPatterns = [
      /token\s*=\s*([a-zA-Z0-9~_-]+)/i,
      /token\s*:\s*([a-zA-Z0-9~_-]+)/i,
      /token\s+([a-zA-Z0-9~_-]+)/i,
      /canvas\s+token\s*=\s*([a-zA-Z0-9~_-]+)/i,
      /canvas\s+token\s*:\s*([a-zA-Z0-9~_-]+)/i,
      /canvas\s+token\s+([a-zA-Z0-9~_-]+)/i,
      /access\s+token\s*=\s*([a-zA-Z0-9~_-]+)/i,
      /access\s+token\s*:\s*([a-zA-Z0-9~_-]+)/i,
      /access\s+token\s+([a-zA-Z0-9~_-]+)/i,
      /accessToken\s*=\s*([a-zA-Z0-9~_-]+)/i,
      /accessToken\s*:\s*([a-zA-Z0-9~_-]+)/i,
      /accessToken\s+([a-zA-Z0-9~_-]+)/i,
      /here\s+is\s+my\s+accessToken\s*:?\s*([a-zA-Z0-9~_-]+)/i,
      /([0-9]+~[a-zA-Z0-9_-]{20,})/i  // Pattern like "7542~kDzezt6ZV7xnTcXHZWr4QWtGWE8AQ27LZQYxBAaMrAhBRMU7ZHHNNE9vwPuHYUUZ"
    ];

    for (const pattern of tokenPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);

    // Check if message contains Canvas token
    const token = extractCanvasToken(message);
    if (token && !accessToken) {
      setAccessToken(token);
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Send message to API
      const response = await chatApi.sendMessage(message, messages, canvasContext);

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      setError(error.message || 'Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (user) {
      localStorage.removeItem(`chat_history_${user.id}`);
    }
  };

  return (
    <ChatContext.Provider 
      value={{ 
        messages, 
        loading, 
        error, 
        canvasContext,
        sendMessage, 
        setCanvasContext,
        clearChat 
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 