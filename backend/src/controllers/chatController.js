import chatService from '../services/chatService.js';
import canvasAgent from '../services/canvasAgent.js';
import { supabase } from '../index.js';

/**
 * Handle a new chat message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const handleChatMessage = async (req, res) => {
  try {
    const { message, chatHistory, canvasContext } = req.body;
    const userId = req.user?.id;
    
    console.log('\n========== NEW CHAT REQUEST ==========');
    console.log('User ID:', userId || 'Anonymous');
    console.log('Message:', message);
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Prepare chat history with the new message
    const updatedChatHistory = chatHistory || [];
    updatedChatHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Check if the message is Canvas-related
    const isCanvasRelated = isCanvasQuery(message);
    
    let response;
    
    if (isCanvasRelated) {
      // Process the chat with the Canvas agent
      console.log('Processing chat with Canvas agent...');
      response = await canvasAgent.processChat(updatedChatHistory);
    } else {
      // Process the chat with the regular LLM
      console.log('Processing chat with regular LLM...');
      response = await chatService.processChat(updatedChatHistory, canvasContext, userId);
    }
    
    console.log('Response received');

    // Add the AI response to the chat history
    updatedChatHistory.push({
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString()
    });

    console.log('AI Response:', response.content);
    console.log('========== CHAT REQUEST COMPLETED ==========\n');

    // Return the response
    res.status(200).json({
      message: response.content,
      chatHistory: updatedChatHistory,
      is_final: response.is_final,
      search_needed: response.search_needed
    });
  } catch (error) {
    console.error('Error in handleChatMessage:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
};

/**
 * Determine if a message is Canvas-related
 * @param {string} message - User message
 * @returns {boolean} - True if the message is Canvas-related
 */
function isCanvasQuery(message) {
  const canvasKeywords = [
    'canvas',
    'course',
    'class',
    'assignment',
    'homework',
    'announcement',
    'module',
    'due',
    'grade',
    'submission',
    'token'
  ];
  
  const lowerMessage = message.toLowerCase();
  
  return canvasKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Get chat history for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.user_id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get chat history from Supabase
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Format the chat history
    const formattedHistory = data.map(item => [
      {
        role: 'user',
        content: item.user_message,
        timestamp: item.created_at
      },
      {
        role: 'assistant',
        content: item.ai_response,
        timestamp: item.created_at
      }
    ]).flat();

    res.status(200).json({ chatHistory: formattedHistory });
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
};

export default {
  handleChatMessage,
  getChatHistory
}; 