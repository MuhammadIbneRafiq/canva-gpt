import { createContext, useContext, useState, ReactNode } from 'react';
import { chatApi, ChatMessage } from '../services/api';
import { useAuth } from './AuthContext';

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

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);

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