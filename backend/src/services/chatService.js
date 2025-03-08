import { Groq } from 'groq-sdk';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { ChatGroq } from '@langchain/groq';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { supabase } from '../index.js';
import canvasService from './canvasService.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Initialize HuggingFace embeddings
const hf = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

// Initialize LLM model
const llmModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama3-70b-8192",
});

/**
 * Generate embeddings for text
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<Array<number>>} - Embedding vector
 */
export async function generateEmbedding(text) {
  if (!text) {
    throw new Error("Text is required for generating embeddings");
  }
  
  try {
    const embedding = await hf.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Alternative embedding generation using Groq
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<Array<number>>} - Embedding vector
 */
export async function generateEmbeddingWithGroq(text) {
  try {
    const response = await groq.embeddings.create({
      model: "text-embedding-ada-002",
      input: text
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding with Groq:', error);
    throw error;
  }
}

/**
 * Process a chat message with the Canvas LLM
 * @param {Array} chatHistory - Array of previous chat messages
 * @param {string} canvasContext - Optional Canvas context information
 * @param {string} userId - User ID for fetching Canvas data
 * @returns {Promise<Object>} - LLM response
 */
export async function processChat(chatHistory, canvasContext = '', userId = null) {
  try {
    let contextData = canvasContext;

    // If userId is provided and no context is provided, try to fetch Canvas data
    if (userId && !contextData) {
      try {
        const tokenData = await canvasService.getCanvasToken(userId);
        
        if (tokenData) {
          // Fetch courses
          const courses = await canvasService.getUserCourses(
            tokenData.access_token, 
            tokenData.canvas_url
          );
          
          // Format courses data for context
          if (courses && courses.length > 0) {
            contextData = `User's Canvas Courses:\n`;
            courses.forEach((course, index) => {
              contextData += `${index + 1}. ${course.name} (ID: ${course.id})\n`;
            });
          }
        }
      } catch (error) {
        console.error('Error fetching Canvas data for context:', error);
        // Continue without Canvas data if there's an error
      }
    }

    const prompt = `
      You are an AI assistant helping students interact with assignments or other course-related details from Canvas LMS.
      Relevant information from Canvas:
      ${contextData}

      Chat history:
      ${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

      Please provide a helpful response based on the chat history and Canvas information.
      If the user is asking about specific courses or assignments and you don't have that information,
      suggest that they provide their Canvas access token to get personalized information.
    `;

    const parser = StructuredOutputParser.fromNamesAndDescriptions({
      content: "Next message to the conversation",
      is_final: "Boolean indicating if this is the final message in the conversation",
      search_needed: "Boolean indicating if there is a need to search for more information"
    });

    // Direct call to Groq API for more control
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an AI assistant helping students interact with Canvas LMS."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-70b-8192",
    });

    // Extract the response content
    const responseContent = completion.choices[0].message.content;

    // Store the chat in Supabase
    await storeChat(chatHistory[chatHistory.length - 1].content, responseContent, userId);

    return {
      content: responseContent,
      is_final: false,
      search_needed: false
    };
  } catch (error) {
    console.error("Error processing chat:", error);
    throw error;
  }
}

/**
 * Store chat messages in Supabase
 * @param {string} userMessage - User's message
 * @param {string} aiResponse - AI's response
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function storeChat(userMessage, aiResponse, userId = null) {
  try {
    // Store the conversation in Supabase
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        { 
          user_message: userMessage, 
          ai_response: aiResponse,
          user_id: userId,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error("Error storing chat in Supabase:", error);
    }
  } catch (error) {
    console.error("Error in storeChat:", error);
  }
}

export default {
  generateEmbedding,
  generateEmbeddingWithGroq,
  processChat
}; 