# Quick Start Guide

Get GenAI Stack up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Python 3.11+ installed
- Supabase account (free tier works)
- Groq API key (free tier available)

## Step 1: Clone and Setup

```bash
# Clone the repository (or use this project directory)
cd genai-stack

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Step 2: Configure Environment Variables

### Frontend (.env)

```bash
# Create .env file in project root
cp .env.example .env

# Edit .env with your credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:8000
```

### Backend (backend/.env)

```bash
# Create .env file in backend directory
cp backend/.env.example backend/.env

# Edit backend/.env with your credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
SERPAPI_KEY=your_serpapi_key  # Optional
```

## Step 3: Get Your API Keys

### Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (takes ~2 minutes)
3. Go to Project Settings → API
4. Copy the "Project URL" and "anon public" key
5. The database schema is already set up automatically!

### Groq

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you won't see it again!)

### SerpAPI (Optional - for web search)

1. Go to [serpapi.com](https://serpapi.com)
2. Sign up for free account
3. Get your API key from dashboard

## Step 4: Start the Application

### Terminal 1 - Backend

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

Backend will start at `http://localhost:8000`

### Terminal 2 - Frontend

```bash
# From project root
npm run dev
```

Frontend will start at `http://localhost:5173`

## Step 5: Create Your First Workflow

1. Open `http://localhost:5173` in your browser
2. Click "New Stack" button
3. Enter a name like "My First AI Assistant"
4. Drag components onto the canvas:
   - User Query (left side)
   - LLM Engine (middle)
   - Output (right side)
5. Connect them: User Query → LLM Engine → Output
6. Click on LLM Engine component
7. Enter your Groq API key
8. Choose a model (Mixtral 8x7B recommended)
9. Click "Save Configuration"

## Step 6: Test Your Workflow

1. Click "Chat with Stack" button
2. Type a question like "What is artificial intelligence?"
3. Press Enter or click Send
4. Watch your AI workflow in action!

## Adding Documents (Optional)

Want to chat with your documents?

1. Drag a "Knowledge Base" component between User Query and LLM Engine
2. Connect: User Query → Knowledge Base → LLM Engine → Output
3. Click on Knowledge Base component
4. Upload a PDF or TXT file
5. Wait for processing
6. Now ask questions about your document!

## Common Issues

### Frontend won't start

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Backend won't start

```bash
# Check Python version
python --version  # Should be 3.11+

# Recreate virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database connection fails

- Verify Supabase URL starts with `https://`
- Check anon key has no extra spaces
- Ensure project is not paused (Supabase pauses inactive projects)

### LLM not responding

- Verify Groq API key is correct
- Check you have credits/quota remaining
- Try a different model

## Docker Quick Start (Alternative)

If you prefer Docker:

```bash
# Create .env file with all credentials
cp .env.example .env
# Edit .env with your keys

# Start with Docker Compose
docker-compose up --build

# Access at http://localhost:3000
```

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Explore different LLM models and settings
- Try web search integration
- Build more complex workflows

## Need Help?

- Check the logs in your terminals
- Verify all environment variables are set
- Ensure all services are running
- Open an issue on GitHub

## Example Workflows

### Simple Q&A Bot
```
User Query → LLM Engine → Output
```

### Document Chat
```
User Query → Knowledge Base → LLM Engine → Output
```

### Web-Enhanced Assistant
```
User Query → LLM Engine (with web search enabled) → Output
```

### Document + Web Search
```
User Query → Knowledge Base → LLM Engine (with web search) → Output
```

Enjoy building with GenAI Stack!
