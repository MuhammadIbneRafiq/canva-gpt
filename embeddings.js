// embeddings.js
const { Groq } = require('groq-sdk');
const { HuggingFaceInferenceEmbeddings } = require("@langchain/community/embeddings/hf");

// Directly instantiate Groq with the API key
const groq = new Groq({
  apiKey: 'your_actual_groq_api_key_here' // Replace with your actual API key
});

// Check if HuggingFaceInferenceEmbeddings is a function or an object
const hf = HuggingFaceInferenceEmbeddings ? new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY, // Keep this if you want to use the environment variable for Hugging Face
    model: "sentence-transformers/all-MiniLM-L6-v2",
}) : null;

if (!hf) {
    console.error("HuggingFaceInferenceEmbeddings is not available or not a constructor.");
}

async function generateEmbedding(text) {
  if (!text) {
    throw new Error("Text is required for generating embeddings");
  }
  
  console.log("Generating embedding for text:", text.substring(0, 100) + "...");
  try {
        const embedding = await hf.embedQuery(text);
        return embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}

async function generateEmbedding1(text) {
    console.log('Generating embedding for text:', text);
    try {
      const response = await groq.embeddings.create({
        model: "text-embedding-ada-002",
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
}

module.exports = {
    generateEmbedding,
    generateEmbedding1
};