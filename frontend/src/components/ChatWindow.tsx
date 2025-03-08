import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChat } from '../contexts/ChatContext';

const ChatWindow = () => {
  const { messages, loading, error, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-canvas-dark text-white py-3 px-4 shadow-md">
        <h2 className="text-lg font-semibold">Canvas Assistant</h2>
        <p className="text-xs text-gray-300">Ask me anything about your Canvas courses, assignments, and announcements</p>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary-600">
                  <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                  <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                  <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-canvas-dark">Welcome to Canvas Assistant</h3>
              <p className="text-gray-600 mb-4">I can help you access and understand your Canvas data. Try asking me about your courses, assignments, or announcements.</p>
              <div className="space-y-2 text-left text-sm text-gray-600">
                <p className="p-2 bg-gray-100 rounded-md">"Show me my courses"</p>
                <p className="p-2 bg-gray-100 rounded-md">"What assignments do I have?"</p>
                <p className="p-2 bg-gray-100 rounded-md">"Show me announcements from Computer Systems"</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
          </>
        )}
        {error && (
          <div className="bg-canvas-red bg-opacity-10 text-canvas-red p-3 rounded-lg mb-4 border border-canvas-red border-opacity-20">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-lg rounded-tl-none shadow-message">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 bg-white p-4">
        <ChatInput onSendMessage={sendMessage} disabled={loading} />
      </div>
    </div>
  );
};

export default ChatWindow; 