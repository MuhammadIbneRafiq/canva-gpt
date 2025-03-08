import { useState, FormEvent, ChangeEvent } from 'react';
import { useCanvas } from '../contexts/CanvasContext';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled = false }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const { accessToken } = useCanvas();
  
  // Check if message contains a Canvas token
  const hasCanvasToken = (text: string): boolean => {
    const tokenPattern = /([0-9]+~[a-zA-Z0-9_-]{20,})/i;
    return tokenPattern.test(text);
  };
  
  const isTokenDetected = hasCanvasToken(message);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    await onSendMessage(message);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      {isTokenDetected && (
        <div className="absolute -top-10 left-0 right-0 bg-canvas-green bg-opacity-10 text-canvas-green p-2 rounded-md border border-canvas-green border-opacity-20 text-sm">
          Canvas token detected! This will be saved for future use.
        </div>
      )}
      
      <div className="flex items-center">
        <div className="relative flex-grow">
          <textarea
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            placeholder={accessToken ? "Ask me anything about your Canvas data..." : "Enter your Canvas token or ask a question..."}
            className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[50px] max-h-[150px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {accessToken && (
            <div className="absolute top-2 right-12 bg-canvas-green text-white text-xs px-2 py-1 rounded-full">
              Token ✓
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="ml-2 p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default ChatInput; 