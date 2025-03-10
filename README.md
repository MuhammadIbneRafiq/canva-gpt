# Canvas Chatbot

A web application that allows users to chat with an AI assistant about Canvas LMS assignments and course-related details.

## Features

- User authentication with Supabase
- Chat interface for interacting with the Canvas AI assistant
- Ability to provide Canvas context for more relevant responses
- Responsive design for desktop and mobile

## Tech Stack

### Frontend
- React with TypeScript
- Vite.js for fast development
- Tailwind CSS for styling
- Axios for API requests
- Supabase client for authentication

### Backend
- Node.js with Express
- Groq and HuggingFace for LLM and embeddings
- Supabase for database storage
- JWT for authentication

## Project Structure

```
canvas-api/
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── App.tsx       # Main app component
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── models/       # Data models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utility functions
│   │   └── index.js      # Entry point
│   └── package.json      # Backend dependencies
└── README.md             # Project documentation
```

## Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Groq API key
- HuggingFace API key

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   GROQ_API_KEY=your_groq_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Deployment

### Vercel Deployment
1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure the build settings:
   - Frontend build command: `cd frontend && npm install && npm run build`
   - Frontend output directory: `frontend/dist`
   - Backend build command: `cd backend && npm install`
   - Backend output directory: `backend`
4. Add environment variables in the Vercel dashboard
5. Deploy!

## License

MIT
